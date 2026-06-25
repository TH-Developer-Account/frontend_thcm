import type React from "react";

export type ProductType = "EPF" | "CRF";

export type Product = {
	id: string;
	productType: ProductType;
	category: string;
	partNumber: string;
	name: string;
	description: string | null;
	unitRate: string | number;
	isActive: boolean;
	created_at: string;
	updated_at: string;
	width?: number;
	height?: number;
	unit?: string;
};

export type LineItemOption = {
	id?: string;
	value: string;
	label: string;
	particular: string;
	description: string | null;
	category?: string;
	partNumber?: string;

	rate?: number;
	quantity?: number;
	total?: number;

	width?: number;
	height?: number;
	unit?: string;

	quotationFile?: File | null;
	quotationFileUrl?: string | null;
	quotationFileName?: string | null;
};

export interface LineItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export type GroupedOption = {
	label: string;
	options: LineItemOption[];
};

/**
 * Normalized row consumed by LineTableView.
 *
 * Values such as height and width may arrive from the API as either
 * numbers or numeric strings, so the view model supports both.
 */
export type TableRow = {
	id?: string;

	sno: number;
	partNumber?: string;

	particulars: string;
	description: string;

	rate?: number;
	qty?: number;
	total?: number;

	height?: number | string;
	width?: number | string;
	unit?: string;

	category?: string;

	quotationUrl?: string | null;
	quotationFileName?: string | null;
};

/**
 * Kept as an alias only if existing files already import this name.
 * This represents one row, not an array of rows.
 */
export type LineItemTableGen = TableRow;

export interface CostItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export interface CrfProps {
	items: LineItemOption[];
	onChange: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	isViewer?: boolean;
	options: GroupedOption[];
}

export type ColumnKey =
	| "sno"
	| "partNumber"
	| "particular"
	| "description"
	| "rate"
	| "quantity"
	| "total"
	| "width"
	| "height"
	| "unit"
	| "quotation"
	| "actions";

export interface ColumnConfig {
	key: ColumnKey;
	label: string;
	colSpan: number;
	align?: "left" | "right" | "center";
	editable?: boolean;
	disabled?: boolean;
}
