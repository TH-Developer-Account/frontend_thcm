/**
 * SimpleTable
 * -----------
 * A generic, dependency-light table for plain listing/viewing use cases —
 * no sorting, no pagination, just a scrollable list with a thin scrollbar.
 *
 * Use this instead of the tanstack-backed <DataTable /> whenever:
 *   - the row count is small/bounded (nothing that truly needs paging), and
 *   - you don't need column sorting.
 *
 * Suggested location: src/components/ui/tables/SimpleTable/SimpleTable.tsx
 * (adjust the three relative imports below to match wherever you drop it —
 * they assume the same depth as DataTable.tsx, i.e. .../ui/tables/<Name>/).
 *
 * ---------------------------------------------------------------------------
 * Minimal usage
 * ---------------------------------------------------------------------------
 *
 *   <SimpleTable
 *     data={rows}
 *     getRowId={(row) => row.id}
 *     columns={[
 *       { key: "name", header: "Name", render: (row) => row.name },
 *       { key: "amount", header: "Amount", align: "right",
 *         render: (row) => `₹ ${row.amount.toLocaleString("en-IN")}` },
 *     ]}
 *   />
 *
 * ---------------------------------------------------------------------------
 * With a file column, row actions, and selection
 * ---------------------------------------------------------------------------
 *
 *   <SimpleTable
 *     title="Saved Claim Heads"
 *     headerActions={<Button text="Add" Icon={Plus} onClick={openAddRow} />}
 *     data={savedItems}
 *     getRowId={(row) => row.id}
 *     selectable
 *     selectedIds={selectedIds}
 *     onSelectionChange={setSelectedIds}
 *     columns={[
 *       { key: "billNumber", header: "Bill No.", render: (row) => row.billNumber },
 *       { key: "amount", header: "Amount", align: "right",
 *         render: (row) => `₹ ${Number(row.amount).toLocaleString("en-IN")}` },
 *     ]}
 *     fileColumn={{
 *       header: "Attachment",
 *       accessor: (row) => (row.fileUrl ? { name: row.fileName, url: row.fileUrl } : null),
 *     }}
 *     actions={[
 *       { icon: Pencil, label: "Edit", onClick: (row) => onEdit(row) },
 *       { icon: Trash2, label: "Delete", onClick: (row) => onDelete(row.id) },
 *     ]}
 *     emptyTitle="No claim heads added"
 *     emptyDescription="Add a claim head using the form above."
 *   />
 */

import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type MouseEvent,
	type ReactNode,
} from "react";
import { Eye, FileText, type LucideIcon } from "lucide-react";

import Button from "../../common/Button";
import { Modal } from "../../common/Modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SimpleTableAlign = "left" | "center" | "right";
export type SimpleTableWidthUnits =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12;
export interface SimpleTableColumn<T> {
	/** Unique key for this column (used as the React key). */
	key: string;
	header: ReactNode;
	align?: SimpleTableAlign;
	/** e.g. "120px" or "20%" — passed straight to the <col> width. */
	width?: string;
	/** Relative width compared with the other columns. Defaults to 1. */
	widthUnits?: SimpleTableWidthUnits;
	/** Minimum width in pixels before horizontal scrolling is enabled. */
	minWidth?: number;
	className?: string;
	render: (item: T, index: number) => ReactNode;
	/** Optional footer content. Receives the complete displayed data set. */
	footer?: ReactNode | ((data: T[]) => ReactNode);
}

export interface SimpleTableFile {
	name: string;
	url: string | null | undefined;
	mimeType?: string | null;
}

export interface SimpleTableFileColumn<T> {
	header?: ReactNode;
	width?: string;
	minWidth?: number;
	/** Return the file to show for this row, or null/undefined for "--". */
	accessor: (item: T) => SimpleTableFile | null | undefined;
}

export interface SimpleTableAction<T> {
	icon: LucideIcon;
	label: string;
	onClick: (item: T) => void;
	disabled?: (item: T) => boolean;
	hidden?: (item: T) => boolean;
}

export interface SimpleTableProps<T> {
	data: T[];
	columns: SimpleTableColumn<T>[];
	getRowId: (item: T, index: number) => string;

	fileColumn?: SimpleTableFileColumn<T>;

	actions?: SimpleTableAction<T>[];
	actionsHeader?: ReactNode;

	selectable?: boolean;
	/** Controlled selection. Omit both to let the table manage its own state. */
	selectedIds?: Set<string>;
	onSelectionChange?: (ids: Set<string>) => void;

