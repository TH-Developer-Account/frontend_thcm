import { Check, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
	ColumnConfig,
	ColumnKey,
	LineItemOption,
} from "../activity-planner/types/epc.types";

import { DEFAULT_COLUMNS } from "../activity-planner/utils/constant";
import SelectInput from "../../../components/forms/SelectInput";
import FormInput from "../../../components/forms/FormInput";
import Button from "../../../components/common/Button";
import { useToast } from "../../../context/Auth/AuthContext";
import {
	createRemoteFileUploadValue,
	formatFileSize,
	getFileExtension,
	getMimeTypeFromFileName,
} from "../../../components/ui/FileUpload/fileUpload.helpers";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import LineItemAttachment, {
	LINE_ITEM_ATTACHMENT_TYPES,
	type LineItemAttachmentUpload,
} from "./LineItemAttachment";

interface LineItemTableProps {
	title: string;
	items: LineItemOption[];
	onChange: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	particularOptions: LineItemOption[];
	isViewer?: boolean;
	category: string;
	columns?: ColumnConfig[];

	/**
	 * Uploads one attachment and returns its S3 key. When omitted the file is
	 * only kept locally (preview/download work, nothing is sent to the server).
	 */
	onUploadAttachment?: (file: File) => Promise<LineItemAttachmentUpload>;

	/** True while any attachment is still uploading — hosts block Save on it. */
	onBusyChange?: (busy: boolean) => void;

	/** Hide the table's own title row when a host section already shows it. */
	hideHeader?: boolean;
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
	quotationS3Key: null,
});

/** Every attachment field, cleared. */
const EMPTY_ATTACHMENT = {
	quotationFile: null,
	quotationFileUrl: null,
	quotationFileName: null,
	quotationS3Key: null,
} satisfies Partial<LineItemOption>;

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

const revokeBlobUrl = (url?: string | null) => {
	if (url?.startsWith("blob:")) {
		URL.revokeObjectURL(url);
	}
};

const getErrorMessage = (error: unknown): string => {
	const apiError = error as {
		response?: { data?: { message?: string } };
		message?: string;
	};

	return (
		apiError?.response?.data?.message ||
		apiError?.message ||
		"Could not upload the file."
	);
};

/**
 * Line-item attachment fields -> FileUploadValue.
 * A freshly picked file (local blob) or a file already saved on the server
 * (pre-signed URL from the API mapper) both come out in the same shape.
 */
const toUploadValue = (item: LineItemOption): FileUploadValue | null => {
	const url = item.quotationFileUrl;

	if (!url) return null;

	const file = item.quotationFile;

	if (file) {
		return {
			id: url,
			file,
			url,
			name: item.quotationFileName || file.name,
			type: file.type || getMimeTypeFromFileName(file.name),
			size: file.size,
			extension: getFileExtension(file.name),
			sizeLabel: formatFileSize(file.size),
			isLocal: true,
			caption: "",
		};
	}

	return createRemoteFileUploadValue({
		id: url,
		url,
		name: item.quotationFileName ?? undefined,
		fallbackName: "Quotation",
	});
};

