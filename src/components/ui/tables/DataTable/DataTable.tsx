import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type OnChangeFn,
	type PaginationState,
	type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import Pagination from "../../../common/Pagination";

export type DataTableMinWidth = "none" | "sm" | "md" | "lg" | "xl";

export interface DataTableProps<T extends object> {
	data: T[];
	columns: ColumnDef<T>[];

	loading?: boolean;

	sorting?: SortingState;
	onSortingChange?: OnChangeFn<SortingState>;
	manualSorting?: boolean;
	enableSorting?: boolean;

	enablePagination?: boolean;
	manualPagination?: boolean;
	pageIndex?: number;
	pageSize?: number;
	pageCount?: number;
	onPageChange?: (page: number) => void;
	onPageSizeChange?: (size: number) => void;

	emptyTitle?: string;
	emptyDescription?: string;

	scrollTargetId?: string;
	className?: string;
	tableClassName?: string;
	minWidth?: DataTableMinWidth;
	ariaLabel?: string;

	getRowId?: (originalRow: T, index: number, parent?: unknown) => string;

	getRowClassName?: (row: T, rowIndex: number) => string;

	onRowClick?: (row: T) => void;

	/** Optional custom content rendered above pagination. */
	footer?: ReactNode;
}

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const getAlignmentClass = (align?: "left" | "center" | "right"): string => {
	if (align === "center") {
		return "data-table-align-center";
	}

	if (align === "right") {
		return "data-table-align-right";
	}

	return "data-table-align-left";
};

const getMinWidthClass = (minWidth: DataTableMinWidth): string => {
	if (minWidth === "none") {
		return "";
	}

	return `data-table-min-${minWidth}`;
};

