// crf/crf.mapper.ts
// API ⇄ form/view mapping for CRF line items.
// Merged from: activity-planner/forms/CRF/crf.mapper.ts + crf.payload.ts

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
import type { CrfPayload } from "./crf.types";

const UNCATEGORIZED = "UNCATEGORIZED";

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
	getProduct(item)?.partNumber ?? item?.partNumber ?? "";

/* ========================================================================== */
/*                            Products → options                              */
/* ========================================================================== */

export const mapProductToLineItemOption = (item: Product): LineItemOption => ({
	value: item.id,
	label: item.name,
	particular: item.id,
	description: item.description,

	rate: toNumber(item.unitRate),
	quantity: 1,

	partNumber: item.partNumber,
	category: item.category || UNCATEGORIZED,

	// artwork
	width: toNumber(item.width),
	height: toNumber(item.height),
	unit: item.unit || "ft",
});

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

/** Editable rows for <LineItemTable />. */
export const mapCrfLineItemsToFormItems = (
	lineItems: any[] = [],
): LineItemOption[] =>
	lineItems.map((item) => ({
		id: item?.id,

		value: getProductId(item),
		label: getProductName(item),
		particular: getProductId(item),
		description: getDescription(item),

		rate: getLineItemRate(item),
		quantity: getLineItemQuantity(item),

		partNumber: getPartNumber(item),
		category: getCategory(item),

		total: toNumber(item?.total),

		// artwork
		width: toNumber(item?.width),
		height: toNumber(item?.height),
		unit: item?.unit ?? "ft",
	}));

/** Readonly rows for <LineTableView />. */
export const mapCrfLineItemsToTableRows = (lineItems: any[] = []): TableRow[] =>
	lineItems.map((item, index) => {
		const rate = getLineItemRate(item);
		const qty = getLineItemQuantity(item);
		const hasTotal =
			item?.total !== undefined && item?.total !== null && item?.total !== "";

		return {
			id: item?.id,
			sno: index + 1,

			particulars: getProductName(item),
			description: getDescription(item),
			partNumber: getPartNumber(item),

			rate,
			qty,
			total: hasTotal ? toNumber(item.total) : rate * qty,

			category: getCategory(item),

			// artwork
			width: toNumber(item?.width),
			height: toNumber(item?.height),
			unit: item?.unit ?? "--",
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

export const buildCrfPayload = (
	items: LineItemOption[],
	epcId: string,
): CrfPayload => ({
	epcId,
	lineItems: items.map((item) => {
		const quantity = toNumber(item.quantity);
		const amount = toNumber(item.rate);

		return {
			productId: item.value || "",
			category: item.category || UNCATEGORIZED,
			quantity,
			amount,
			total: toNumber(item.total ?? quantity * amount),
			description: item.description ?? "",
			width: item.width,
			height: item.height,
			unit: item.unit,
		};
	}),
});
