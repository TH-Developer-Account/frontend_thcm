// crf/crf.mapper.ts
// API ⇄ form/view mapping for CRF line items.
//
// Category rules applied here:
//   • PRINTED_MATERIAL — no width / height / unit, ever.
//   • ARTWORK          — pixel resolution (width × height px + preset).
//   • SOUVENIR         — store line: SKU / variant + price snapshot + GST.

import type {
	GroupedOption,
	LineItemOption,
	Product,
	TableRow,
} from "../shared/lineItem.types";
import {
	getLineItemQuantity,
	getLineItemRate,
	getLineItemsTotal,
	toNumber,
} from "../shared/lineItem.utils";
import { getLinePricing } from "./crf.shop.mapper";
import {
	findArtworkPreset,
	type CrfLineItem,
	type CrfLineItemPayload,
	type CrfPayload,
} from "./crf.types";

const UNCATEGORIZED = "UNCATEGORIZED";
const ARTWORK = "ARTWORK";
const SOUVENIR = "SOUVENIR";

/* ========================================================================== */
/*                        Field readers (API line item)                       */
/* ========================================================================== */

const getProduct = (item: any) => item?.product ?? {};

const getProductId = (item: any) =>
	getProduct(item)?.id ?? item?.productId ?? item?.product_id ?? "";

const getProductName = (item: any) =>
	getProduct(item)?.name ??
	item?.productName ??
	item?.product_name ??
	item?.title ??
	item?.particulars ??
	item?.particular ??
	item?.item_name ??
	item?.name ??
	"--";

const getDescription = (item: any) =>
	getProduct(item)?.description ?? item?.description ?? "--";

const getCategory = (item: any) =>
	getProduct(item)?.category ?? item?.category ?? UNCATEGORIZED;

const getPartNumber = (item: any) =>
	getProduct(item)?.partNumber ?? item?.partNumber ?? item?.sku ?? "";

const nullableNumber = (value: unknown): number | null =>
	value === null || value === undefined || value === "" ? null : toNumber(value);

/* ========================================================================== */
/*                            Products → options                              */
/* ========================================================================== */

/** MAP product master → catalog option. Size fields only for artworks. */
export const mapProductToLineItemOption = (item: Product): LineItemOption => {
	const category = item.category || UNCATEGORIZED;

	return {
		value: item.id,
		label: item.name,
		particular: item.id,
		description: item.description,

		rate: toNumber(item.unitRate),
		quantity: 1,

		partNumber: item.partNumber,
		category,

		// Artworks are digital: the size is chosen per line (px resolution),
		// so the master's physical size is not carried over. Printed
		// materials never have a size.
		...(category === ARTWORK ? { unit: "px" } : {}),
	};
};

export const groupProductsByCategory = (
	products: Product[] = [],
): GroupedOption[] =>
	Object.values(
		products.reduce<Record<string, GroupedOption>>((acc, item) => {
			const category = item.category || UNCATEGORIZED;

			acc[category] ??= { label: category, options: [] };
			acc[category].options.push(mapProductToLineItemOption(item));

			return acc;
		}, {}),
	);

/* ========================================================================== */
/*                         API line items → form / view                       */
/* ========================================================================== */

