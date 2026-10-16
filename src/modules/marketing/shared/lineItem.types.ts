// components/ui/tables/LineItemTable/lineItem.types.ts
// Line-item types shared by every module that uses <LineItemTable /> or
// <LineTableView /> (CRF, EPF, …). Moved out of activity-planner/types/epc.types.ts
// so shared UI and the CRF module no longer depend on the Activity Planner.

/* ========================================================================== */
/*                                  Products                                  */
/* ========================================================================== */

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

/* ========================================================================== */
/*                          API line item (read model)                        */
/* ========================================================================== */

/** Line item as returned by the backend (CRF / EPF detail). */
export type ApiLineItem = {
	id?: string;
	productId?: string;
	quantity?: string | number;
	qty?: string | number;
	amount?: string | number;
	rate?: string | number;
	total?: string | number;
	category?: string;
	description?: string;
	particulars?: string;
	particular?: string;
	item_name?: string;
	name?: string;
	product?: {
		id: string;
		partNumber?: string;
		name?: string;
		description?: string;
		category?: string;
	};
};

/* ========================================================================== */
/*                       Editable row (<LineItemTable />)                     */
/* ========================================================================== */

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

export type GroupedOption = {
	label: string;
	options: LineItemOption[];
};

/* ========================================================================== */
/*                        Readonly row (<LineTableView />)                    */
/* ========================================================================== */

/**
 * Normalized row consumed by LineTableView.
 * Height and width may arrive as numbers or numeric strings.
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

/* ========================================================================== */
/*                                   Columns                                  */
/* ========================================================================== */

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
