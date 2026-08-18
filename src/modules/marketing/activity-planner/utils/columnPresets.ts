// constants/columnPresets.ts
import type { ColumnConfig } from "../types/lineItem.types";

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
// Map category value → column preset
export const CATEGORY_COLUMNS: Record<string, ColumnConfig[]> = {
	EVENT_OVERHEAD: OVERHEAD_COLUMNS,
	ARTWORK: ARTWORK_COLUMNS,
	// add more as needed
};
