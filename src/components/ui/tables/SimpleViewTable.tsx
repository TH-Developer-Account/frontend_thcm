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

export interface SimpleTableColumn<T> {
	/** Unique key for this column (used as the React key). */
	key: string;
	header: ReactNode;
	align?: SimpleTableAlign;
	/** e.g. "120px" or "20%" — passed straight to the <col> width. */
	width?: string;
	className?: string;
	render: (item: T, index: number) => ReactNode;
}

export interface SimpleTableFile {
	name: string;
	url: string | null | undefined;
	mimeType?: string | null;
}

export interface SimpleTableFileColumn<T> {
	header?: ReactNode;
	width?: string;
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

	/** Optional heading rendered above the table. */
	title?: ReactNode;
	/** Optional toolbar content (e.g. an "Add" button) shown next to the title. */
	headerActions?: ReactNode;

	/** Scroll container max-height. Defaults to 420px. */
	maxHeight?: string;
	className?: string;
	ariaLabel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getAlignClass = (align?: SimpleTableAlign): string => {
	if (align === "right") return "text-right";
	if (align === "center") return "text-center";
	return "text-left";
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
	title,
	headerActions,
	maxHeight = "420px",
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
	const columnCount =
		columns.length +
		(selectable ? 1 : 0) +
		(fileColumn ? 1 : 0) +
		(hasActions ? 1 : 0);

	return (
		<div
			className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}
		>
			{title || headerActions ? (
				<div className="flex items-center justify-between gap-3">
					{title ? (
						<div className="text-sm font-semibold">{title}</div>
					) : (
						<span />
					)}
					{headerActions ? (
						<div className="flex items-center gap-2">{headerActions}</div>
					) : null}
				</div>
			) : null}

			<div
				className="min-w-0 overflow-auto rounded-md border border-slate-200 scrollbar-sleek"
				style={{ maxHeight }}
				role="region"
				aria-label={ariaLabel}
				tabIndex={0}
			>
				<table className="w-full min-w-max border-collapse text-sm">
					<thead className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_theme(colors.slate.200)]">
						<tr>
							{selectable ? (
								<th className="w-10 px-3 py-2 text-left">
									<input
										ref={headerCheckboxRef}
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
										"px-3 py-2 font-medium text-slate-600",
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
									className="px-3 py-2 text-left font-medium text-slate-600"
									style={
										fileColumn.width ? { width: fileColumn.width } : undefined
									}
								>
									{fileColumn.header ?? "Attachment"}
								</th>
							) : null}

							{hasActions ? (
								<th className="px-3 py-2 text-left font-medium text-slate-600">
									{actionsHeader}
								</th>
							) : null}
						</tr>
					</thead>

					<tbody>
						{loading ? (
							Array.from({ length: skeletonRows }).map((_, rowIndex) => (
								<tr key={`skeleton-${rowIndex}`} aria-hidden="true">
									{Array.from({ length: Math.max(1, columnCount) }).map(
										(__, colIndex) => (
											<td key={colIndex} className="px-3 py-3">
												<div className="h-4 w-full animate-pulse rounded bg-slate-100" />
											</td>
										),
									)}
								</tr>
							))
						) : data.length === 0 ? (
							<tr>
								<td
									colSpan={Math.max(1, columnCount)}
									className="px-3 py-10 text-center"
								>
									<p className="text-sm font-medium text-slate-700">
										{emptyTitle}
									</p>
									{emptyDescription ? (
										<p className="mt-1 text-sm text-slate-500">
											{emptyDescription}
										</p>
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
											"border-t border-slate-100",
											isInteractive ? "cursor-pointer hover:bg-slate-50" : "",
											isSelected ? "bg-brand/5" : "",
										]
											.filter(Boolean)
											.join(" ")}
										tabIndex={isInteractive ? 0 : undefined}
										onClick={() => onRowClick?.(item)}
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
												className="px-3 py-2"
												onClick={(event) => event.stopPropagation()}
											>
												<input
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
													"px-3 py-2 align-middle",
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
											<td className="px-3 py-2">
												{file?.url ? (
													<FilePreviewCell
														file={file}
														onPreview={() => setPreviewTarget(file)}
													/>
												) : (
													<span className="text-slate-400">
														{file?.name ?? "--"}
													</span>
												)}
											</td>
										) : null}

										{hasActions ? (
											<td
												className="px-3 py-2"
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
							className="mt-3 text-brand underline-offset-2 hover:underline"
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
				className="min-w-0 flex-1 truncate text-left text-brand underline-offset-2 hover:underline"
				title={`View ${file.name}`}
				onClick={openPreview}
			>
				<span className="truncate">{file.name}</span>
			</button>

			<button
				type="button"
				className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:border-brand hover:text-brand"
				title={`View ${file.name}`}
				aria-label={`View ${file.name}`}
				onClick={openPreview}
			>
				<Eye className="size-3.5" aria-hidden="true" />
			</button>
		</div>
	);
}
