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
	created_at: string; // ISO date string
	updated_at: string; // ISO date string
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
	// default pricing flow
	rate?: number;
	quantity?: number;
	total?: number;

	// artwork flow
	width?: number;
	height?: number;
	unit?: string;
};

export type GroupedOption = {
	label: string;
	options: LineItemOption[];
};

export type LineTableRow = {
	id?: string;
	sno: number;
	particulars: string;
	description: string;
	rate: number;
	qty: number;
	total: number;
	height?: string;
	width?: string;
	category?: string;
};

export interface CostItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export interface LineItem {
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
	| "actions"
	| string; // allow custom keys for flexibility

export interface ColumnConfig {
	key: ColumnKey;
	label: string;
	colSpan: number;
	align?: "left" | "right" | "center";
	editable?: boolean; // show input in draft row
	disabled?: boolean; // show input but disabled
}