	onRowClick?: (item: T) => void;

	loading?: boolean;
	skeletonRows?: number;

	emptyTitle?: string;
	emptyDescription?: string;
	emptyContent?: ReactNode;

	/** Optional heading rendered above the table. */
	title?: ReactNode;
	/** Optional toolbar content (e.g. an "Add" button) shown next to the title. */
	headerActions?: ReactNode;

	/** Scroll container max-height. Defaults to 420px. */
	maxHeight?: string;
	/** Default minimum width, in pixels, for columns without minWidth. */
	defaultColumnMinWidth?: number;
	className?: string;
	ariaLabel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Right-aligned columns are treated as numeric: tabular figures so digits line up.
const getAlignClass = (align?: SimpleTableAlign): string => {
	if (align === "right") return "simple-table-align-right";
	if (align === "center") return "simple-table-align-center";
	return "simple-table-align-left";
};

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];

const getExtension = (name?: string | null): string =>
	(name?.split(".").pop() ?? "").toLowerCase();

const isImageFile = (file: SimpleTableFile): boolean => {
	if (file.mimeType?.startsWith("image/")) return true;
	return IMAGE_EXTENSIONS.includes(getExtension(file.name));
};

const isPdfFile = (file: SimpleTableFile): boolean => {
	if (file.mimeType === "application/pdf") return true;
	return getExtension(file.name) === "pdf";
};

