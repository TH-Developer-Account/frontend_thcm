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

import type { LineItemOption } from "../shared/lineItem.types";
import { CRF_CATEGORIES, type CrfCategory } from "./crf.types";

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
	/** Max artwork width / height (in the selected unit). */
	MAX_DIMENSION: 1_000,
	/** Max free-text description length. */
	MAX_DESCRIPTION: 500,
	/** Decimal places allowed for money and dimensions. */
	DECIMALS: 2,
} as const;

export const ARTWORK_UNITS = ["ft", "in", "cm", "m"] as const;
export type ArtworkUnit = (typeof ARTWORK_UNITS)[number];

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
	unitInvalid: `Select a unit (${ARTWORK_UNITS.join(", ")}).`,
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
 * Field rules of one CRF line, in the LineItemOption shape the form already
 * holds (value = productId, rate = unit amount). Cross-field rules live in
 * crfLineItemSchema below.
 */
const lineItemFieldsSchema = z.object({
	id: z.string().optional(),

	// productId. Preprocessed so a missing value gets our message,
	// not Zod's default "Required" / "expected string".
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

	// Artwork only — format checked here, "required" checked in getArtworkIssues.
	width: numberField({
		label: "Width",
		required: false,
		positive: true,
		max: CRF_LIMITS.MAX_DIMENSION,
		decimals: CRF_LIMITS.DECIMALS,
	}),
	height: numberField({
		label: "Height",
		required: false,
		positive: true,
		max: CRF_LIMITS.MAX_DIMENSION,
		decimals: CRF_LIMITS.DECIMALS,
	}),
	unit: z.string().nullish(),
});

type Issue = { path: (string | number)[]; message: string };

/** Artwork lines must carry a size and a known unit. Runs on raw input. */
const getArtworkIssues = (raw: unknown): Issue[] => {
	const item = (raw ?? {}) as Record<string, unknown>;
	if (item.category !== "ARTWORK") return [];

	const issues: Issue[] = [];
	if (isBlank(item.width)) {
		issues.push({ path: ["width"], message: CRF_MESSAGES.required("Width") });
	}
	if (isBlank(item.height)) {
		issues.push({ path: ["height"], message: CRF_MESSAGES.required("Height") });
	}
	if (
		typeof item.unit !== "string" ||
		!(ARTWORK_UNITS as readonly string[]).includes(item.unit)
	) {
		issues.push({ path: ["unit"], message: CRF_MESSAGES.unitInvalid });
	}
	return issues;
};

/** Normalised line: totals recomputed, sizes only on artwork. */
const normalizeLineItem = (item: z.output<typeof lineItemFieldsSchema>) => {
	const isArtwork = item.category === "ARTWORK";
	const quantity = item.quantity as number;
	const rate = item.rate as number;

	return {
		...item,
		quantity,
		rate,
		// Recomputed so a stale `total` held by the form can never be sent.
		total: roundTo(quantity * rate),
		width: isArtwork ? item.width : undefined,
		height: isArtwork ? item.height : undefined,
		unit: isArtwork ? (item.unit as ArtworkUnit) : undefined,
	};
};

/**
 * One CRF line.
 *
 * Built on z.unknown() + superRefine on purpose: Zod skips object-level
 * refinements once any field fails, which would hide "Width is required"
 * while "Quantity must be at least 1" is showing. Running the field schema
 * and the artwork rules side by side reports everything in one pass.
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

		for (const issue of getArtworkIssues(raw)) {
			// Don't stack "required" on top of a format error for the same field.
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
 * Identity of a line for duplicate detection. Artwork of the same product in
 * different sizes is a legitimate separate line; everything else must merge.
 */
export const getCrfLineKey = (item: {
	value?: string;
	category?: string;
	width?: unknown;
	height?: unknown;
	unit?: unknown;
}) =>
	item.category === "ARTWORK"
		? `${item.category}:${item.value}:${Number(item.width)}x${Number(item.height)}${item.unit ?? ""}`
		: `${item.category}:${item.value}`;

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
	lineItems: LineItemOption[];
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

/** Human-readable summary for a toast: "Caps: Quantity must be at least 1." */
export const getFirstCrfErrorMessage = (
	errors: CrfFormErrors,
	lineItems: LineItemOption[],
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

/** (4, 2.5, "ft") → "4 × 2.5 ft" */
export const formatArtworkSize = (
	width: unknown,
	height: unknown,
	unit?: string | null,
) => {
	const w = toFiniteNumber(width);
	const h = toFiniteNumber(height);
	if (!w || !h) return "--";
	return `${w} × ${h} ${unit || "ft"}`;
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
