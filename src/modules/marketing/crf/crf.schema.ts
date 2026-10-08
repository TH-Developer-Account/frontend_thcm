// crf/crf.schema.ts
// Zod schema + validation/format helpers for the CRF module.
//
// Single source of truth for:
//   • what a valid CRF line item / CRF form looks like
//   • every validation message shown in the CRF UI
//   • normalisation before the payload is built (rounding, trimming, totals)
//   • display formatting (₹ amounts, quantities, artwork sizes)
//
// Written against the common Zod API (string/number/array/object, superRefine,
// transform, safeParse) so it behaves the same on Zod v3 and v4. Number fields
// use a custom helper instead of z.number() so every message is ours, not
// Zod's default "Expected number, received nan".

import { z } from "zod";

import {
	ARTWORK_CUSTOM_PRESET,
	ARTWORK_RESOLUTION_PRESETS,
	CRF_CATEGORIES,
	type CrfCategory,
	type CrfLineItem,
} from "./crf.types";

/* ========================================================================== */
/*                                   Limits                                   */
/* ========================================================================== */

export const CRF_LIMITS = {
	/** Max distinct lines in one CRF. */
	MAX_LINE_ITEMS: 100,
	/** Max quantity on a single line. */
	MAX_QUANTITY: 10_000,
	/** Max unit rate (₹10 crore) — guards against typos like an extra 0s. */
	MAX_RATE: 100_000_000,
	/** Max artwork width / height for legacy physical units (ft/in/cm/m). */
	MAX_DIMENSION: 1_000,
	/** Max digital artwork width / height in pixels. */
	MAX_PIXELS: 20_000,
	/** Max free-text description length. */
	MAX_DESCRIPTION: 500,
	/** Decimal places allowed for money and dimensions. */
	DECIMALS: 2,
} as const;

/** Artworks are digital → pixels. */
export const ARTWORK_UNIT = "px" as const;
/** Physical units only accepted on CRFs saved before artworks went digital. */
export const ARTWORK_LEGACY_UNITS = ["ft", "in", "cm", "m"] as const;
export const ARTWORK_UNITS = [ARTWORK_UNIT, ...ARTWORK_LEGACY_UNITS] as const;
export type ArtworkUnit = (typeof ARTWORK_UNITS)[number];

const PRESET_VALUES: readonly string[] = [
	...ARTWORK_RESOLUTION_PRESETS.map((preset) => preset.value),
	ARTWORK_CUSTOM_PRESET,
];

const CATEGORY_VALUES = CRF_CATEGORIES.map((category) => category.value);

const CATEGORY_TITLES: Record<CrfCategory, string> = Object.fromEntries(
	CRF_CATEGORIES.map(({ value, title }) => [value, title]),
) as Record<CrfCategory, string>;

/* ========================================================================== */
/*                                  Messages                                  */
/* ========================================================================== */

/** Every user-facing CRF validation message lives here. */
export const CRF_MESSAGES = {
	epcRequired: "EPC reference is missing. Reopen the CRF from its EPC.",
	itemsRequired: "Add at least one item to the CRF.",
	tooManyItems: `A CRF can have at most ${CRF_LIMITS.MAX_LINE_ITEMS} items.`,
	productRequired: "Select a product.",
	categoryInvalid: "Select a valid category.",
	duplicateItem:
		"This item is already in the CRF. Update its quantity instead.",
	required: (label: string) => `${label} is required.`,
	notANumber: (label: string) => `${label} must be a number.`,
	wholeNumber: (label: string) => `${label} must be a whole number.`,
	min: (label: string, min: number) =>
		min === 1
			? `${label} must be at least 1.`
			: `${label} must be ${min === 0 ? "0 or more" : `at least ${min}`}.`,
	positive: (label: string) => `${label} must be greater than 0.`,
	max: (label: string, max: number) =>
		`${label} cannot exceed ${max.toLocaleString("en-IN")}.`,
	decimals: (label: string, decimals: number) =>
		`${label} can have at most ${decimals} decimal places.`,
	unitInvalid: "Artwork size must be in pixels (px).",
	resolutionRequired:
		"Select a resolution, or choose Custom and enter width × height.",
	pixelsWhole: "Width and height must be whole pixels.",
	/* ---- Souvenirs (store) ---- */
	skuMissing: "This item has no SKU in the store and can't be ordered.",
	variantRequired: "Select a size / variant.",
	unavailable: "This item is no longer available in the store.",
	outOfStock: "Out of stock.",
	notEnoughStock: (available: number) =>
		`Only ${available.toLocaleString("en-IN")} in stock. Reduce the quantity.`,
	descriptionTooLong: `Description cannot exceed ${CRF_LIMITS.MAX_DESCRIPTION} characters.`,
} as const;