const normalizeFile = (
	file: SimpleTableFile | null | undefined,
): SimpleTableFile | null => {
	const url = file?.url?.trim();
	if (!file || !url) return null;

	return {
		...file,
		name: file.name.trim() || "Attachment",
		url,
	};
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SimpleViewTable<T>({
	data,
	columns,
	getRowId,
	fileColumn,
	actions,
	actionsHeader = "Actions",
	selectable = false,
	selectedIds,
	onSelectionChange,
	onRowClick,
	loading = false,
	skeletonRows = 5,
	emptyTitle = "No records found",
	emptyDescription = "There's nothing to show here yet.",
	emptyContent,
	title,
	headerActions,
	maxHeight = "420px",
	defaultColumnMinWidth = 80,
	className = "",
	ariaLabel = "Table",
}: SimpleTableProps<T>) {
	const [previewTarget, setPreviewTarget] = useState<SimpleTableFile | null>(
		null,
	);

	// Uncontrolled selection fallback so the component works out of the box.
	const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
		() => new Set(),
	);
	const resolvedSelectedIds = selectedIds ?? internalSelectedIds;
	const setSelectedIds = (next: Set<string>) => {
		if (onSelectionChange) {
			onSelectionChange(next);
		} else {
			setInternalSelectedIds(next);
		}
	};

	const rowIds = useMemo(
		() => data.map((item, index) => getRowId(item, index)),
		[data, getRowId],
	);

	const allSelected =
		rowIds.length > 0 && rowIds.every((id) => resolvedSelectedIds.has(id));
	const someSelected = rowIds.some((id) => resolvedSelectedIds.has(id));

	const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
	useEffect(() => {
		if (headerCheckboxRef.current) {
			headerCheckboxRef.current.indeterminate = someSelected && !allSelected;
		}
	}, [someSelected, allSelected]);

	const toggleAll = () => {
		const next = new Set(resolvedSelectedIds);
		if (allSelected) {
			rowIds.forEach((id) => next.delete(id));
		} else {
			rowIds.forEach((id) => next.add(id));
		}
		setSelectedIds(next);
	};

	const toggleRow = (id: string) => {
		const next = new Set(resolvedSelectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		setSelectedIds(next);
	};

	const isImagePreview = previewTarget ? isImageFile(previewTarget) : false;
	const isPdfPreview = previewTarget ? isPdfFile(previewTarget) : false;

	const hasActions = Boolean(actions?.length);
	const hasFooter = columns.some((column) => column.footer !== undefined);
	const columnCount =
		columns.length +
		(selectable ? 1 : 0) +
		(fileColumn ? 1 : 0) +
		(hasActions ? 1 : 0);
	// The data columns share 100% via percentages, so any column without an
	// explicit width collapsed to 0px (file names and action icons wrapped one
	// character per line). Give the extra columns real default widths.
	const fileColumnWidth = fileColumn?.width ?? "11rem";
	const actionsColumnWidth = `${Math.max(1, actions?.length ?? 0) * 2.25 + 1.5}rem`;
	const totalWidthUnits = columns.reduce(
		(total, column) => total + (column.widthUnits ?? 1),
		0,
	);
	const tableMinWidth =
		columns.reduce(
			(total, column) => total + (column.minWidth ?? defaultColumnMinWidth),
			0,
		) +
		(selectable ? 40 : 0) +
		(fileColumn ? (fileColumn.minWidth ?? defaultColumnMinWidth) : 0) +
		(hasActions ? defaultColumnMinWidth : 0);

	return (
		<div
			className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}
		>
			{title || headerActions ? (
				<div className="flex items-center justify-between gap-3">
					{title ? (
						<div className="simple-table-title">{title}</div>
					) : (
						<span />
					)}
					{headerActions ? (
						<div className="flex items-center gap-2">{headerActions}</div>
					) : null}
				</div>
			) : null}

			<div
				className="simple-table-scroll scrollbar-sleek"
				style={{ maxHeight }}
				role="region"
				aria-label={ariaLabel}
				tabIndex={0}
			>
				<table
					className="simple-table"
					style={{ minWidth: `${tableMinWidth}px` }}
				>
					<colgroup>
						{selectable ? <col className="w-10" /> : null}

						{columns.map((column) => (
							<col
								key={column.key}
								style={{
									width:
										column.width ??
										`${((column.widthUnits ?? 1) / totalWidthUnits) * 100}%`,
								}}
							/>
						))}

						{fileColumn ? <col style={{ width: fileColumnWidth }} /> : null}
						{hasActions ? <col style={{ width: actionsColumnWidth }} /> : null}
					</colgroup>
					<thead className="simple-table-head">
						<tr>
							{selectable ? (
								<th className="simple-table-th simple-table-select-cell">
									<input
										ref={headerCheckboxRef}
										className="data-table-checkbox"
										type="checkbox"
										aria-label="Select all rows"
										checked={allSelected}
										onChange={toggleAll}
										disabled={rowIds.length === 0}
									/>
								</th>
							) : null}

							{columns.map((column) => (
								<th
									key={column.key}
									scope="col"
									className={[
										"simple-table-th",
										getAlignClass(column.align),
										column.className,
									]
										.filter(Boolean)
										.join(" ")}
									style={column.width ? { width: column.width } : undefined}
								>
									{column.header}
								</th>
							))}

							{fileColumn ? (
								<th
									scope="col"
									className="simple-table-th simple-table-align-left"
									style={{ width: fileColumnWidth }}
								>
									{fileColumn.header ?? "Attachment"}
								</th>
							) : null}

							{hasActions ? (
								<th scope="col" className="simple-table-th simple-table-align-left">
									{actionsHeader}
								</th>
							) : null}
						</tr>
					</thead>

					<tbody>
						{loading ? (
							Array.from({ length: skeletonRows }).map((_, rowIndex) => (
								<tr
									key={`skeleton-${rowIndex}`}
									className="simple-table-row"
									aria-hidden="true"
								>
									{Array.from({ length: Math.max(1, columnCount) }).map(
										(__, colIndex) => (
											<td key={colIndex} className="simple-table-td">
												<div className="data-table-skeleton" />
											</td>
										),
									)}
								</tr>
							))
						) : data.length === 0 ? (
							<tr>
								<td
									colSpan={Math.max(1, columnCount)}
									className="simple-table-empty"
								>
									<p className="data-table-empty-title">{emptyTitle}</p>
									{emptyDescription ? (
										<p className="data-table-empty-description">
											{emptyDescription}
										</p>
									) : null}
									{emptyContent ? (
										<div className="empty-content-actions">{emptyContent}</div>
									) : null}
								</td>
							</tr>
						) : (
							data.map((item, index) => {
								const rowId = rowIds[index];
								const isSelected = resolvedSelectedIds.has(rowId);
								const isInteractive = Boolean(onRowClick);
								const file = normalizeFile(fileColumn?.accessor(item));

								return (
									<tr
										key={rowId}
										className={[
											"simple-table-row",
											isInteractive ? "is-interactive" : "",
											isSelected ? "is-selected" : "",
										]
											.filter(Boolean)
											.join(" ")}
										tabIndex={isInteractive ? 0 : undefined}
										onClick={isInteractive ? () => onRowClick?.(item) : undefined}
										onKeyDown={
											isInteractive
												? (event) => {
														if (event.key === "Enter" || event.key === " ") {
															event.preventDefault();
															onRowClick?.(item);
														}
													}
												: undefined
										}
									>
										{selectable ? (
											<td
												className="simple-table-td simple-table-select-cell"
												onClick={(event) => event.stopPropagation()}
											>
												<input
													className="data-table-checkbox"
													type="checkbox"
													aria-label={`Select row ${index + 1}`}
													checked={isSelected}
													onChange={() => toggleRow(rowId)}
												/>
											</td>
										) : null}

										{columns.map((column) => (
											<td
												key={column.key}
												className={[
													"simple-table-td",
													getAlignClass(column.align),
													column.className,
												]
													.filter(Boolean)
													.join(" ")}
											>
												{column.render(item, index)}
											</td>
										))}

										{fileColumn ? (
											<td className="simple-table-td">
												{file?.url ? (
													<FilePreviewCell
														file={file}
														onPreview={() => setPreviewTarget(file)}
													/>
												) : (
													<span className="readonly-empty">
														{file?.name ?? "No attachment"}
													</span>
												)}
											</td>
										) : null}

										{hasActions ? (
											<td
												className="simple-table-td"
												onClick={(event) => event.stopPropagation()}
											>
												<div className="flex items-center gap-1.5">
													{actions
														?.filter((action) => !action.hidden?.(item))
														.map((action) => (
															<Button
																key={action.label}
																type="button"
																Icon={action.icon}
																appearance="icon"
																variant="outline"
																size="sm"
																disabled={action.disabled?.(item)}
																onClick={() => action.onClick(item)}
																aria-label={action.label}
															/>
														))}
												</div>
											</td>
										) : null}
									</tr>
								);
							})
						)}
					</tbody>

					{!loading && data.length > 0 && hasFooter ? (
						<tfoot className="simple-table-foot">
							<tr>
								{selectable ? <td className="simple-table-foot-cell" /> : null}

								{columns.map((column) => (
									<td
										key={column.key}
										className={[
											"simple-table-foot-cell",
											getAlignClass(column.align),
											column.className,
										]
											.filter(Boolean)
											.join(" ")}
									>
										{typeof column.footer === "function"
											? column.footer(data)
											: column.footer}
									</td>
								))}

								{fileColumn ? <td className="simple-table-foot-cell" /> : null}
								{hasActions ? <td className="simple-table-foot-cell" /> : null}
							</tr>
						</tfoot>
					) : null}
				</table>
			</div>

			<Modal
				open={Boolean(previewTarget)}
				title={previewTarget?.name ?? "File preview"}
				size="xl"
				onClose={() => setPreviewTarget(null)}
				ariaLabel="File preview"
			>
				{previewTarget ? (
					<div className="flex max-h-[70vh] flex-col items-center justify-center overflow-auto">
						{isImagePreview ? (
							<img
								src={previewTarget.url ?? undefined}
								alt={previewTarget.name}
								className="max-h-full max-w-full object-contain"
							/>
						) : isPdfPreview ? (
							<iframe
								src={previewTarget.url ?? undefined}
								title={previewTarget.name}
								className="h-[70vh] w-full"
							/>
						) : (
							<div className="flex flex-col items-center gap-2 py-10 text-center">
								<FileText aria-hidden="true" />
								<p>This file type cannot be previewed in the browser.</p>
							</div>
						)}
						<a
							href={previewTarget.url ?? undefined}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-3 text-accent-text underline-offset-2 hover:underline"
						>
							Open file in new tab
						</a>
					</div>
				) : null}
			</Modal>
		</div>
	);
}

// ---------------------------------------------------------------------------
// File cell (name + eye icon → opens the shared preview modal above)
// ---------------------------------------------------------------------------

function FilePreviewCell({
	file,
	onPreview,
}: {
	file: SimpleTableFile;
	onPreview: () => void;
}) {
	const openPreview = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		onPreview();
	};

	return (
		<div className="flex max-w-52 items-center gap-1.5">
			<button
				type="button"
				className="min-w-0 flex-1 truncate text-left text-accent-text underline-offset-2 hover:underline"
				title={`View ${file.name}`}
				onClick={openPreview}
			>
				<span className="truncate">{file.name}</span>
			</button>

			<button
				type="button"
				className="simple-table-file-button"
				title={`View ${file.name}`}
				aria-label={`View ${file.name}`}
				onClick={openPreview}
			>
				<Eye className="size-3.5" aria-hidden="true" />
			</button>
		</div>
	);
}
