// crf/shop/mapper.ts
// Store contract → what the CRF UI renders, plus the pricing maths shared by
// tiles, the summary card and the payload.
//
//   • GST      — the store has no GST field; it is a tag ("GST 28%").
//   • Discount — compareAtPrice above price. No discount field either.
//   • Variants — the catalog is one row per variant; souvenir cards group
//                rows by product id and show variant chips.

import type {
	ShopProductDetail,
	ShopStockCheckStatus,
	ShopStockRow,
} from "./types";
import type { CrfLineItem } from "../core/types";

/* ========================================================================== */
/*                                   Config                                   */
/* ========================================================================== */

/**
 * Store prices already include GST (confirmed): GST is shown as the part of
 * the price that is tax. Every total, the summary card, the debit note and
 * the payload follow this one flag.
 */
export const SHOP_PRICES_INCLUDE_GST = true;

/** At or below this many units a variant shows "Only N left". */
export const LOW_STOCK_THRESHOLD = 10;

/* ========================================================================== */
/*                                  Helpers                                   */
/* ========================================================================== */

const toNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number) =>
	Math.round((value + Number.EPSILON) * 100) / 100;

const GST_TAG = /^\s*GST\s*(\d+(?:\.\d+)?)\s*%\s*$/i;

/** "GST 28%" in the tags → 28. null when the product carries no GST tag. */
export const parseGstRate = (tags: readonly string[] = []): number | null => {
	for (const tag of tags) {
		const match = GST_TAG.exec(tag);
		if (match) return Number(match[1]);
	}
	return null;
};

/** Tags without the GST tag — the rest are useful labels (event, colour…). */
export const getDisplayTags = (tags: readonly string[] = []) =>
	tags.filter((tag) => !GST_TAG.test(tag));

/** Discount % from price vs compare-at price (0 when not discounted). */
export const getDiscountPercent = (
	price: unknown,
	compareAtPrice: unknown,
): number => {
	const p = toNumber(price);
	const c = toNumber(compareAtPrice);
	if (!c || c <= p) return 0;
	return Math.round(((c - p) / c) * 100);
};

/* ========================================================================== */
/*                                Stock status                                */
/* ========================================================================== */

export type StockLevel = "IN_STOCK" | "LOW" | "OUT_OF_STOCK" | "UNAVAILABLE";

export const getStockLevel = (variant: {
	availableQty?: number | null;
	isOrderable?: boolean;
	sku?: string | null;
	stockStatus?: ShopStockCheckStatus | null;
}): StockLevel => {
	if (
		variant.stockStatus === "INACTIVE" ||
		variant.stockStatus === "UNKNOWN_SKU" ||
		!variant.sku
	) {
		return "UNAVAILABLE";
	}
	const qty = toNumber(variant.availableQty);
	if (qty <= 0) return "OUT_OF_STOCK";
	if (qty <= LOW_STOCK_THRESHOLD) return "LOW";
	return "IN_STOCK";
};

export const STOCK_LABEL: Record<StockLevel, (qty: number) => string> = {
	IN_STOCK: (qty) => `${qty} in stock`,
	LOW: (qty) => `Only ${qty} left`,
	OUT_OF_STOCK: () => "Out of stock",
	UNAVAILABLE: () => "Unavailable",
};

/* ========================================================================== */
/*                         Rows → souvenir products                           */
/* ========================================================================== */

export type SouvenirVariant = {
	variantId: string;
	sku: string | null;
	/** "M / Orange", "Design 2" — null for single-variant products. */
	variantTitle: string | null;
	options: Record<string, string>;
	price: number;
	compareAtPrice: number | null;
	discountPercent: number;
	availableQty: number;
	isOrderable: boolean;
	stockLevel: StockLevel;
};

export type SouvenirProduct = {
	/** Shopify product id. */
	productId: string;
	title: string;
	handle: string;
	category: string;
	vendor: string | null;
	imageUrl: string | null;
	gstRate: number | null;
	/** Tags minus the GST tag. */
	tags: string[];
	variants: SouvenirVariant[];
	/** True when at least one variant can be ordered. */
	hasOrderable: boolean;
	/** Lowest / highest variant price, for "₹199 – ₹549". */
	minPrice: number;
	maxPrice: number;
	/** Biggest discount across variants (for the image badge). */
	maxDiscountPercent: number;
};

const toVariant = (row: ShopStockRow): SouvenirVariant => {
	const isOrderable =
		row.isOrderable ??
		(row.status === "active" && row.availableQty > 0 && Boolean(row.sku));

	return {
		variantId: row.variantId,
		sku: row.sku,
		variantTitle: row.variantTitle,
		options: row.options ?? {},
		price: toNumber(row.price),
		compareAtPrice:
			row.compareAtPrice === null ? null : toNumber(row.compareAtPrice),
		discountPercent: getDiscountPercent(row.price, row.compareAtPrice),
		availableQty: toNumber(row.availableQty),
		isOrderable,
		stockLevel: getStockLevel({
			availableQty: row.availableQty,
			isOrderable,
			sku: row.sku,
		}),
	};
};

