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
	isActive?: boolean;
	created_at?: string;
	updated_at?: string;
};

export type LineItemOption = {
	/**
	 * For select/table option value.
	 * Usually product id.
	 */
	value: string;

	/**
	 * Display label.
	 * Usually product name.
	 */
	label: string;

	/**
	 * Existing old code uses `particular`.
	 * Keep it required so old LineItemTable does not break.
	 */
	particular: string;

	description: string | null;

	/**
	 * Frontend field name used in old LineItemTable.
	 * Backend may call this amount.
	 */
	rate: number;

	quantity: number;

	category?: string;
	partNumber?: string;

	/**
	 * Optional fields for migrated API/backend compatibility.
	 * These should not force code changes, but allow mappers/payloads
	 * to safely carry backend ids when available.
	 */
	id?: string;
	productId?: string;
	product_id?: string;

	/**
	 * Optional only. Do not rely on this in old working code.
	 * Prefer calculating total from rate * quantity in payload.
	 */
	total?: number;
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
