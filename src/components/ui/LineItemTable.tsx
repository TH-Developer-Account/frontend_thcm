import { Trash2, Pencil, Plus, Check, RotateCcw, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import SelectInput from "../FormElements/SelectInput";
import FormInput from "../FormElements/FormInput";
import Button from "../common/Button";
import type { LineItemOption } from "../../modules/marketing/types";
import type {
	ColumnConfig,
	ColumnKey,
} from "../../modules/marketing/activity-planner/types/lineItem.types";
import { DEFAULT_COLUMNS } from "../../modules/marketing/activity-planner/utils/columnPresets";
import { Modal } from "../common/Modal";
import QuotationUploadField from "../../components/ui/QuotationUploadField";
import { uploadQuotationFile } from "../../modules/marketing/activity-planner/api/fileUpload.api";

interface LineItemTableProps {
	title: string;
	items: LineItemOption[];
	onChange: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	particularOptions: LineItemOption[];
	isViewer?: boolean;
	category: string;
	columns?: ColumnConfig[];
}

const EMPTY_DRAFT: LineItemOption = {
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
	quotationPreviewUrl: "",
};

function alignClass(align?: "left" | "right" | "center") {
	if (align === "right") return "text-right";
	if (align === "center") return "text-center";
	return "text-left";
}

export default function LineItemTable({
	title,
	items,
	onChange,
	particularOptions,
	isViewer = false,
	category,
	columns = DEFAULT_COLUMNS,
}: LineItemTableProps) {
	const [draft, setDraft] = useState<LineItemOption>(EMPTY_DRAFT);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewUrl, setPreviewUrl] = useState("");
	const [previewType, setPreviewType] = useState("");

	const isEditing = editingIndex !== null;

	// Strip "actions" column when in viewer mode
	const visibleColumns = isViewer
		? columns.filter((c) => c.key !== "actions")
		: columns;

	// Quick helpers
	const has = (key: ColumnKey) => visibleColumns.some((c) => c.key === key);
	const col = (key: ColumnKey) => visibleColumns.find((c) => c.key === key)!;

	// ── Select options ──────────────────────────────────────────────────────

	const partNumbers = particularOptions.map((item) => ({
		value: item.particular,
		label: item.partNumber || "--",
	}));

	const draftPartNumberOpt =
		partNumbers.find((o) => o.label === draft.partNumber) ?? null;

	const draftParticularOpt =
		particularOptions.find((o) => o.value === draft.particular) ?? null;

	const total = Number(draft.rate || 0) * Number(draft.quantity || 0);

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);
	// ── Draft handlers ──────────────────────────────────────────────────────

	const resetDraft = () => {
		setDraft(EMPTY_DRAFT);
		setEditingIndex(null);
	};

	const handleParticularChange = (
		fieldName: string,
		option: LineItemOption | { value: string; label: string } | null,
	) => {
		if (!option) return;

		const selected =
			fieldName === "partNumber"
				? particularOptions.find((item) => item.partNumber === option.label)
				: particularOptions.find((item) => item.value === option.value);

		if (!selected) return;

		setDraft((prev) => ({
			...prev,

			// common
			value: selected.value,
			label: selected.label,
			particular: selected.value,

			partNumber: selected.partNumber ?? "",
			description: selected.description ?? "",

			category: selected.category,

			// default pricing flow
			rate: Number(selected.rate) || 0,

			quantity:
				(prev.quantity ?? 0) > 0
					? prev.quantity
					: Number(selected.quantity) || 1,

			// artwork flow
			width: Number(selected.width) || 0,

			height: Number(selected.height) || 0,

			unit: selected.unit ?? "",
			// quotation
			quotationFile: selected.quotationFile ?? null,

			quotationUrl: selected.quotationUrl ?? "",

			quotationFileName: selected.quotationFileName ?? "",

			quotationPreviewUrl: selected.quotationPreviewUrl ?? "",
		}));
	};

	const handleAddOrUpdate = () => {
		if (!draft.particular) return;

		const payload: LineItemOption = {
			...draft,

			category,

			// pricing flow
			rate: Number(draft.rate) || 0,

			quantity: Number(draft.quantity) || 1,

			// artwork flow
			width: Number(draft.width) || 0,

			height: Number(draft.height) || 0,

			unit: draft.unit ?? "",
			// quotation
			quotationFile: draft.quotationFile ?? null,

			quotationUrl: draft.quotationUrl ?? "",

			quotationFileName: draft.quotationFileName ?? "",

			quotationPreviewUrl: draft.quotationPreviewUrl ?? "",
		};

		if (isEditing) {
			onChange((prev) =>
				prev.map((item, index) =>
					index === editingIndex ? { ...item, ...payload } : item,
				),
			);
		} else {
			onChange((prev) => [...prev, payload]);
		}

		resetDraft();
	};

	const handleEdit = (index: number) => {
		const item = items[index];

		if (!item) return;

		setDraft({
			value: item.value,

			label: item.label,

			particular: item.particular || item.value,

			description: item.description ?? "",

			rate: Number(item.rate) || 0,

			quantity: Number(item.quantity) || 1,

			partNumber: item.partNumber ?? "",

			category: item.category,

			// artwork
			width: Number(item.width) || 0,

			height: Number(item.height) || 0,

			unit: item.unit ?? "",

			// quotation
			quotationFile: item.quotationFile ?? null,

			quotationUrl: item.quotationUrl ?? "",

			quotationFileName: item.quotationFileName ?? "",

			quotationPreviewUrl: item.quotationPreviewUrl ?? "",
		});

		setEditingIndex(index);
	};

	const handleDelete = (index: number) => {
		if (editingIndex === index) resetDraft();
		onChange((prev) => prev.filter((_, i) => i !== index));
	};

	const grandTotal = items.reduce(
		(sum, item) => sum + Number(item.rate || 0) * Number(item.quantity || 0),
		0,
	);

	const handleQuotationUpload = async (file: File) => {
		try {
			await uploadQuotationFile(file);

			const previewUrl = URL.createObjectURL(file);

			setDraft((prev) => ({
				...prev,
				quotationFile: file,
				quotationUrl: previewUrl,
				quotationPreviewUrl: previewUrl,
				quotationFileName: file.name,
				quotationFileType: file.type,
			}));
		} catch (error) {
			console.error(error);
			alert("File upload failed");
		}
	};
	// ── Render ──────────────────────────────────────────────────────────────

	return (
		<div className="my-2 overflow-hidden rounded-sm bg-white">
			{/* Title bar */}
			<div className="flex items-center justify-between px-3 py-1.5">
				<div className="inline-flex min-w-0 items-center gap-2">
					<span className="h-4 w-0.5 shrink-0 rounded-full bg-orange-600" />
					<h3 className="truncate text-[13px] font-semibold tracking-tight text-orange-800">
						{title}
					</h3>
				</div>
				<span className="rounded-full border border-orange-300 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-orange-700">
					{items.length} item{items.length === 1 ? "" : "s"}
				</span>
			</div>

			<div className="overflow-x-auto px-3 py-2">
				<div className="min-w-[980px]">
					{/* ── Header row ── */}
					<div className="grid grid-cols-12 items-center gap-3 rounded-md border-b border-slate-300 bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-800">
						{visibleColumns.map((c) => (
							<div
								key={c.key}
								className={`col-span-${c.colSpan} ${alignClass(c.align)}`}
							>
								{c.label}
							</div>
						))}
					</div>

					{/* ── Draft / add row ── */}
					{!isViewer && (
						<div className="mt-2 grid grid-cols-12 items-center gap-3 px-3 py-2">
							{/* SNo */}
							{has("sno") && (
								<div
									className={`col-span-${col("sno").colSpan} text-xs font-semibold text-slate-600`}
								>
									{isEditing ? Number(editingIndex) + 1 : items.length + 1}.
								</div>
							)}

							{/* Part Number */}
							{has("partNumber") && (
								<div className={`col-span-${col("partNumber").colSpan}`}>
									<SelectInput
										name="partNumber"
										options={partNumbers}
										value={draftPartNumberOpt}
										onChange={(option) =>
											handleParticularChange("partNumber", option)
										}
										placeholder="Part no."
									/>
								</div>
							)}

							{/* Particular */}
							{has("particular") && (
								<div className={`col-span-${col("particular").colSpan}`}>
									<SelectInput
										name="particular"
										options={particularOptions}
										value={draftParticularOpt}
										onChange={(option) =>
											handleParticularChange("particular", option)
										}
										placeholder="Select item"
									/>
								</div>
							)}

							{/* Description */}
							{has("description") && (
								<div className={`col-span-${col("description").colSpan}`}>
									<FormInput
										name="description"
										value={draft.description as string}
										placeholder="Description"
										onChange={(e) =>
											setDraft((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
									/>
								</div>
							)}

							{/* Rate */}
							{has("rate") && (
								<div className={`col-span-${col("rate").colSpan}`}>
									<FormInput
										type="number"
										name="rate"
										value={draft.rate}
										disabled={col("rate").disabled}
										onChange={(e) =>
											setDraft((prev) => ({
												...prev,
												rate: Number(e.target.value),
											}))
										}
									/>
								</div>
							)}

							{has("width") && (
								<div className={`col-span-${col("width").colSpan}`}>
									<FormInput
										type="number"
										name="width"
										value={draft.width ?? ""}
										onChange={(e) =>
											setDraft((prev) => ({
												...prev,
												width: Number(e.target.value),
											}))
										}
									/>
								</div>
							)}
							{has("height") && (
								<div className={`col-span-${col("height").colSpan}`}>
									<FormInput
										type="number"
										name="height"
										value={draft.height ?? ""}
										onChange={(e) =>
											setDraft((prev) => ({
												...prev,
												height: Number(e.target.value),
											}))
										}
									/>
								</div>
							)}
							{has("unit") && (
								<div className={`col-span-${col("unit").colSpan}`}>
									<FormInput
										name="unit"
										value={draft.unit ?? ""}
										onChange={(e) =>
											setDraft((prev) => ({
												...prev,
												unit: e.target.value,
											}))
										}
									/>
								</div>
							)}
							{/* Quantity */}
							{has("quantity") && (
								<div className={`col-span-${col("quantity").colSpan}`}>
									<FormInput
										type="number"
										name="quantity"
										min={1}
										value={draft.quantity}
										onChange={(e) =>
											setDraft((prev) => ({
												...prev,
												quantity: Number(e.target.value),
											}))
										}
									/>
								</div>
							)}
							{/* Total (always disabled — computed) */}
							{has("total") && (
								<div className={`col-span-${col("total").colSpan}`}>
									<FormInput
										type="number"
										name="total"
										value={total}
										disabled
									/>
								</div>
							)}

							{has("quotationFile") && (
								<div className={`col-span-${col("quotationFile").colSpan}`}>
									<QuotationUploadField
										value={draft.quotationUrl}
										fileName={draft.quotationFileName}
										onUpload={handleQuotationUpload}
										onPreview={() => {
											if (!draft.quotationPreviewUrl) return;

											setPreviewUrl(draft.quotationPreviewUrl);
											setPreviewType(draft.quotationFileType || "");
											setPreviewOpen(true);
										}}
									/>
								</div>
							)}

							{/* Actions */}
							{has("actions") && (
								<div
									className={`col-span-${col("actions").colSpan} flex justify-center gap-1.5`}
								>
									<Button
										type="button"
										onClick={handleAddOrUpdate}
										status="brand"
										size="sm"
										Icon={isEditing ? Check : Plus}
										className="h-6 w-8 rounded-full px-1"
									/>
									<Button
										type="button"
										onClick={resetDraft}
										status="outline"
										size="sm"
										Icon={RotateCcw}
										className="h-6 w-8 rounded-full px-1"
									/>
								</div>
							)}
						</div>
					)}

					{/* ── Items list ── */}
					<div className="mt-2 divide-y divide-slate-200">
						{items.length === 0 ? (
							<div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-center text-xs font-medium text-slate-500">
								No line items added yet
							</div>
						) : (
							items.map((item, index) => {
								const rowTotal =
									Number(item.rate || 0) * Number(item.quantity || 0);
								const isActiveRow = editingIndex === index;

								return (
									<div
										key={item.id ?? item.value ?? `${category}-${index}`}
										className={`grid grid-cols-12 items-center gap-3 px-3 py-2 text-[13px] transition ${
											isActiveRow ? "bg-orange-100" : "hover:bg-slate-50"
										}`}
									>
										{has("sno") && (
											<div
												className={`col-span-${col("sno").colSpan} text-xs font-medium text-slate-600`}
											>
												{index + 1}.
											</div>
										)}

										{has("partNumber") && (
											<div
												className={`col-span-${col("partNumber").colSpan} truncate text-slate-700`}
											>
												{item.partNumber || "--"}
											</div>
										)}

										{has("particular") && (
											<div
												className={`col-span-${col("particular").colSpan} truncate font-semibold text-slate-950`}
											>
												{item.label || item.particular || "--"}
											</div>
										)}

										{has("description") && (
											<div
												className={`col-span-${col("description").colSpan} truncate text-slate-700`}
											>
												{item.description || "--"}
											</div>
										)}
										{has("width") && (
											<div className={`col-span-${col("width").colSpan}`}>
												{item.width ?? "--"}
											</div>
										)}
										{has("height") && (
											<div className={`col-span-${col("height").colSpan}`}>
												{item.height ?? "--"}
											</div>
										)}
										{has("unit") && (
											<div className={`col-span-${col("unit").colSpan}`}>
												{item.unit ?? "--"}
											</div>
										)}
										{has("rate") && (
											<div
												className={`col-span-${col("rate").colSpan} ${alignClass(col("rate").align)} tabular-nums font-medium text-slate-800`}
											>
												{Number(item.rate || 0).toFixed(2)}
											</div>
										)}

										{has("quantity") && (
											<div
												className={`col-span-${col("quantity").colSpan} ${alignClass(col("quantity").align)} tabular-nums font-medium text-slate-800`}
											>
												{Number(item.quantity || 0)}
											</div>
										)}

										{has("total") && (
											<div
												className={`col-span-${col("total").colSpan} ${alignClass(col("total").align)} font-bold tabular-nums text-slate-950`}
											>
												{rowTotal.toFixed(2)}
											</div>
										)}
										{has("quotationFile") && (
											<div
												className={`col-span-${col("quotationFile").colSpan}`}
											>
												{item.quotationUrl ? (
													<Button
														type="button"
														size="sm"
														status="outline"
														Icon={Eye}
														className="h-6 w-8 rounded-full px-1"
														onClick={() => {
															setPreviewUrl(
																item.quotationPreviewUrl ||
																	item.quotationUrl ||
																	"",
															);

															setPreviewType(item.quotationFileType || "");
															setPreviewOpen(true);
														}}
													/>
												) : (
													"--"
												)}
											</div>
										)}
										{has("actions") && (
											<div
												className={`col-span-${col("actions").colSpan} flex justify-center gap-1.5`}
											>
												<Button
													type="button"
													onClick={() => handleEdit(index)}
													Icon={Pencil}
													status="brand"
													size="sm"
													className="h-6 w-8 rounded-full px-1"
													aria-label="Edit line item"
												/>
												<Button
													type="button"
													onClick={() => handleDelete(index)}
													Icon={Trash2}
													status="outline"
													size="sm"
													className="h-6 w-8 rounded-full px-1"
													aria-label="Delete line item"
												/>
											</div>
										)}
									</div>
								);
							})
						)}
					</div>

					{/* ── Grand total ── */}
					{items.length > 0 && (
						<div className="mt-2 flex justify-end rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5">
							<div className="flex items-center gap-3 text-xs">
								<span className="font-semibold text-slate-600">
									Grand Total
								</span>
								<span className="text-sm font-bold tabular-nums text-orange-800">
									{grandTotal.toFixed(2)}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
			<Modal open={previewOpen} className="max-w-6xl">
				<div className="p-1 bg-white">
					<div className="mb-3 flex items-center justify-between">
						<h3 className="text-sm font-semibold text-slate-900">
							File Preview
						</h3>

						<Button
							text="Close"
							status="outline"
							size="sm"
							onClick={() => setPreviewOpen(false)}
						/>
					</div>

					<div className="h-full rounded-sm border border-slate-200 overflow-hidden">
						{previewType === "application/pdf" ? (
							<iframe
								src={previewUrl}
								className="h-[80vh] w-full"
								title="PDF Preview"
							/>
						) : (
							<img
								src={previewUrl}
								alt="Preview"
								className="max-h-[80vh] w-full object-contain"
							/>
						)}
					</div>
				</div>
			</Modal>
		</div>
	);
}