/* ========================================================================== */
/*                               Field helpers                                */
/* ========================================================================== */

const isBlank = (value: unknown) =>
	value === undefined ||
	value === null ||
	(typeof value === "string" && value.trim() === "");

/** Number of decimal places in a finite number (1.25 → 2). */
const countDecimals = (value: number) => {
	const [, fraction = ""] = String(value).split(".");
	return fraction.length;
};

/** Rounds to the CRF money/dimension precision without float noise. */
export const roundTo = (
	value: number,
	decimals: number = CRF_LIMITS.DECIMALS,
) => Math.round((value + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;

type NumberRules = {
	label: string;
	required?: boolean;
	integer?: boolean;
	/** Inclusive minimum. */
	min?: number;
	/** Strictly greater than 0 (for sizes). */
	positive?: boolean;
	max?: number;
	decimals?: number;
};

/**
 * Number field accepting `number | numeric string | "" | null | undefined`
 * (what inputs and the existing LineItemOption shape actually hold).
 * Output: a finite number, or `undefined` when optional and blank.
 */
const numberField = ({
	label,
	required = true,
	integer = false,
	min,
	positive = false,
	max,
	decimals,
}: NumberRules) => {
	const field = z
		.unknown()
		.superRefine((raw, ctx) => {
			if (isBlank(raw)) {
				if (required) {
					ctx.addIssue({
						code: "custom",
						message: CRF_MESSAGES.required(label),
					});
				}
				return;
			}

			const value = typeof raw === "number" ? raw : Number(String(raw).trim());

			if (!Number.isFinite(value)) {
				ctx.addIssue({
					code: "custom",
					message: CRF_MESSAGES.notANumber(label),
				});
				return;
			}
			if (integer && !Number.isInteger(value)) {
				ctx.addIssue({
					code: "custom",
					message: CRF_MESSAGES.wholeNumber(label),
				});
				return;
			}
			if (positive && value <= 0) {
				ctx.addIssue({ code: "custom", message: CRF_MESSAGES.positive(label) });
				return;
			}
			if (min !== undefined && value < min) {
				ctx.addIssue({ code: "custom", message: CRF_MESSAGES.min(label, min) });
				return;
			}
			if (max !== undefined && value > max) {
				ctx.addIssue({ code: "custom", message: CRF_MESSAGES.max(label, max) });
				return;
			}
			if (decimals !== undefined && countDecimals(value) > decimals) {
				ctx.addIssue({
					code: "custom",
					message: CRF_MESSAGES.decimals(label, decimals),
				});
			}
		})
		.transform((raw): number | undefined => {
			if (isBlank(raw)) return undefined;
			const value = typeof raw === "number" ? raw : Number(String(raw).trim());
			return decimals !== undefined ? roundTo(value, decimals) : value;
		});

	// Optional fields must be marked so Zod v4 accepts an absent / undefined
	// output; required ones already report blanks through superRefine.
	return required ? field : field.optional();
};

/* ========================================================================== */
/*                                 Line item                                  */
/* ========================================================================== */

/**
 * Field rules of one CRF line, in the CrfLineItem shape the form holds
 * (value = productId / variantId, rate = unit amount). Cross-field and
 * per-category rules live in getArtworkIssues / getSouvenirIssues.
 */
const lineItemFieldsSchema = z.object({
	id: z.string().optional(),

	// productId (printed / artwork) or variantId (souvenir). Preprocessed so a
	// missing value gets our message, not Zod's default "Required".
	value: z.preprocess(
		(raw) => (typeof raw === "string" ? raw : ""),
		z.string().trim().min(1, CRF_MESSAGES.productRequired),
	),
	label: z.string().trim().optional().default(""),
	partNumber: z.string().trim().optional(),

	category: z
		.string()
		.refine(
			(value) => (CATEGORY_VALUES as readonly string[]).includes(value),
			CRF_MESSAGES.categoryInvalid,
		)
		.transform((value) => value as CrfCategory),

	description: z
		.string()
		.nullish()
		.transform((value) => (value ?? "").trim())
		.refine(
			(value) => value.length <= CRF_LIMITS.MAX_DESCRIPTION,
			CRF_MESSAGES.descriptionTooLong,
		),

	quantity: numberField({
		label: "Quantity",
		integer: true,
		min: 1,
		max: CRF_LIMITS.MAX_QUANTITY,
	}),

	rate: numberField({
		label: "Rate",
		min: 0,
		max: CRF_LIMITS.MAX_RATE,
		decimals: CRF_LIMITS.DECIMALS,
	}),

	/* ---- Artwork only — format here, "required"/px rules in getArtworkIssues ---- */
	width: numberField({
		label: "Width",
		required: false,
		positive: true,
		max: CRF_LIMITS.MAX_PIXELS,
		decimals: CRF_LIMITS.DECIMALS,
	}),
	height: numberField({
		label: "Height",
		required: false,
		positive: true,
		max: CRF_LIMITS.MAX_PIXELS,
		decimals: CRF_LIMITS.DECIMALS,
	}),
	unit: z.string().nullish(),
	resolutionPreset: z
		.string()
		.nullish()
		.transform((value) => (value && PRESET_VALUES.includes(value) ? value : undefined)),

	/* ---- Souvenir (store) snapshot — rules in getSouvenirIssues ---- */
	sku: z.string().trim().nullish(),
	variantId: z.string().trim().nullish(),
	shopifyProductId: z.string().nullish(),
	variantTitle: z.string().nullish(),
	options: z.record(z.string(), z.string()).nullish(),
	imageUrl: z.string().nullish(),
	compareAtPrice: z.number().nullish(),
	gstRate: z.number().min(0).max(100).nullish(),
	availableQty: z.number().nullish(),
	stockStatus: z.string().nullish(),
});

type Issue = { path: (string | number)[]; message: string };

/**
 * Artworks are digital: a pixel resolution is required (preset or custom).
 * Physical units are tolerated only on CRFs saved before the switch.
 * Runs on raw input.
 */
const getArtworkIssues = (raw: unknown): Issue[] => {
	const item = (raw ?? {}) as Record<string, unknown>;
	if (item.category !== "ARTWORK") return [];

	if (isBlank(item.width) || isBlank(item.height)) {
		return [
			{ path: ["resolutionPreset"], message: CRF_MESSAGES.resolutionRequired },
		];
	}

	const unit = typeof item.unit === "string" ? item.unit : "";
	if (!(ARTWORK_UNITS as readonly string[]).includes(unit)) {
		return [{ path: ["unit"], message: CRF_MESSAGES.unitInvalid }];
	}

	const width = Number(item.width);
	const height = Number(item.height);

	if (unit === ARTWORK_UNIT) {
		return Number.isInteger(width) && Number.isInteger(height)
			? []
			: [{ path: ["width"], message: CRF_MESSAGES.pixelsWhole }];
	}

	// Legacy physical sizes keep their old limit.
	const issues: Issue[] = [];
	if (width > CRF_LIMITS.MAX_DIMENSION) {
		issues.push({ path: ["width"], message: CRF_MESSAGES.max("Width", CRF_LIMITS.MAX_DIMENSION) });
	}
	if (height > CRF_LIMITS.MAX_DIMENSION) {
		issues.push({ path: ["height"], message: CRF_MESSAGES.max("Height", CRF_LIMITS.MAX_DIMENSION) });
	}
	return issues;
};

/**
 * Souvenirs come from the store: they need a SKU + variant, and the quantity
 * can't exceed the last known stock (from the catalog or the pre-save stock
 * check). Unknown stock (e.g. an old CRF opened for edit) is not blocked
 * here — the pre-save stock check fills it in. Runs on raw input.
 */
const getSouvenirIssues = (raw: unknown): Issue[] => {
	const item = (raw ?? {}) as Record<string, unknown>;
	if (item.category !== "SOUVENIR") return [];

	if (item.stockStatus === "INACTIVE" || item.stockStatus === "UNKNOWN_SKU") {
		return [{ path: ["sku"], message: CRF_MESSAGES.unavailable }];
	}
	if (isBlank(item.variantId)) {
		return [{ path: ["value"], message: CRF_MESSAGES.variantRequired }];
	}
	if (isBlank(item.sku)) {
		return [{ path: ["sku"], message: CRF_MESSAGES.skuMissing }];
	}

	if (isBlank(item.availableQty)) return [];
	const available = Number(item.availableQty);
	const quantity = Number(item.quantity);

	if (available <= 0) {
		return [{ path: ["quantity"], message: CRF_MESSAGES.outOfStock }];
	}
	if (Number.isFinite(quantity) && quantity > available) {
		return [{ path: ["quantity"], message: CRF_MESSAGES.notEnoughStock(available) }];
	}
	return [];
};

/**
 * Normalised line: totals recomputed, and each category keeps only its own
 * fields — size only on artworks, store snapshot only on souvenirs, and
 * printed materials carry neither.
 */
const normalizeLineItem = (item: z.output<typeof lineItemFieldsSchema>) => {
	const isArtwork = item.category === "ARTWORK";
	const isSouvenir = item.category === "SOUVENIR";
	const quantity = item.quantity as number;
	const rate = item.rate as number;

	const {
		width, height, unit, resolutionPreset,
		sku, variantId, shopifyProductId, variantTitle, options, imageUrl,
		compareAtPrice, gstRate, availableQty, stockStatus,
		...common
	} = item;

	return {
		...common,
		quantity,
		rate,
		// Recomputed so a stale `total` held by the form can never be sent.
		total: roundTo(quantity * rate),

		...(isArtwork
			? {
					width,
					height,
					unit: (unit || ARTWORK_UNIT) as ArtworkUnit,
					resolutionPreset:
						(resolutionPreset as CrfLineItem["resolutionPreset"]) ??
						ARTWORK_CUSTOM_PRESET,
				}
			: {}),

		...(isSouvenir
			? {
					sku: sku ?? null,
					variantId: variantId ?? null,
					shopifyProductId: shopifyProductId ?? null,
					variantTitle: variantTitle ?? null,
					options: options ?? {},
					imageUrl: imageUrl ?? null,
					compareAtPrice: compareAtPrice ?? null,
					gstRate: gstRate ?? null,
					availableQty: availableQty ?? null,
					stockStatus: (stockStatus as CrfLineItem["stockStatus"]) ?? null,
				}
			: {}),
	};
};

/**
 * One CRF line.
 *
 * Built on z.unknown() + superRefine on purpose: Zod skips object-level
 * refinements once any field fails, which would hide "Select a resolution"
 * while "Quantity must be at least 1" is showing. Running the field schema
 * and the category rules side by side reports everything in one pass.
 */
export const crfLineItemSchema = z
	.unknown()
	.superRefine((raw, ctx) => {
		const fields = lineItemFieldsSchema.safeParse(raw);
		const taken = new Set<string>();

		if (!fields.success) {
			for (const issue of fields.error.issues) {
				taken.add(issue.path.join("."));
				ctx.addIssue({
					code: "custom",
					path: issue.path as (string | number)[],
					message: issue.message,
				});
			}
		}

		for (const issue of [...getArtworkIssues(raw), ...getSouvenirIssues(raw)]) {
			// Don't stack a category rule on top of a format error for the same field.
			if (taken.has(issue.path.join("."))) continue;
			ctx.addIssue({ code: "custom", ...issue });
		}
	})
	// Only reached when the superRefine above added no issues.
	.transform((raw) => normalizeLineItem(lineItemFieldsSchema.parse(raw)));

export type CrfLineItemValues = z.output<typeof crfLineItemSchema>;

/* ========================================================================== */
/*                                    Form                                    */
/* ========================================================================== */

/**
 * Identity of a line for duplicate detection:
 *   • souvenir — one line per store variant
 *   • artwork  — same product in different resolutions is a separate line
 *   • printed  — one line per product
 */
export const getCrfLineKey = (item: {
	value?: string;
	category?: string;
	variantId?: string | null;
	sku?: string | null;
	width?: unknown;
	height?: unknown;
	unit?: unknown;
}) => {
	if (item.category === "SOUVENIR") {
		return `SOUVENIR:${item.variantId || item.sku || item.value}`;
	}
	if (item.category === "ARTWORK") {
		return `ARTWORK:${item.value}:${Number(item.width)}x${Number(item.height)}${item.unit ?? ""}`;
	}
	return `${item.category}:${item.value}`;
};

/** Duplicate lines, reported on every repeat after the first. Runs on raw input. */
const getDuplicateIssues = (lineItems: unknown): Issue[] => {
	if (!Array.isArray(lineItems)) return [];

	const seen = new Set<string>();
	const issues: Issue[] = [];

	lineItems.forEach((item, index) => {
		const key = getCrfLineKey(
			(item ?? {}) as Parameters<typeof getCrfLineKey>[0],
		);
		if (seen.has(key)) {
			issues.push({
				path: ["lineItems", index, "value"],
				message: CRF_MESSAGES.duplicateItem,
			});
		}
		seen.add(key);
	});

	return issues;
};

const formFieldsSchema = z.object({
	epcId: z.preprocess(
		(raw) => (typeof raw === "string" ? raw : ""),
		z.string().trim().min(1, CRF_MESSAGES.epcRequired),
	),
	lineItems: z
		.array(crfLineItemSchema)
		.min(1, CRF_MESSAGES.itemsRequired)
		.max(CRF_LIMITS.MAX_LINE_ITEMS, CRF_MESSAGES.tooManyItems),
});

/** Whole CRF: EPC reference + at least one valid, non-duplicate line. */
export const crfFormSchema = z
	.unknown()
	.superRefine((raw, ctx) => {
		const fields = formFieldsSchema.safeParse(raw);
		const taken = new Set<string>();

		if (!fields.success) {
			for (const issue of fields.error.issues) {
				taken.add(issue.path.join("."));
				ctx.addIssue({
					code: "custom",
					path: issue.path as (string | number)[],
					message: issue.message,
				});
			}
		}

		const lineItems = (raw as { lineItems?: unknown } | null)?.lineItems;
		for (const issue of getDuplicateIssues(lineItems)) {
			if (taken.has(issue.path.join("."))) continue;
			ctx.addIssue({ code: "custom", ...issue });
		}
	})
	.transform((raw) => formFieldsSchema.parse(raw));

export type CrfFormValues = z.output<typeof crfFormSchema>;

/* ========================================================================== */
/*                              Error formatting                              */
/* ========================================================================== */

export type CrfLineItemField =
	| "value"
	| "sku"
	| "resolutionPreset"
	| "quantity"
	| "rate"
	| "width"
	| "height"
	| "unit"
	| "description"
	| "category";

/**
 * Errors shaped for the UI:
 *   form  — CRF-level message (no items, too many items, missing EPC)
 *   items — per line, keyed by the line's index in `lineItems`.
 */
export type CrfFormErrors = {
	form?: string;
	items: Record<number, Partial<Record<CrfLineItemField, string>>>;
};

export const EMPTY_CRF_ERRORS: CrfFormErrors = { items: {} };

type ValidationResult =
	| { success: true; data: CrfFormValues; errors: CrfFormErrors }
	| { success: false; data?: undefined; errors: CrfFormErrors };

/**
 * Validates the CRF form and returns UI-ready errors.
 * Only the first message per field is kept (the most specific one).
 */
export const validateCrfForm = (input: {
	epcId?: string | null;
	lineItems: CrfLineItem[];
}): ValidationResult => {
	const result = crfFormSchema.safeParse({
		epcId: input.epcId ?? "",
		lineItems: input.lineItems,
	});

	if (result.success) {
		return { success: true, data: result.data, errors: EMPTY_CRF_ERRORS };
	}

	const errors: CrfFormErrors = { items: {} };

	for (const issue of result.error.issues) {
		const [root, index, field] = issue.path as [string, number?, string?];

		if (root === "lineItems" && typeof index === "number" && field) {
			const lineErrors = (errors.items[index] ??= {});
			const fieldKey = field as CrfLineItemField;
			lineErrors[fieldKey] ??= issue.message;
			continue;
		}

		errors.form ??= issue.message;
	}

	return { success: false, errors };
};

/* ========================================================================== */
/*                         Per-tab (category) helpers                         */
/* ========================================================================== */

/** True when there is at least one form-level or line-level message. */
export const hasCrfErrors = (errors: CrfFormErrors) =>
	Boolean(errors.form) || Object.keys(errors.items).length > 0;

/**
 * Keeps only the line errors that belong to the given categories.
 * Indices stay those of the full `lineItems` list, so the catalog and the
 * summary card can keep looking errors up by the line's real index.
 *
 * The form-level message ("Add at least one item…") is CRF-wide, so it is
 * dropped unless `includeForm` is set (only the final save sets it).
 */
export const filterCrfErrorsByCategory = (
	errors: CrfFormErrors,
	lineItems: CrfLineItem[],
	categories: readonly string[],
	includeForm = false,
): CrfFormErrors => {
	const items: CrfFormErrors["items"] = {};

	for (const [key, lineErrors] of Object.entries(errors.items)) {
		const index = Number(key);
		const category = lineItems[index]?.category;
		if (category && categories.includes(category)) {
			items[index] = lineErrors;
		}
	}

	return { form: includeForm ? errors.form : undefined, items };
};

/** Category of the first invalid line, so the final save can jump to its tab. */
export const getFirstInvalidCategory = (
	errors: CrfFormErrors,
	lineItems: CrfLineItem[],
): CrfCategory | undefined => {
	const firstIndex = Object.keys(errors.items)
		.map(Number)
		.sort((a, b) => a - b)[0];

	return firstIndex === undefined
		? undefined
		: (lineItems[firstIndex]?.category as CrfCategory | undefined);
};

/** Human-readable summary for a toast: "Caps: Quantity must be at least 1." */
export const getFirstCrfErrorMessage = (
	errors: CrfFormErrors,
	lineItems: CrfLineItem[],
): string | undefined => {
	if (errors.form) return errors.form;

	for (const [index, item] of lineItems.entries()) {
		const lineErrors = errors.items[index];
		const message = lineErrors && Object.values(lineErrors).find(Boolean);
		if (message) return `${item.label || "Item"}: ${message}`;
	}

	return undefined;
};

/* ========================================================================== */
/*                                 Formatters                                 */
/* ========================================================================== */

const inrFormatter = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("en-IN", {
	maximumFractionDigits: 0,
});

const toFiniteNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

/** 1250 → "₹1,250.00" */
export const formatCrfAmount = (value: unknown) =>
	inrFormatter.format(toFiniteNumber(value));

/** 12000 → "12,000" */
export const formatCrfQuantity = (value: unknown) =>
	quantityFormatter.format(toFiniteNumber(value));

/** (1920, 1080, "px") → "1,920 × 1,080 px" */
export const formatArtworkSize = (
	width: unknown,
	height: unknown,
	unit?: string | null,
) => {
	const w = toFiniteNumber(width);
	const h = toFiniteNumber(height);
	if (!w || !h) return "--";
	return `${w.toLocaleString("en-IN")} × ${h.toLocaleString("en-IN")} ${unit || "px"}`;
};

export const getCrfCategoryTitle = (category?: string) =>
	CATEGORY_TITLES[category as CrfCategory] ?? category ?? "--";

/**
 * Live input sanitizers (call on change, not in the schema):
 * keep only what the field can ever accept so typing can't produce garbage.
 */
export const sanitizeQuantityInput = (value: string) =>
	value.replace(/\D/g, "").slice(0, String(CRF_LIMITS.MAX_QUANTITY).length);

export const sanitizeDecimalInput = (value: string) => {
	const cleaned = value.replace(/[^\d.]/g, "");
	const [whole, ...rest] = cleaned.split(".");
	return rest.length
		? `${whole}.${rest.join("").slice(0, CRF_LIMITS.DECIMALS)}`
		: whole;
};