function DataTable<T extends object>({
	data,
	columns,
	loading = false,

	sorting,
	onSortingChange,
	manualSorting = false,
	enableSorting = true,

	enablePagination,
	manualPagination = false,
	pageIndex = 0,
	pageSize = 10,
	pageCount = 0,
	onPageChange,
	onPageSizeChange,

	emptyTitle = "No records found",
	emptyDescription = "Try adjusting your filters or search.",

	scrollTargetId = "data-table-scroll",
	className = "",
	tableClassName = "",
	minWidth = "none",
	ariaLabel = "Data table",

	getRowId,
	getRowClassName,
	onRowClick,

	footer,
}: DataTableProps<T>) {
	"use no memo";

	const shouldUsePagination = enablePagination ?? manualPagination;

	const [internalPagination, setInternalPagination] = useState<PaginationState>(
		{
			pageIndex,
			pageSize,
		},
	);

	useEffect(() => {
		if (!manualPagination) return;

		setInternalPagination({
			pageIndex,
			pageSize,
		});
	}, [manualPagination, pageIndex, pageSize]);

	const table = useReactTable({
		data,
		columns,
		getRowId,

		state: {
			sorting: sorting ?? [],
			...(!manualPagination && shouldUsePagination
				? {
						pagination: internalPagination,
					}
				: {}),
		},

		onSortingChange,

		onPaginationChange:
			!manualPagination && shouldUsePagination
				? setInternalPagination
				: undefined,

		enableSorting,
		manualSorting,
		manualPagination,

		pageCount: manualPagination ? pageCount : undefined,

		getCoreRowModel: getCoreRowModel(),

		getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,

		getPaginationRowModel:
			shouldUsePagination && !manualPagination
				? getPaginationRowModel()
				: undefined,
	});

	const rows = table.getRowModel().rows;

	const visibleColumnCount = table.getVisibleLeafColumns().length;

	const resolvedPageIndex = manualPagination
		? pageIndex
		: table.getState().pagination.pageIndex;

	const resolvedPageSize = manualPagination
		? pageSize
		: table.getState().pagination.pageSize;

	const resolvedPageCount = manualPagination ? pageCount : table.getPageCount();

	const handlePageChange = (page: number) => {
		if (manualPagination) {
			onPageChange?.(page);
			return;
		}

		table.setPageIndex(page);
	};

	const handlePageSizeChange = (size: number) => {
		if (manualPagination) {
			onPageSizeChange?.(size);
			return;
		}

		table.setPageSize(size);
	};

	const shouldRenderPagination = shouldUsePagination && resolvedPageCount >= 1;

	return (
		<section
			className={joinClassNames(
				"data-table-shell",
				loading && "data-table-shell-loading",
				className,
			)}
			aria-busy={loading}
		>
			<div
				id={scrollTargetId}
				className="data-table-scroll scrollbar-sleek"
				tabIndex={0}
				role="region"
				aria-label={ariaLabel}
			>
				<table
					className={joinClassNames(
						"data-table",
						getMinWidthClass(minWidth),
						tableClassName,
					)}
				>
					<thead className="data-table-head">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id} className="data-table-head-row">
								{headerGroup.headers.map((header) => {
									const canSort = enableSorting && header.column.getCanSort();

									const sortedState = header.column.getIsSorted();

									const columnMeta = header.column.columnDef.meta as
										| {
												headerClassName?: string;
												cellClassName?: string;
												align?: "left" | "center" | "right";
										  }
										| undefined;

									return (
										<th
											key={header.id}
											scope="col"
											className={joinClassNames(
												"data-table-head-cell",
												getAlignmentClass(columnMeta?.align),
												columnMeta?.headerClassName,
											)}
											aria-sort={
												sortedState === "asc"
													? "ascending"
													: sortedState === "desc"
														? "descending"
														: "none"
											}
										>
											{header.isPlaceholder ? null : canSort ? (
												<button
													type="button"
													className={joinClassNames(
														"data-table-sort-button",
														sortedState && "data-table-sort-button-active",
													)}
													onClick={header.column.getToggleSortingHandler()}
												>
													<span className="data-table-head-label">
														{flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
													</span>

													<span
														className="data-table-sort-icon"
														aria-hidden="true"
													>
														{sortedState === "asc" ? (
															<ChevronUp size={12} />
														) : sortedState === "desc" ? (
															<ChevronDown size={12} />
														) : (
															<ChevronsUpDown size={12} />
														)}
													</span>
												</button>
											) : (
												<div className="data-table-head-content">
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
												</div>
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>

					<tbody className="data-table-body">
						{loading ? (
							Array.from({
								length: Math.max(1, resolvedPageSize),
							}).map((_, rowIndex) => (
								<tr
									key={`skeleton-row-${rowIndex}`}
									className="data-table-row data-table-row-loading"
									aria-hidden="true"
								>
									{Array.from({
										length: Math.max(1, visibleColumnCount),
									}).map((__, columnIndex) => (
										<td
											key={`skeleton-cell-${rowIndex}-${columnIndex}`}
											className="data-table-cell data-table-cell-text"
										>
											<div className="data-table-cell-inner">
												<div
													className={joinClassNames(
														"data-table-skeleton",
														columnIndex === 0 && "data-table-skeleton-wide",
														columnIndex === visibleColumnCount - 1 &&
															"data-table-skeleton-short",
													)}
												/>
											</div>
										</td>
									))}
								</tr>
							))
						) : rows.length === 0 ? (
							<tr className="data-table-empty-row">
								<td
									colSpan={Math.max(1, visibleColumnCount)}
									className="data-table-empty-state"
								>
									<div className="data-table-empty-state-inner">
										<p className="data-table-empty-title">{emptyTitle}</p>

										{emptyDescription ? (
											<p className="data-table-empty-description">
												{emptyDescription}
											</p>
										) : null}
									</div>
								</td>
							</tr>
						) : (
							rows.map((row, rowIndex) => {
								const isInteractive = Boolean(onRowClick);

								return (
									<tr
										key={row.id}
										className={joinClassNames(
											"data-table-row",
											isInteractive && "data-table-row-interactive",
											getRowClassName?.(row.original, rowIndex),
										)}
										tabIndex={isInteractive ? 0 : undefined}
										onClick={
											isInteractive
												? () => onRowClick?.(row.original)
												: undefined
										}
										onKeyDown={
											isInteractive
												? (event) => {
														if (event.key === "Enter" || event.key === " ") {
															event.preventDefault();

															onRowClick?.(row.original);
														}
													}
												: undefined
										}
									>
										{row.getVisibleCells().map((cell) => {
											const columnMeta = cell.column.columnDef.meta as
												| {
														headerClassName?: string;
														cellClassName?: string;
														align?: "left" | "center" | "right";
												  }
												| undefined;

											const isActionColumn =
												cell.column.id === "action" ||
												cell.column.id === "actions";

											return (
												<td
													key={cell.id}
													className={joinClassNames(
														"data-table-cell",
														isActionColumn
															? "data-table-cell-action"
															: "data-table-cell-text",
														getAlignmentClass(columnMeta?.align),
														columnMeta?.cellClassName,
													)}
												>
													<div className="data-table-cell-inner">
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</div>
												</td>
											);
										})}
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{footer ? <div className="data-table-custom-footer">{footer}</div> : null}

			{shouldRenderPagination ? (
				<footer className="data-table-pagination">
					<div className="data-table-pagination-inner">
						<Pagination
							pageIndex={resolvedPageIndex}
							pageSize={resolvedPageSize}
							totalPages={resolvedPageCount}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
							scrollTargetId={scrollTargetId}
							variant="default"
						/>
					</div>
				</footer>
			) : null}
		</section>
	);
}

export default DataTable;