/** Editable lines for the CRF form (edit mode). */
export const mapCrfLineItemsToFormItems = (
	lineItems: any[] = [],
): CrfLineItem[] =>
	lineItems.map((item) => {
		const category = getCategory(item);
		const base: CrfLineItem = {
			id: item?.id,

			value: category === SOUVENIR ? (item?.variantId ?? getProductId(item)) : getProductId(item),
			label: getProductName(item),
			particular: getProductId(item),
			description: getDescription(item),

			rate: getLineItemRate(item),
			quantity: getLineItemQuantity(item),

			partNumber: getPartNumber(item),
			category,

			total: toNumber(item?.total),
		};

		if (category === ARTWORK) {
			const width = nullableNumber(item?.width) ?? undefined;
			const height = nullableNumber(item?.height) ?? undefined;
			return {
				...base,
				width,
				height,
				unit: item?.unit ?? "px",
				resolutionPreset: item?.resolutionPreset ?? findArtworkPreset(width, height),
			};
		}

		if (category === SOUVENIR) {
			return {
				...base,
				sku: item?.sku ?? null,
				variantId: item?.variantId ?? null,
				shopifyProductId: item?.shopifyProductId ?? null,
				variantTitle: item?.variantTitle ?? null,
				options: item?.options ?? {},
				imageUrl: item?.imageUrl ?? null,
				compareAtPrice: nullableNumber(item?.compareAtPrice),
				gstRate: nullableNumber(item?.gstRate),
				// Unknown until the next stock check.
				availableQty: null,
			};
		}

		return base;
	});

/** Readonly rows for <LineTableView />. */
export const mapCrfLineItemsToTableRows = (lineItems: any[] = []): TableRow[] =>
	lineItems.map((item, index) => {
		const rate = getLineItemRate(item);
		const qty = getLineItemQuantity(item);
		const hasTotal =
			item?.total !== undefined && item?.total !== null && item?.total !== "";
		const isArtwork = getCategory(item) === ARTWORK;

		return {
			id: item?.id,
			sno: index + 1,

			particulars: item?.variantTitle
				? `${getProductName(item)} · ${item.variantTitle}`
				: getProductName(item),
			description: getDescription(item),
			partNumber: getPartNumber(item),

			rate,
			qty,
			total: hasTotal ? toNumber(item.total) : rate * qty,

			category: getCategory(item),

			// Size only exists for artworks.
			...(isArtwork
				? {
						width: toNumber(item?.width),
						height: toNumber(item?.height),
						unit: item?.unit ?? "px",
					}
				: {}),
		};
	});

/** Grand total of a CRF, tolerant of the different response wrappers. */
export const getCrfTotalFromData = (crfData: any) => {
	const crf =
		crfData?.crf ??
		crfData?.data?.crf ??
		crfData?.data?.data?.crf ??
		crfData?.data ??
		crfData;

	return getLineItemsTotal(crf?.lineItems ?? []);
};

/* ========================================================================== */
/*                               Form → payload                               */
/* ========================================================================== */

const toLinePayload = (item: CrfLineItem): CrfLineItemPayload => {
	const category = item.category || UNCATEGORIZED;
	const quantity = toNumber(item.quantity);
	const amount = toNumber(item.rate);

	const common = {
		category,
		quantity,
		amount,
		total: toNumber(item.total ?? quantity * amount),
		description: item.description ?? "",
	};

	if (category === SOUVENIR) {
		const pricing = getLinePricing(item);
		return {
			...common,
			sku: item.sku ?? undefined,
			variantId: item.variantId ?? undefined,
			shopifyProductId: item.shopifyProductId ?? undefined,
			title: item.label,
			variantTitle: item.variantTitle ?? null,
			options: item.options ?? {},
			imageUrl: item.imageUrl ?? null,
			compareAtPrice: item.compareAtPrice ?? null,
			discountAmount: pricing.discount,
			gstRate: item.gstRate ?? null,
			taxableAmount: pricing.taxable,
			gstAmount: pricing.gst,
			grossTotal: pricing.total,
		};
	}

	if (category === ARTWORK) {
		return {
			...common,
			productId: item.value || "",
			width: item.width,
			height: item.height,
			unit: item.unit || "px",
			resolutionPreset: item.resolutionPreset,
		};
	}

	// Printed material (and anything else): no size fields.
	return { ...common, productId: item.value || "" };
};

export const buildCrfPayload = (
	items: CrfLineItem[],
	epcId: string,
): CrfPayload => ({
	epcId,
	lineItems: items.map(toLinePayload),
});