/**
 * Groups the per-variant rows into one product each, keeping the order the
 * rows arrived in (so the server's sort is respected).
 */
export const groupStockRows = (rows: ShopStockRow[]): SouvenirProduct[] => {
	const byId = new Map<string, SouvenirProduct>();

	for (const row of rows) {
		const variant = toVariant(row);
		const existing = byId.get(row.id);

		if (existing) {
			existing.variants.push(variant);
			existing.hasOrderable ||= variant.isOrderable;
			existing.minPrice = Math.min(existing.minPrice, variant.price);
			existing.maxPrice = Math.max(existing.maxPrice, variant.price);
			existing.maxDiscountPercent = Math.max(
				existing.maxDiscountPercent,
				variant.discountPercent,
			);
			existing.imageUrl ??= row.imageUrl;
			continue;
		}

		byId.set(row.id, {
			productId: row.id,
			title: row.title,
			handle: row.handle,
			category: row.category,
			vendor: row.vendor,
			imageUrl: row.imageUrl,
			gstRate: parseGstRate(row.tags),
			tags: getDisplayTags(row.tags),
			variants: [variant],
			hasOrderable: variant.isOrderable,
			minPrice: variant.price,
			maxPrice: variant.price,
			maxDiscountPercent: variant.discountPercent,
		});
	}

	return [...byId.values()];
};

/** First variant that can be ordered, else the first one. */
export const getDefaultVariant = (product: SouvenirProduct) =>
	product.variants.find((variant) => variant.isOrderable) ??
	product.variants[0];

/* ========================================================================== */
/*                     Product detail (Get Product) → view                    */
/* ========================================================================== */

export type SouvenirProductDetail = SouvenirProduct & {
	description: string;
	/** All product images (falls back to the listing image). */
	images: string[];
};

/** Get Product response → the product view's model (same rules as listing). */
export const mapProductDetail = (
	detail: ShopProductDetail,
): SouvenirProductDetail => {
	const rows: ShopStockRow[] = detail.variants.map((variant) => ({
		...variant,
		id: detail.id,
		title: detail.title,
		category: detail.category,
		vendor: detail.vendor,
		tags: detail.tags,
		handle: detail.handle,
		imageUrl: detail.images[0] ?? null,
		status: detail.status,
		createdAt: "",
	}));
	const [product] = groupStockRows(rows);

	return {
		...product,
		description: detail.description,
		images: detail.images,
	};
};

/** Listing product → a detail model to render instantly while Get Product loads. */
export const toDetailPlaceholder = (
	product: SouvenirProduct,
): SouvenirProductDetail => ({
	...product,
	description: "",
	images: product.imageUrl ? [product.imageUrl] : [],
});

/* ========================================================================== */
/*                       Option axes (size / colour / …)                      */
/* ========================================================================== */

export type OptionAxis = {
	/** Option key as the store sends it, e.g. "size". */
	name: string;
	/** Display label, e.g. "Size". */
	label: string;
	/** Values in the order the store lists the variants. */
	values: string[];
};

const OPTION_LABELS: Record<string, string> = {
	size: "Size",
	color: "Colour",
	colour: "Colour",
	design: "Design",
	material: "Material",
};

const toOptionLabel = (name: string) =>
	OPTION_LABELS[name.toLowerCase()] ??
	name.charAt(0).toUpperCase() + name.slice(1);

/** The product's option axes, e.g. [Size: M L XL] [Colour: Orange Navy]. */
export const getOptionAxes = (variants: SouvenirVariant[]): OptionAxis[] => {
	const axes = new Map<string, Set<string>>();

	for (const variant of variants) {
		for (const [name, value] of Object.entries(variant.options)) {
			if (!axes.has(name)) axes.set(name, new Set());
			axes.get(name)!.add(value);
		}
	}

	return [...axes].map(([name, values]) => ({
		name,
		label: toOptionLabel(name),
		values: [...values],
	}));
};

export type OptionSelection = Record<string, string>;

/** Variant matching every selected option (undefined while incomplete). */
export const findVariantBySelection = (
	variants: SouvenirVariant[],
	selection: OptionSelection,
): SouvenirVariant | undefined =>
	variants.find((variant) =>
		Object.entries(selection).every(
			([name, value]) => variant.options[name] === value,
		),
	);

/**
 * Can `name = value` still lead to an orderable variant, given the other
 * options already chosen? Drives the disabled / struck-through state of
 * option buttons (e.g. "L" is out of stock in Orange).
 */
