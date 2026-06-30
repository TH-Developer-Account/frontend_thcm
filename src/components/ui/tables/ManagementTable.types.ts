import type { ReactNode } from "react";

export type ManagementTableAlign = "left" | "center" | "right";

export type ManagementTableDensity = "compact" | "comfortable";

export type ManagementTableColumn<T extends object> = {
	key: string;
	header: ReactNode;
	render: (row: T, rowIndex: number) => ReactNode;
	align?: ManagementTableAlign;
	width?: string;
	hideBelow?: "sm" | "md" | "lg";
	className?: string;
	headerClassName?: string;
};

export type ManagementTableProps<T extends object> = {
	rows: T[];
	columns: ManagementTableColumn<T>[];
	getRowId: (row: T, index: number) => string;

	caption?: string;
	ariaLabel?: string;
	className?: string;
	tableClassName?: string;

	density?: ManagementTableDensity;
	minWidth?: string;

	loading?: boolean;
	loadingRowCount?: number;

	emptyTitle?: string;
	emptyDescription?: string;

	selectable?: boolean;
	selectedRowIds?: string[] | Set<string>;
	onSelectedRowIdsChange?: (selectedIds: string[]) => void;
	isRowSelectable?: (row: T, index: number) => boolean;

	onRowClick?: (row: T, index: number) => void;
	getRowClassName?: (row: T, index: number) => string | undefined;

	rowActions?: (row: T, index: number) => ReactNode;
	actionsHeader?: ReactNode;

	pagination?: boolean;
	defaultPageIndex?: number;
	defaultPageSize?: number;

	pageIndex?: number;
	pageSize?: number;
	onPageChange?: (pageIndex: number) => void;
	onPageSizeChange?: (pageSize: number) => void;

	totalRowCount?: number;
	pageCount?: number;
	scrollTargetId?: string;
};

export type ManagementIdentityCellProps = {
	title: ReactNode;
	subtitle?: ReactNode;
	imageUrl?: string | null;
	initials?: string;
	alt?: string;
	meta?: ReactNode;
	className?: string;
};

export type ManagementAvatarItem = {
	id: string;
	name: string;
	imageUrl?: string | null;
	initials?: string;
};

export type ManagementAvatarGroupProps = {
	items: ManagementAvatarItem[];
	max?: number;
	size?: "sm" | "md";
	className?: string;
};

export type ManagementValueCellProps = {
	primary: ReactNode;
	secondary?: ReactNode;
	className?: string;
};