export default function LineItemTable({
	title,
	items,
	onChange,
	particularOptions,
	isViewer = false,
	category,
	columns = DEFAULT_COLUMNS,
	onUploadAttachment,
	onBusyChange,
	hideHeader = false,
}: LineItemTableProps) {
	const { showToast } = useToast();

	const [draft, setDraft] = useState<LineItemOption>(createEmptyDraft);

	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	// Blob URLs of attachments that are still uploading. A blob URL is unique
	// per picked file, so it doubles as the key for "this upload".
	const [uploadingUrls, setUploadingUrls] = useState<string[]>([]);

	const isEditing = editingIndex !== null;

	const hasUploads = uploadingUrls.length > 0;

	useEffect(() => {
		onBusyChange?.(hasUploads);
	}, [hasUploads, onBusyChange]);

	const isUploading = (url?: string | null): boolean =>
		Boolean(url) && uploadingUrls.includes(url as string);

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

	const draftQuotation = useMemo(
		() => toUploadValue(draft),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[draft.quotationFile, draft.quotationFileUrl, draft.quotationFileName],
	);

	/**
	 * Revokes the draft's blob preview, unless a saved row still uses that URL
	 * (editing a row reuses its URL in the draft).
	 */
	const releaseDraftFile = () => {
		const url = draft.quotationFileUrl;

		if (url && !items.some((item) => item.quotationFileUrl === url)) {
			revokeBlobUrl(url);
		}
	};

	const resetDraft = () => {
		releaseDraftFile();

		setDraft(createEmptyDraft());
		setEditingIndex(null);
	};

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

	/* ---------------------------- Attachments ---------------------------- */

	/** Applies `patch` to every draft/row still holding this blob URL. */
	const patchAttachmentByUrl = (
		url: string,
		patch: Partial<LineItemOption>,
	) => {
		setDraft((previous) =>
			previous.quotationFileUrl === url ? { ...previous, ...patch } : previous,
		);

		onChange((previous) =>
			previous.map((item) =>
				item.quotationFileUrl === url ? { ...item, ...patch } : item,
			),
		);
	};

	/**
	 * Picks a file for the draft row or a saved row, shows it straight away
	 * (local blob) and uploads it in the background. The S3 key lands on the
	 * same row when the upload finishes; a failed upload clears the file again.
	 */
	const attachFile = async (file: File, target: "draft" | number) => {
		if (!LINE_ITEM_ATTACHMENT_TYPES.includes(file.type)) {
			showToast({
				type: "error",
				title: "Unsupported file",
				description: "Only JPEG images or PDF files are accepted.",
			});
			return;
		}

		const blobUrl = URL.createObjectURL(file);

		const localPatch: Partial<LineItemOption> = {
			quotationFile: file,
			quotationFileUrl: blobUrl,
			quotationFileName: file.name,
			quotationS3Key: null,
		};

		if (target === "draft") {
			releaseDraftFile();
			setDraft((previous) => ({ ...previous, ...localPatch }));
		} else {
			onChange((previous) =>
				previous.map((item, index) =>
					index === target ? { ...item, ...localPatch } : item,
				),
			);
		}

		if (!onUploadAttachment) return;

		setUploadingUrls((previous) => [...previous, blobUrl]);

		try {
			const result = await onUploadAttachment(file);

			patchAttachmentByUrl(blobUrl, {
				quotationS3Key: result.s3Key,
				quotationFileName: result.fileName || file.name,
			});
		} catch (error) {
			revokeBlobUrl(blobUrl);
			patchAttachmentByUrl(blobUrl, EMPTY_ATTACHMENT);

			showToast({
				type: "error",
				title: "Upload failed",
				description: getErrorMessage(error),
			});
		} finally {
			setUploadingUrls((previous) => previous.filter((url) => url !== blobUrl));
		}
	};

	const removeDraftAttachment = () => {
		releaseDraftFile();

		setDraft((previous) => ({ ...previous, ...EMPTY_ATTACHMENT }));
	};

	const removeRowAttachment = (index: number) => {
		const url = items[index]?.quotationFileUrl;

		onChange((previous) =>
			previous.map((item, itemIndex) =>
				itemIndex === index ? { ...item, ...EMPTY_ATTACHMENT } : item,
			),
		);

		if (!url) return;

		// The draft may be editing this very row — drop its copy as well.
		setDraft((previous) =>
			previous.quotationFileUrl === url
				? { ...previous, ...EMPTY_ATTACHMENT }
				: previous,
		);

		revokeBlobUrl(url);
	};

	/* ------------------------------ Row actions ------------------------------ */

	const handleAddOrUpdate = () => {
		if (!draft.particular) return;

		// The key only arrives when the upload finishes.
		if (isUploading(draft.quotationFileUrl)) return;

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
		 * newly added item still uses that blob URL.
		 */
		setDraft(createEmptyDraft());
		setEditingIndex(null);
	};

	const handleEdit = (index: number) => {
		const item = items[index];

		if (!item) return;

		releaseDraftFile();

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
			quotationS3Key: item.quotationS3Key ?? null,
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
			{hideHeader ? null : (
				<header className="line-item-editor-header">
					<div className="line-item-editor-heading">
						<span className="line-item-editor-marker" aria-hidden="true" />

						<h3 className="line-item-editor-title">{title}</h3>
					</div>

					<span className="line-item-editor-count">
						{items.length} {items.length === 1 ? "item" : "items"}
					</span>
				</header>
			)}

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
									<LineItemAttachment
										inputName="quotation"
										value={draftQuotation}
										uploading={isUploading(draft.quotationFileUrl)}
										onSelect={(file) => void attachFile(file, "draft")}
										onRemove={removeDraftAttachment}
									/>
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
										disabled={isUploading(draft.quotationFileUrl)}
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

								const rowQuotation = toUploadValue(item);

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
												<LineItemAttachment
													inputName={`quotation-${index}`}
													value={rowQuotation}
													unavailableName={
														rowQuotation ? null : item.quotationFileName
													}
													uploading={isUploading(item.quotationFileUrl)}
													readOnly={isViewer}
													onSelect={
														isViewer
															? undefined
															: (file) => void attachFile(file, index)
													}
													onRemove={
														isViewer
															? undefined
															: () => removeRowAttachment(index)
													}
												/>
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