export const isOptionValueOrderable = (
	variants: SouvenirVariant[],
	selection: OptionSelection,
	name: string,
	value: string,
) =>
	variants.some(
		(variant) =>
			variant.isOrderable &&
			variant.options[name] === value &&
			Object.entries(selection).every(
				([otherName, otherValue]) =>
					otherName === name || variant.options[otherName] === otherValue,
			),
	);

/* ========================================================================== */
/*                               Cart lines                                   */
/* ========================================================================== */

const SOUVENIR = "SOUVENIR";

/** Index of a souvenir variant's line in the cart (-1 when absent). */
export const findVariantLineIndex = (items: CrfLineItem[], variantId: string) =>
	items.findIndex(
		(item) => item.category === SOUVENIR && item.variantId === variantId,
	);

/** All cart lines that belong to one store product. */
export const getProductLines = (items: CrfLineItem[], productId: string) =>
	items.filter(
		(item) => item.category === SOUVENIR && item.shopifyProductId === productId,
	);

/**
 * New CRF line from a store product + variant, including the snapshot the
 * CRF keeps (image, price, compare-at, GST rate, stock seen) so a saved CRF
 * doesn't change when the store does.
 */
export const createSouvenirLine = (
	product: SouvenirProduct,
	variant: SouvenirVariant,
	quantity = 1,
): CrfLineItem => ({
	id: undefined,
	value: variant.variantId,
	label: product.title,
	particular: variant.variantId,
	description: variant.variantTitle ?? "",
	partNumber: variant.sku ?? "",
	category: SOUVENIR,

	rate: variant.price,
	quantity,
	total: round2(variant.price * quantity),

	sku: variant.sku,
	variantId: variant.variantId,
	shopifyProductId: product.productId,
	variantTitle: variant.variantTitle,
	options: variant.options,
	imageUrl: product.imageUrl,
	compareAtPrice: variant.compareAtPrice,
	gstRate: product.gstRate,
	availableQty: variant.availableQty,
	stockStatus: null,
});

/* ========================================================================== */
/*                               Line pricing                                 */
/* ========================================================================== */

export type LinePricing = {
	/** Compare-at (MRP) × qty — equals `amount` when not discounted. */
	mrpAmount: number;
	/** (compare-at − price) × qty. */
	discount: number;
	/** price × qty — what the line costs at the store's price. */
	amount: number;
	/** Value before GST. */
	taxable: number;
	gst: number;
	/** Payable for the line (incl. GST). */
	total: number;
};

/**
 * Pricing for one CRF line. Works for every category: printed materials and
 * artworks have no GST rate / compare-at, so they come out as plain rate × qty.
 */
export const getLinePricing = (line: {
	rate?: unknown;
	quantity?: unknown;
	compareAtPrice?: unknown;
	gstRate?: number | null;
}): LinePricing => {
	const qty = toNumber(line.quantity);
	const price = toNumber(line.rate);
	const compareAt = toNumber(line.compareAtPrice);
	const rate = toNumber(line.gstRate) / 100;

	const amount = round2(price * qty);
	const mrpAmount = round2((compareAt > price ? compareAt : price) * qty);
	const discount = round2(mrpAmount - amount);

	if (!rate) {
		return { mrpAmount, discount, amount, taxable: amount, gst: 0, total: amount };
	}

	if (SHOP_PRICES_INCLUDE_GST) {
		const taxable = round2(amount / (1 + rate));
		return {
			mrpAmount,
			discount,
			amount,
			taxable,
			gst: round2(amount - taxable),
			total: amount,
		};
	}

	const gst = round2(amount * rate);
	return {
		mrpAmount,
		discount,
		amount,
		taxable: amount,
		gst,
		total: round2(amount + gst),
	};
};

/** Sums line pricings (summary card / payload totals). */
export const sumPricing = (pricings: LinePricing[]): LinePricing =>
	pricings.reduce<LinePricing>(
		(acc, p) => ({
			mrpAmount: round2(acc.mrpAmount + p.mrpAmount),
			discount: round2(acc.discount + p.discount),
			amount: round2(acc.amount + p.amount),
			taxable: round2(acc.taxable + p.taxable),
			gst: round2(acc.gst + p.gst),
			total: round2(acc.total + p.total),
		}),
		{ mrpAmount: 0, discount: 0, amount: 0, taxable: 0, gst: 0, total: 0 },
	);

/** "incl. GST" / "+ GST" wording that follows SHOP_PRICES_INCLUDE_GST. */
export const getGstLabel = (gstRate: number | null) =>
	gstRate === null
		? null
		: SHOP_PRICES_INCLUDE_GST
			? `Incl. ${gstRate}% GST`
			: `+ ${gstRate}% GST`;
