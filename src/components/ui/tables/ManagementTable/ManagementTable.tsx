import {
	useEffect,
	useMemo,
	useState,
	type ChangeEvent,
	type KeyboardEvent,
} from "react";

import type {
	ManagementTableAlign,
	ManagementTableProps,
} from "./ManagementTable.types";
import Pagination from "../../../common/Pagination";

const DEFAULT_PAGE_SIZE = 15;

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const getAlignmentClass = (align: ManagementTableAlign = "left"): string =>
	`management-table-align-${align}`;

const getVisibilityClass = (
	hideBelow?: "sm" | "md" | "lg",
): string | undefined =>
	hideBelow ? `management-table-hide-below-${hideBelow}` : undefined;

function ManagementTable<T extends object>({
	rows,
	columns,
	getRowId,
	caption,
	ariaLabel = "Management table",
	className,
	tableClassName,
	density = "comfortable",
	minWidth = "48rem",
	loading = false,
	loadingRowCount = 5,
	emptyTitle = "No records found",
	emptyDescription = "There are no records to display.",
	selectable = false,
	selectedRowIds,
	onSelectedRowIdsChange,
	isRowSelectable,
	onRowClick,
	getRowClassName,
	rowActions,
	actionsHeader = "Actions",

	pagination = true,
	defaultPageIndex = 0,
	defaultPageSize = DEFAULT_PAGE_SIZE,
	pageIndex,
	pageSize,
	onPageChange,
	onPageSizeChange,
	totalRowCount,
	pageCount,
	scrollTargetId = "management-table-scroll",
}: ManagementTableProps<T>) {
	/* =====================================================
	   PAGINATION STATE
	===================================================== */

	const [internalPageIndex, setInternalPageIndex] = useState(defaultPageIndex);

	const [internalPageSize, setInternalPageSize] = useState(defaultPageSize);

	const resolvedPageIndex = pageIndex ?? internalPageIndex;
	const resolvedPageSize = pageSize ?? internalPageSize;

	/*
	 * When totalRowCount or pageCount is supplied, the table assumes
	 * the parent is providing server-paginated rows.
	 */
	const isServerPaginated =
		typeof totalRowCount === "number" || typeof pageCount === "number";

	const resolvedTotalRowCount = totalRowCount ?? rows.length;

	const resolvedPageCount = useMemo(() => {
		if (!pagination) return 1;

		if (typeof pageCount === "number") {
			return Math.max(1, pageCount);
		}

		return Math.max(1, Math.ceil(resolvedTotalRowCount / resolvedPageSize));
	}, [pageCount, pagination, resolvedPageSize, resolvedTotalRowCount]);

	/*
	 * Client pagination slices the complete rows collection.
	 * Server pagination renders rows as supplied because they already
	 * represent the current page.
	 */
	const visibleRows = useMemo(() => {
		if (!pagination || isServerPaginated) {
			return rows;
		}

		const startIndex = resolvedPageIndex * resolvedPageSize;
		const endIndex = startIndex + resolvedPageSize;

		return rows.slice(startIndex, endIndex);
	}, [
		isServerPaginated,
		pagination,
		resolvedPageIndex,
		resolvedPageSize,
		rows,
	]);

	/*
	 * Prevent the current page from remaining outside the valid range
	 * when filtering, deleting rows, or changing the total row count.
	 */
	useEffect(() => {
		if (!pagination) return;

		const lastPageIndex = Math.max(0, resolvedPageCount - 1);

		if (resolvedPageIndex <= lastPageIndex) return;

		if (pageIndex === undefined) {
			setInternalPageIndex(lastPageIndex);
		}

		onPageChange?.(lastPageIndex);
	}, [
		onPageChange,
		pageIndex,
		pagination,
		resolvedPageCount,
		resolvedPageIndex,
	]);

	const handlePageChange = (nextPageIndex: number) => {
		const boundedPageIndex = Math.min(
			Math.max(nextPageIndex, 0),
			Math.max(0, resolvedPageCount - 1),
		);

		if (pageIndex === undefined) {
			setInternalPageIndex(boundedPageIndex);
		}

		onPageChange?.(boundedPageIndex);
	};

	const handlePageSizeChange = (nextPageSize: number) => {
		if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) return;

		if (pageSize === undefined) {
			setInternalPageSize(nextPageSize);
		}

		/*
		 * Reset to the first page because the previous page index may
		 * not exist after changing the number of rows per page.
		 */
		if (pageIndex === undefined) {
			setInternalPageIndex(0);
		}

		onPageSizeChange?.(nextPageSize);
		onPageChange?.(0);
	};

	/* =====================================================
	   ROW INDEX
	===================================================== */

	const getAbsoluteRowIndex = (visibleRowIndex: number): number => {
		if (!pagination || isServerPaginated) {
			return visibleRowIndex;
		}

		return resolvedPageIndex * resolvedPageSize + visibleRowIndex;
	};

	/* =====================================================
	   SELECTION
	===================================================== */

	const selectedIds = useMemo(
		() =>
			selectedRowIds instanceof Set
				? selectedRowIds
				: new Set(selectedRowIds ?? []),
		[selectedRowIds],
	);

	/*
	 * Select-all applies to the currently displayed page.
	 * This prevents changing selection on rows the user cannot see.
	 */
	const selectableRows = useMemo(
		() =>
			visibleRows
				.map((row, visibleRowIndex) => ({
					row,
					visibleRowIndex,
					absoluteRowIndex: getAbsoluteRowIndex(visibleRowIndex),
				}))
				.filter(({ row, absoluteRowIndex }) =>
					isRowSelectable ? isRowSelectable(row, absoluteRowIndex) : true,
				),
		[
			isRowSelectable,
			isServerPaginated,
			pagination,
			resolvedPageIndex,
			resolvedPageSize,
			visibleRows,
		],
	);

	const selectableRowIds = useMemo(
		() =>
			selectableRows.map(({ row, absoluteRowIndex }) =>
				getRowId(row, absoluteRowIndex),
			),
		[getRowId, selectableRows],
	);

	const allSelected =
		selectableRowIds.length > 0 &&
		selectableRowIds.every((id) => selectedIds.has(id));

	const someSelected =
		!allSelected && selectableRowIds.some((id) => selectedIds.has(id));

	const emitSelection = (next: Set<string>) => {
		onSelectedRowIdsChange?.(Array.from(next));
	};

	const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => {
		const next = new Set(selectedIds);

		if (event.target.checked) {
			selectableRowIds.forEach((id) => next.add(id));
		} else {
			selectableRowIds.forEach((id) => next.delete(id));
		}

		emitSelection(next);
	};

	const handleSelectRow = (rowId: string, checked: boolean) => {
		const next = new Set(selectedIds);

		if (checked) {
			next.add(rowId);
		} else {
			next.delete(rowId);
		}

		emitSelection(next);
	};

	/* =====================================================
	   ROW INTERACTION
	===================================================== */

	const handleRowKeyDown = (
		event: KeyboardEvent<HTMLTableRowElement>,
		row: T,
		rowIndex: number,
	) => {
		if (!onRowClick) return;

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onRowClick(row, rowIndex);
		}
	};

	const totalColumnCount =
		columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

	return (
		<section
			className={joinClassNames(
				"management-table-shell",
				`management-table-${density}`,
				loading && "management-table-shell-loading",
				className,
			)}
			aria-busy={loading}
		>
			<div
				id={scrollTargetId}
				className="management-table-scroll scrollbar-sleek"
				role="region"
				aria-label={ariaLabel}
				tabIndex={0}
			>
				<table
					className={joinClassNames("management-table", tableClassName)}
					style={{ minWidth }}
				>
					{caption ? (
						<caption className="management-table-caption">{caption}</caption>
					) : null}

					<thead className="management-table-head">
						<tr>
							{selectable ? (
								<th
									scope="col"
									className="management-table-head-cell management-table-select-cell"
								>
									<input
										type="checkbox"
										className="management-table-checkbox"
										checked={allSelected}
										disabled={loading || selectableRowIds.length === 0}
										ref={(element) => {
											if (element) {
												element.indeterminate = someSelected;
											}
										}}
										onChange={handleSelectAll}
										aria-label="Select all rows on this page"
									/>
								</th>
							) : null}

							{columns.map((column) => (
								<th
									key={column.key}
									scope="col"
									className={joinClassNames(
										"management-table-head-cell",
										getAlignmentClass(column.align),
										getVisibilityClass(column.hideBelow),
										column.headerClassName,
									)}
									style={
										column.width
											? {
													width: column.width,
												}
											: undefined
									}
								>
									{column.header}
								</th>
							))}

							{rowActions ? (
								<th
									scope="col"
									className="management-table-head-cell management-table-align-right management-table-actions-cell"
								>
									{actionsHeader}
								</th>
							) : null}
						</tr>
					</thead>

					<tbody className="management-table-body">
						{loading
							? Array.from({ length: loadingRowCount }, (_, rowIndex) => (
									<tr
										key={`loading-${rowIndex}`}
										className="management-table-row management-table-row-loading"
									>
										{Array.from(
											{
												length: totalColumnCount,
											},
											(_, cellIndex) => (
												<td key={cellIndex} className="management-table-cell">
													<span
														className={joinClassNames(
															"management-table-skeleton",
															cellIndex === 0 &&
																"management-table-skeleton-wide",
														)}
													/>
												</td>
											),
										)}
									</tr>
								))
							: visibleRows.map((row, visibleRowIndex) => {
									const absoluteRowIndex = getAbsoluteRowIndex(visibleRowIndex);

									const rowId = getRowId(row, absoluteRowIndex);

									const isSelected = selectedIds.has(rowId);

									const canSelect = isRowSelectable
										? isRowSelectable(row, absoluteRowIndex)
										: true;

									return (
										<tr
											key={rowId}
											className={joinClassNames(
												"management-table-row",
												isSelected && "management-table-row-selected",
												onRowClick && "management-table-row-interactive",
												getRowClassName?.(row, absoluteRowIndex),
											)}
											tabIndex={onRowClick ? 0 : undefined}
											onClick={() => onRowClick?.(row, absoluteRowIndex)}
											onKeyDown={(event) =>
												handleRowKeyDown(event, row, absoluteRowIndex)
											}
											aria-selected={selectable ? isSelected : undefined}
										>
											{selectable ? (
												<td
													className="management-table-cell management-table-select-cell"
													onClick={(event) => event.stopPropagation()}
												>
													<input
														type="checkbox"
														className="management-table-checkbox"
														checked={isSelected}
														disabled={!canSelect}
														onChange={(event) =>
															handleSelectRow(rowId, event.target.checked)
														}
														aria-label={`Select row ${absoluteRowIndex + 1}`}
													/>
												</td>
											) : null}

											{columns.map((column) => (
												<td
													key={column.key}
													className={joinClassNames(
														"management-table-cell",
														getAlignmentClass(column.align),
														getVisibilityClass(column.hideBelow),
														column.className,
													)}
												>
													{column.render(row, absoluteRowIndex)}
												</td>
											))}

											{rowActions ? (
												<td
													className="management-table-cell management-table-align-right management-table-actions-cell"
													onClick={(event) => event.stopPropagation()}
												>
													<div className="management-table-actions">
														{rowActions(row, absoluteRowIndex)}
													</div>
												</td>
											) : null}
										</tr>
									);
								})}

						{!loading && visibleRows.length === 0 ? (
							<tr>
								<td
									colSpan={totalColumnCount}
									className="management-table-empty-cell"
								>
									<div className="management-table-empty-state">
										<p className="management-table-empty-title">{emptyTitle}</p>

										<p className="management-table-empty-description">
											{emptyDescription}
										</p>
									</div>
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>

			{pagination && !loading && resolvedTotalRowCount > 0 ? (
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

export default ManagementTable;
