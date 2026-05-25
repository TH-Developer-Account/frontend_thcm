import type { TableRow } from "../../components/LineTableView";
import {
	getLineItemQuantity,
	getLineItemRate,
	getLineItemsTotal,
} from "../../helpers/lineItemHelper";

import type {
	GroupedOption,
	LineItemOption,
	Product,
} from "../../types/lineItem.types";

export type LineTableRow = {
	id?: string;
	sno: number;
	partNumber: string;
	particulars: string;
	description: string;
	rate: number;
	qty: number;
	total: number;
	height?: string;
	width?: string;
	category?: string;
};

const toNumber = (value: unknown, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const getProduct = (item: any) => item?.product ?? {};

const getProductId = (item: any) => {
	const product = getProduct(item);

	return product?.id ?? item?.productId ?? item?.product_id ?? "";
};

const getProductName = (item: any) => {
	const product = getProduct(item);

	return (
		product?.name ??
		item?.productName ??
		item?.product_name ??
		item?.particulars ??
		item?.particular ??
		item?.item_name ??
		item?.name ??
		"--"
	);
};

const getDescription = (item: any) => {
	const product = getProduct(item);

	return product?.description ?? item?.description ?? "--";
};

const getCategory = (item: any) => {
	const product = getProduct(item);

	return product?.category ?? item?.category ?? "UNCATEGORIZED";
};

const getPartNumber = (item: any) => {
	const product = getProduct(item);

	return product?.partNumber ?? item?.partNumber ?? "";
};

export const mapProductToLineItemOption = (item: Product): LineItemOption => {
	return {
		value: item.id,
		label: item.name,
		particular: item.id,
		description: item.description,

		rate: toNumber(item.unitRate),
		quantity: 1,

		partNumber: item.partNumber,
		category: item.category || "UNCATEGORIZED",

		// artwork
		width: toNumber(item.width),
		height: toNumber(item.height),
		unit: item.unit || "ft",
	};
};

export const groupProductsByCategory = (
	products: Product[] = [],
): GroupedOption[] => {
	return Object.values(
		products.reduce<Record<string, GroupedOption>>((acc, item) => {
			const category = item.category || "UNCATEGORIZED";

			if (!acc[category]) {
				acc[category] = {
					label: category,
					options: [],
				};
			}

			acc[category].options.push(mapProductToLineItemOption(item));

			return acc;
		}, {}),
	);
};

/**
 * Form mapper.
 * Use this only for editable LineItemTable values.
 */
export const mapCrfLineItemsToFormItems = (
	lineItems: any[] = [],
): LineItemOption[] => {
	return lineItems.map((item) => ({
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
};

/**
 * View mapper.
 * Use this only for readonly LineTableView.
 */
export const mapCrfLineItemsToTableRows = (
	lineItems: any[] = [],
): TableRow[] => {
	return lineItems.map((item, index) => {
		const rate = getLineItemRate(item);
		const qty = getLineItemQuantity(item);

		const total =
			item?.total !== undefined && item?.total !== null && item?.total !== ""
				? toNumber(item.total)
				: rate * qty;

		return {
			id: item?.id,

			sno: index + 1,

			particulars: getProductName(item),

			description: getDescription(item),
			partNumber: getPartNumber(item),
			rate,
			qty,
			total,

			category: getCategory(item),

			// artwork
			width: toNumber(item?.width),
			height: toNumber(item?.height),
			unit: item?.unit ?? "--",
		};
	});
};

export const getCrfTotalFromData = (crfData: any) => {
	const crf =
		crfData?.crf ??
		crfData?.data?.crf ??
		crfData?.data?.data?.crf ??
		crfData?.data ??
		crfData;

	return getLineItemsTotal(crf?.lineItems ?? []);
};
