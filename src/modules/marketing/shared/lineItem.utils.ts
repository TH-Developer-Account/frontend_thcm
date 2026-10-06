// components/ui/tables/LineItemTable/lineItem.utils.ts
// Line-item math + column presets shared by CRF and EPF.
// Moved from: activity-planner/utils/lineItem.ts and the
// "Line-item column presets" block of activity-planner/utils/constant.ts.

import type { ColumnConfig } from "./lineItem.types";

/* ========================================================================== */
/*                                    Math                                    */
/* ========================================================================== */

/** Finite number from a number or numeric string; otherwise `fallback`. */
export const toNumber = (value: unknown, fallback = 0): number => {
	const num =
		typeof value === "number"
			? value
			: typeof value === "string" && value.trim()
				? Number(value)
				: Number.NaN;

	return Number.isFinite(num) ? num : fallback;
};

export const getLineItemQuantity = (item: any) =>
	toNumber(item.quantity ?? item.qty) || 1;

/** Backend `amount` is the final row total (not the unit rate). */
export const getLineItemAmount = (item: any) =>
	toNumber(item.amount ?? item.totalAmount ?? item.lineTotal);

export const getLineItemRate = (item: any) => {
	const amount = getLineItemAmount(item);
	const quantity = getLineItemQuantity(item);

	// Backend row: amount 6696, quantity 2 => rate 3348.
	if (amount > 0 && quantity > 0) return amount / quantity;

	return toNumber(
		item.rate ??
			item.unitRate ??
			item.unit_rate ??
			item.product?.unitRate ??
			item.product?.unit_rate,
	);
};

/** Backend row → amount; UI state → rate × quantity. */
export const getLineItemTotal = (item: any) => {
	const amount = getLineItemAmount(item);
	return amount > 0
		? amount
		: getLineItemRate(item) * getLineItemQuantity(item);
};

export const getLineItemsTotal = (items: any[] = []) =>
	items.reduce((sum, item) => sum + getLineItemTotal(item), 0);

/* ========================================================================== */
/*                               Column presets                               */
/* ========================================================================== */

export const DEFAULT_COLUMNS: ColumnConfig[] = [
	{ key: "sno", label: "SNo", colSpan: 1 },
	{ key: "partNumber", label: "Part No.", colSpan: 2 },
	{ key: "particular", label: "Particulars", colSpan: 3 },
	{ key: "description", label: "Description", colSpan: 2, editable: true },
	{ key: "rate", label: "Rate", colSpan: 1, align: "right", editable: true },
	{ key: "quantity", label: "Qty", colSpan: 1, align: "right", editable: true },
	{ key: "total", label: "Total", colSpan: 1, align: "right" },
	{ key: "actions", label: "Action", colSpan: 1, align: "center" },
];

export const OVERHEAD_COLUMNS: ColumnConfig[] = [
	{ key: "sno", label: "SNo", colSpan: 1 },
	{ key: "partNumber", label: "Part No.", colSpan: 2 },
	{ key: "particular", label: "Particulars", colSpan: 2 },
	{ key: "description", label: "Description", colSpan: 2, editable: true },
	{ key: "rate", label: "Rate", colSpan: 1, align: "right", editable: true },
	{ key: "quantity", label: "Qty", colSpan: 1, align: "right", editable: true },
	{ key: "total", label: "Total", colSpan: 1, align: "right" },
	{ key: "quotation", label: "File", colSpan: 1, align: "center" },
	{ key: "actions", label: "Action", colSpan: 1, align: "center" },
];

export const ARTWORK_COLUMNS: ColumnConfig[] = [
	{ key: "sno", label: "SNo", colSpan: 1 },
	{ key: "partNumber", label: "Part No.", colSpan: 2 },
	{ key: "particular", label: "Particulars", colSpan: 2 },
	{ key: "description", label: "Description", colSpan: 2, editable: true },
	{
		key: "width",
		label: "Width",
		colSpan: 1,
		align: "right",
		editable: true,
		disabled: true,
	},
	{
		key: "height",
		label: "Height",
		colSpan: 1,
		align: "right",
		editable: true,
	},
	{ key: "unit", label: "Unit", colSpan: 1, align: "right" },
	{ key: "quantity", label: "Quantity", colSpan: 1, align: "right" },
	{ key: "actions", label: "Action", colSpan: 1, align: "center" },
];

/** Category value → column preset. */
export const CATEGORY_COLUMNS: Record<string, ColumnConfig[]> = {
	EVENT_OVERHEAD: OVERHEAD_COLUMNS,
	ARTWORK: ARTWORK_COLUMNS,
};
