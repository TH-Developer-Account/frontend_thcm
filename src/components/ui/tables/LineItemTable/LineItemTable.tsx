import {
	Check,
	Paperclip,
	Pencil,
	Plus,
	RotateCcw,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import Button from "../../../common/Button";
import FormInput from "../../../forms/FormInput";
import SelectInput from "../../../forms/SelectInput";

import type {
	ColumnConfig,
	ColumnKey,
	LineItemOption,
} from "../../../../modules/marketing/activity-planner/types/lineItem.types";

import { DEFAULT_COLUMNS } from "../../../../modules/marketing/activity-planner/utils/columnPresets";

interface LineItemTableProps {
	title: string;
	items: LineItemOption[];
	onChange: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	particularOptions: LineItemOption[];
	isViewer?: boolean;
	category: string;
	columns?: ColumnConfig[];
}

const createEmptyDraft = (): LineItemOption => ({
	value: "",
	label: "",
	particular: "",
	description: "",

	rate: 0,
	quantity: 0,

	partNumber: "",

	width: 0,
	height: 0,
	unit: "",

	quotationFile: null,
	quotationFileUrl: null,
	quotationFileName: null,
});

const COLUMN_SPAN_CLASSES: Record<number, string> = {
	1: "col-span-1",
	2: "col-span-2",
	3: "col-span-3",
	4: "col-span-4",
	5: "col-span-5",
	6: "col-span-6",
	7: "col-span-7",
	8: "col-span-8",
	9: "col-span-9",
	10: "col-span-10",
	11: "col-span-11",
	12: "col-span-12",
};

const getColumnSpanClass = (colSpan?: number): string => {
	return COLUMN_SPAN_CLASSES[colSpan ?? 1] ?? "col-span-1";
};

const getAlignmentClass = (align?: "left" | "right" | "center"): string => {
	if (align === "right") {
		return "line-item-align-right";
	}

	if (align === "center") {
		return "line-item-align-center";
	}

	return "line-item-align-left";
};

const getColumnClassName = (column: ColumnConfig): string => {
	return [getColumnSpanClass(column.colSpan), getAlignmentClass(column.align)]
		.filter(Boolean)
		.join(" ");
};

export default function LineItemTable({
	title,
	items,
	onChange,
	particularOptions,
	isViewer = false,
	category,
	columns = DEFAULT_COLUMNS,
}: LineItemTableProps) {
	const quotationInputId = useId();

	const [draft, setDraft] = useState<LineItemOption>(createEmptyDraft);

	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	const isEditing = editingIndex !== null;

	const visibleColumns = useMemo(
		() =>
			isViewer ? columns.filter((column) => column.key !== "actions") : columns,
		[columns, isViewer],
	);

	const columnMap = useMemo(() => {
		return visibleColumns.reduce<Partial<Record<ColumnKey, ColumnConfig>>>(
			(accumulator, column) => {
				accumulator[column.key] = column;
				return accumulator;
			},
			{},
		);
	}, [visibleColumns]);

	const hasColumn = (key: ColumnKey): boolean => Boolean(columnMap[key]);

	const getColumn = (key: ColumnKey): ColumnConfig | undefined => {
		return columnMap[key];
	};

	const getCellClassName = (
		key: ColumnKey,
		additionalClassName = "",
	): string => {
		const column = getColumn(key);

		if (!column) {
			return additionalClassName;
		}

		return [
			"line-item-grid-cell",
			getColumnClassName(column),
			additionalClassName,
		]
			.filter(Boolean)
			.join(" ");
	};

	const partNumberOptions = useMemo(
		() =>
			particularOptions.map((item) => ({
				value: item.particular,
				label: item.partNumber || "--",
			})),
		[particularOptions],
	);

	const draftPartNumberOption =
		partNumberOptions.find((option) => option.label === draft.partNumber) ??
		null;

	const draftParticularOption =
		particularOptions.find((option) => option.value === draft.particular) ??
		null;

	const draftTotal = Number(draft.rate || 0) * Number(draft.quantity || 0);

	const grandTotal = items.reduce(
		(sum, item) => sum + Number(item.rate || 0) * Number(item.quantity || 0),
		0,
	);

	const revokeBlobUrl = (url?: string | null) => {
		if (url?.startsWith("blob:")) {
			URL.revokeObjectURL(url);
		}
	};

	const resetDraft = () => {
		revokeBlobUrl(draft.quotationFileUrl);

		setDraft(createEmptyDraft());
		setEditingIndex(null);
	};

	useEffect(() => {
		return () => {
			revokeBlobUrl(draft.quotationFileUrl);
		};
	}, [draft.quotationFileUrl]);

	const handleParticularChange = (
		fieldName: "partNumber" | "particular",
		option:
			| LineItemOption
			| {
					value: string;
					label: string;
			  }
			| null,
	) => {
		if (!option) return;

		const selected =
			fieldName === "partNumber"
				? particularOptions.find((item) => item.partNumber === option.label)
				: particularOptions.find((item) => item.value === option.value);

		if (!selected) return;

		setDraft((previous) => ({
			...previous,

			value: selected.value,
			label: selected.label,
			particular: selected.value,

			partNumber: selected.partNumber ?? "",
			description: selected.description ?? "",

			category: selected.category,

			rate: Number(selected.rate) || 0,

			quantity:
				Number(previous.quantity) > 0
					? previous.quantity
					: Number(selected.quantity) || 1,

			width: Number(selected.width) || 0,
			height: Number(selected.height) || 0,
			unit: selected.unit ?? "",
		}));
	};

	const handleQuotationChange = (file?: File | null) => {
		if (!file) return;

		setDraft((previous) => {
			revokeBlobUrl(previous.quotationFileUrl);

			return {
				...previous,
				quotationFile: file,
				quotationFileName: file.name,
				quotationFileUrl: URL.createObjectURL(file),
			};
		});
	};

	const removeQuotation = () => {
		setDraft((previous) => {
			revokeBlobUrl(previous.quotationFileUrl);

			return {
				...previous,
				quotationFile: null,
				quotationFileUrl: null,
				quotationFileName: null,
			};
		});
	};

	const handleAddOrUpdate = () => {
		if (!draft.particular) return;

		const payload: LineItemOption = {
			...draft,
			category,

			rate: Number(draft.rate) || 0,
			quantity: Number(draft.quantity) || 1,

			width: Number(draft.width) || 0,
			height: Number(draft.height) || 0,
			unit: draft.unit ?? "",
		};

		if (isEditing) {
			onChange((previous) =>
				previous.map((item, index) =>
					index === editingIndex
						? {
								...item,
								...payload,
							}
						: item,
				),
			);
		} else {
			onChange((previous) => [...previous, payload]);
		}

		/*
		 * Do not revoke the quotation URL here because the
		 * newly added item may still use that blob URL.
		 */
		setDraft(createEmptyDraft());
		setEditingIndex(null);
	};

	const handleEdit = (index: number) => {
		const item = items[index];

		if (!item) return;

		revokeBlobUrl(draft.quotationFileUrl);

		setDraft({
			value: item.value,
			label: item.label,
			particular: item.particular || item.value,
			description: item.description ?? "",

			rate: Number(item.rate) || 0,
			quantity: Number(item.quantity) || 1,

			partNumber: item.partNumber ?? "",
			category: item.category,

			width: Number(item.width) || 0,
			height: Number(item.height) || 0,
			unit: item.unit ?? "",

			quotationFile: item.quotationFile ?? null,
			quotationFileUrl: item.quotationFileUrl ?? null,
			quotationFileName: item.quotationFileName ?? null,
		});

		setEditingIndex(index);
	};

	const handleDelete = (index: number) => {
		if (editingIndex === index) {
			setDraft(createEmptyDraft());
			setEditingIndex(null);
		}

		onChange((previous) => {
			const deletedItem = previous[index];

			revokeBlobUrl(deletedItem?.quotationFileUrl);

			return previous.filter((_, itemIndex) => itemIndex !== index);
		});
	};

	return (
		<section className="line-item-editor">
			<header className="line-item-editor-header">
				<div className="line-item-editor-heading">
					<span className="line-item-editor-marker" aria-hidden="true" />

					<h3 className="line-item-editor-title">{title}</h3>
				</div>

				<span className="line-item-editor-count">
					{items.length} {items.length === 1 ? "item" : "items"}
				</span>
			</header>

			<div className="line-item-editor-scroll scrollbar-sleek">
				<div className="line-item-editor-table">
					<div className="line-item-editor-head" role="row">
						{visibleColumns.map((column) => (
							<div
								key={column.key}
								className={[
									"line-item-editor-head-cell",
									getColumnClassName(column),
								]
									.filter(Boolean)
									.join(" ")}
								role="columnheader"
							>
								{column.label}
							</div>
						))}
					</div>

					{!isViewer ? (
						<div className="line-item-editor-draft">
							{hasColumn("sno") ? (
								<div
									className={getCellClassName("sno", "line-item-editor-index")}
								>
									{isEditing ? Number(editingIndex) + 1 : items.length + 1}.
								</div>
							) : null}

							{hasColumn("partNumber") ? (
								<div className={getCellClassName("partNumber")}>
									<SelectInput
										name="partNumber"
										options={partNumberOptions}
										value={draftPartNumberOption}
										onChange={(option) =>
											handleParticularChange("partNumber", option)
										}
										placeholder="Part no."
									/>
								</div>
							) : null}

							{hasColumn("particular") ? (
								<div className={getCellClassName("particular")}>
									<SelectInput
										name="particular"
										options={particularOptions}
										value={draftParticularOption}
										onChange={(option) =>
											handleParticularChange("particular", option)
										}
										placeholder="Select item"
									/>
								</div>
							) : null}

							{hasColumn("description") ? (
								<div className={getCellClassName("description")}>
									<FormInput
										name="description"
										value={draft.description ?? ""}
										placeholder="Description"
										onChange={(event) =>
											setDraft((previous) => ({
												...previous,
												description: event.target.value,
											}))
										}
									/>
								</div>
							) : null}

							{hasColumn("rate") ? (
								<div className={getCellClassName("rate")}>
									<FormInput
										type="number"
										name="rate"
										value={draft.rate}
										disabled={getColumn("rate")?.disabled}
										onChange={(event) =>
											setDraft((previous) => ({
												...previous,
												rate: Number(event.target.value),
											}))
										}
									/>
								</div>
							) : null}

							{hasColumn("width") ? (
								<div className={getCellClassName("width")}>
									<FormInput
										type="number"
										name="width"
										value={draft.width ?? ""}
										onChange={(event) =>
											setDraft((previous) => ({
												...previous,
												width: Number(event.target.value),
											}))
										}
									/>
								</div>
							) : null}

							{hasColumn("height") ? (
								<div className={getCellClassName("height")}>
									<FormInput
										type="number"
										name="height"
										value={draft.height ?? ""}
										onChange={(event) =>
											setDraft((previous) => ({
												...previous,
												height: Number(event.target.value),
											}))
										}
									/>
								</div>
							) : null}

							{hasColumn("unit") ? (
								<div className={getCellClassName("unit")}>
									<FormInput
										name="unit"
										value={draft.unit ?? ""}
										onChange={(event) =>
											setDraft((previous) => ({
												...previous,
												unit: event.target.value,
											}))
										}
									/>
								</div>
							) : null}

							{hasColumn("quantity") ? (
								<div className={getCellClassName("quantity")}>
									<FormInput
										type="number"
										name="quantity"
										min={1}
										value={draft.quantity}
										onChange={(event) =>
											setDraft((previous) => ({
												...previous,
												quantity: Number(event.target.value),
											}))
										}
									/>
								</div>
							) : null}

							{hasColumn("total") ? (
								<div className={getCellClassName("total")}>
									<FormInput
										type="number"
										name="total"
										value={draftTotal}
										disabled
										readOnly
									/>
								</div>
							) : null}

							{hasColumn("quotation") ? (
								<div
									className={getCellClassName(
										"quotation",
										"line-item-editor-center",
									)}
								>
									<input
										id={quotationInputId}
										type="file"
										accept=".pdf,.jpg,.jpeg,.png,.webp"
										className="line-item-file-input"
										onChange={(event) => {
											handleQuotationChange(event.target.files?.[0] ?? null);

											event.target.value = "";
										}}
									/>

									{draft.quotationFileName || draft.quotationFileUrl ? (
										<div className="line-item-file-chip">
											<Paperclip aria-hidden="true" />

											<span
												className="line-item-file-name"
												title={draft.quotationFileName ?? "Quotation"}
											>
												{draft.quotationFileName ?? "File"}
											</span>

											<Button
												type="button"
												appearance="icon"
												variant="secondary"
												size="sm"
												Icon={X}
												aria-label="Remove quotation"
												isTooltip
												onClick={removeQuotation}
												className="line-item-file-remove"
											/>
										</div>
									) : (
										<label
											htmlFor={quotationInputId}
											className="line-item-file-upload"
											title="Upload quotation"
											aria-label="Upload quotation"
										>
											<Upload aria-hidden="true" />
										</label>
									)}
								</div>
							) : null}

							{hasColumn("actions") ? (
								<div
									className={getCellClassName(
										"actions",
										"line-item-editor-actions",
									)}
								>
									<Button
										type="button"
										appearance="icon"
										variant="outline"
										size="sm"
										Icon={isEditing ? Check : Plus}
										aria-label={
											isEditing ? "Update line item" : "Add line item"
										}
										onClick={handleAddOrUpdate}
									/>

									<Button
										type="button"
										appearance="icon"
										variant="outline"
										size="sm"
										Icon={RotateCcw}
										aria-label="Reset line item"
										onClick={resetDraft}
									/>
								</div>
							) : null}
						</div>
					) : null}

					<div className="line-item-editor-body">
						{items.length === 0 ? (
							<div className="line-item-editor-empty">
								<p className="line-item-editor-empty-title">
									No line items added
								</p>

								{!isViewer ? (
									<p className="line-item-editor-empty-description">
										Use the row above to add the first item.
									</p>
								) : null}
							</div>
						) : (
							items.map((item, index) => {
								const rowTotal =
									Number(item.rate || 0) * Number(item.quantity || 0);

								const isActiveRow = editingIndex === index;

								return (
									<div
										key={item.id ?? item.value ?? `${category}-${index}`}
										className={[
											"line-item-editor-row",
											isActiveRow && "line-item-editor-row-active",
										]
											.filter(Boolean)
											.join(" ")}
									>
										{hasColumn("sno") ? (
											<div
												className={getCellClassName(
													"sno",
													"line-item-editor-index",
												)}
											>
												{index + 1}.
											</div>
										) : null}

										{hasColumn("partNumber") ? (
											<div
												className={getCellClassName(
													"partNumber",
													"line-item-editor-value",
												)}
											>
												{item.partNumber || "--"}
											</div>
										) : null}

										{hasColumn("particular") ? (
											<div
												className={getCellClassName(
													"particular",
													"line-item-editor-value line-item-editor-value-primary",
												)}
											>
												{item.label || item.particular || "--"}
											</div>
										) : null}

										{hasColumn("description") ? (
											<div
												className={getCellClassName(
													"description",
													"line-item-editor-value line-item-editor-description",
												)}
											>
												{item.description || "--"}
											</div>
										) : null}

										{hasColumn("width") ? (
											<div
												className={getCellClassName(
													"width",
													"line-item-editor-value line-item-editor-number",
												)}
											>
												{item.width ?? "--"}
											</div>
										) : null}

										{hasColumn("height") ? (
											<div
												className={getCellClassName(
													"height",
													"line-item-editor-value line-item-editor-number",
												)}
											>
												{item.height ?? "--"}
											</div>
										) : null}

										{hasColumn("unit") ? (
											<div
												className={getCellClassName(
													"unit",
													"line-item-editor-value",
												)}
											>
												{item.unit ?? "--"}
											</div>
										) : null}

										{hasColumn("rate") ? (
											<div
												className={getCellClassName(
													"rate",
													"line-item-editor-value line-item-editor-number",
												)}
											>
												{Number(item.rate || 0).toFixed(2)}
											</div>
										) : null}

										{hasColumn("quantity") ? (
											<div
												className={getCellClassName(
													"quantity",
													"line-item-editor-value line-item-editor-number",
												)}
											>
												{Number(item.quantity || 0)}
											</div>
										) : null}

										{hasColumn("total") ? (
											<div
												className={getCellClassName(
													"total",
													"line-item-editor-value line-item-editor-total",
												)}
											>
												{rowTotal.toFixed(2)}
											</div>
										) : null}

										{hasColumn("quotation") ? (
											<div
												className={getCellClassName(
													"quotation",
													"line-item-editor-center",
												)}
											>
												{item.quotationFileUrl ? (
													<a
														href={item.quotationFileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="line-item-file-action"
														title={item.quotationFileName ?? "View quotation"}
														aria-label={
															item.quotationFileName
																? `View quotation: ${item.quotationFileName}`
																: "View quotation"
														}
													>
														<Paperclip aria-hidden="true" />
													</a>
												) : item.quotationFileName ? (
													<span
														className="line-item-file-action line-item-file-action-disabled"
														title={item.quotationFileName}
													>
														<Paperclip aria-hidden="true" />
													</span>
												) : (
													<span className="line-item-empty-value">--</span>
												)}
											</div>
										) : null}

										{hasColumn("actions") ? (
											<div
												className={getCellClassName(
													"actions",
													"line-item-editor-actions",
												)}
											>
												<Button
													type="button"
													appearance="icon"
													variant="outline"
													size="sm"
													Icon={Pencil}
													aria-label="Edit line item"
													onClick={() => handleEdit(index)}
												/>

												<Button
													type="button"
													appearance="icon"
													variant="outline"
													size="sm"
													Icon={Trash2}
													aria-label="Delete line item"
													onClick={() => handleDelete(index)}
												/>
											</div>
										) : null}
									</div>
								);
							})
						)}
					</div>

					{items.length > 0 ? (
						<footer className="line-item-editor-total-row">
							<span className="line-item-editor-total-label">Grand Total</span>

							<strong className="line-item-editor-total-value">
								{grandTotal.toFixed(2)}
							</strong>
						</footer>
					) : null}
				</div>
			</div>
		</section>
	);
}
