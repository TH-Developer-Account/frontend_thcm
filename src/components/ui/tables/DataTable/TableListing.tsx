import type { ElementType, HTMLAttributes, ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import Card from "../../../common/Card";
import DataTable, {
	type DataTableMinWidth,
	type DataTableProps,
} from "./DataTable";

type ForwardedDataTableProps<TData extends object> = Omit<
	DataTableProps<TData>,
	"data" | "columns" | "className" | "tableClassName" | "footer"
>;

export type TableListingProps<TData extends object> = Omit<
	HTMLAttributes<HTMLElement>,
	"children"
> &
	ForwardedDataTableProps<TData> & {
		data: TData[];
		columns: ColumnDef<TData>[];
		tabs?: ReactNode;
		toolbarStart?: ReactNode;
		toolbarCenter?: ReactNode;
		toolbarEnd?: ReactNode;
		message?: ReactNode;
		tableFooter?: ReactNode;
		as?: ElementType;
		cardClassName?: string;
		tabsClassName?: string;
		toolbarClassName?: string;
		messageClassName?: string;
		contentClassName?: string;
		dataTableClassName?: string;
		dataTableElementClassName?: string;
		minWidth?: DataTableMinWidth;
	};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export default function TableListing<TData extends object>({
	data,
	columns,
	tabs,
	toolbarStart,
	toolbarCenter,
	toolbarEnd,
	message,
	tableFooter,
	as: Component = "section",
	className = "",
	cardClassName = "",
	tabsClassName = "",
	toolbarClassName = "",
	messageClassName = "",
	contentClassName = "",
	dataTableClassName = "",
	dataTableElementClassName = "",
	minWidth = "none",
	ariaLabel = "Data table",
	loading = false,
	sorting,
	onSortingChange,
	manualSorting = false,
	enableSorting = true,
	enablePagination = true,
	manualPagination = false,
	pageIndex = 0,
	pageSize = 10,
	pageCount = 0,
	onPageChange,
	onPageSizeChange,
	emptyTitle = "No records found",
	emptyDescription = "Try adjusting your filters or search.",
	scrollTargetId = "data-table-scroll",
	getRowId,
	getRowClassName,
	onRowClick,
	...props
}: TableListingProps<TData>) {
	const hasToolbar = Boolean(toolbarStart || toolbarCenter || toolbarEnd);

	return (
		<Component
			className={joinClassNames("table-listing", className)}
			{...props}
		>
			<Card
				padding="none"
				layout="listing"
				className={joinClassNames("table-listing-card", cardClassName)}
			>
				{tabs ? (
					<div className={joinClassNames("table-listing-tabs", tabsClassName)}>
						{tabs}
					</div>
				) : null}

				{hasToolbar ? (
					<div
						className={joinClassNames(
							"table-listing-toolbar",
							toolbarClassName,
						)}
					>
						{toolbarStart ? (
							<div className="table-listing-toolbar-start">{toolbarStart}</div>
						) : null}

						{toolbarCenter ? (
							<div className="table-listing-toolbar-center">
								{toolbarCenter}
							</div>
						) : null}

						{toolbarEnd ? (
							<div className="table-listing-toolbar-end">{toolbarEnd}</div>
						) : null}
					</div>
				) : null}

				{message ? (
					<div
						className={joinClassNames(
							"table-listing-message",
							messageClassName,
						)}
					>
						{message}
					</div>
				) : null}

				<div
					className={joinClassNames("table-listing-content", contentClassName)}
				>
					<DataTable<TData>
						data={data}
						columns={columns}
						loading={loading}
						sorting={sorting}
						onSortingChange={onSortingChange}
						manualSorting={manualSorting}
						enableSorting={enableSorting}
						enablePagination={enablePagination}
						manualPagination={manualPagination}
						pageIndex={pageIndex}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={onPageChange}
						onPageSizeChange={onPageSizeChange}
						emptyTitle={emptyTitle}
						emptyDescription={emptyDescription}
						scrollTargetId={scrollTargetId}
						className={joinClassNames(
							"table-listing-data-table",
							dataTableClassName,
						)}
						tableClassName={dataTableElementClassName}
						minWidth={minWidth}
						ariaLabel={ariaLabel}
						getRowId={getRowId}
						getRowClassName={getRowClassName}
						onRowClick={onRowClick}
						footer={tableFooter}
					/>
				</div>
			</Card>
		</Component>
	);
}
