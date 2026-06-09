import {
	Trash2,
	Pencil,
	Plus,
	Check,
	RotateCcw,
	Upload,
	FileText,
	Paperclip,
	X,
} from "lucide-react";
import { useState } from "react";
import SelectInput from "../FormElements/SelectInput";
import FormInput from "../FormElements/FormInput";
import Button from "../common/Button";
import type { LineItemOption } from "../../modules/marketing/activity-planner/types/lineItem.types";
import type {
	ColumnConfig,
	ColumnKey,
} from "../../modules/marketing/activity-planner/types/lineItem.types";
import { DEFAULT_COLUMNS } from "../../modules/marketing/activity-planner/utils/columnPresets";

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
	quotationFileUrl: null,
	quotationFileName: null,
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
		}));
	};
	const handleDraftQuotationChange = (file?: File | null) => {
		setDraft((prev) => ({
			...prev,
			quotationFile: file ?? null,
			quotationFileName: file?.name ?? null,
		}));
	};

	const handleRowQuotationChange = (index: number, file?: File | null) => {
		onChange((prev) =>
			prev.map((item, itemIndex) =>
				itemIndex === index
					? {
							...item,
							quotationFile: file ?? null,
							quotationFileName: file?.name ?? null,
						}
					: item,
			),
		);
	};
	const handleQuotationChange = (file?: File | null) => {
		if (!file) return;

		setDraft((prev) => ({
			...prev,
			quotationFile: file,
			quotationFileName: file.name,
			quotationUrl: URL.createObjectURL(file),
		}));
	};

	const removeQuotation = () => {
		setDraft((prev) => {
			if (prev.quotationFile && prev.quotationUrl) {
				URL.revokeObjectURL(prev.quotationUrl);
			}

			return {
				...prev,
				quotationFile: null,
				quotationUrl: null,
				quotationFileName: null,
			};
		});
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
		if (editingIndex === index) resetDraft();
		onChange((prev) => prev.filter((_, i) => i !== index));
	};

	const grandTotal = items.reduce(
		(sum, item) => sum + Number(item.rate || 0) * Number(item.quantity || 0),
		0,
	);

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
							{/* Quotation file */}
							{has("quotation") && (
								<div
									className={`col-span-${col("quotation").colSpan} flex justify-center`}
								>
									<input
										id="quotation-upload"
										type="file"
										accept=".pdf,.jpg,.jpeg,.png,.webp"
										className="hidden"
										onChange={(e) =>
											handleQuotationChange(e.target.files?.[0] ?? null)
										}
									/>

									{draft.quotationFileName || draft.quotationFileUrl ? (
										<div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
											<Paperclip className="h-3.5 w-3.5 text-slate-500" />

											<span
												className="max-w-[80px] truncate text-[11px] text-slate-700"
												title={draft.quotationFileName ?? "Quotation"}
											>
												{draft.quotationFileName ?? "File"}
											</span>

											<button
												type="button"
												onClick={removeQuotation}
												className="rounded-full p-0.5 hover:bg-slate-200"
												title="Remove quotation"
											>
												<X className="h-3 w-3 text-slate-500" />
											</button>
										</div>
									) : (
										<label
											htmlFor="quotation-upload"
											className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-slate-300 bg-white hover:border-orange-300 hover:bg-orange-50"
											title="Upload quotation"
										>
											<Upload className="h-4 w-4 text-slate-500" />
										</label>
									)}
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
							<div className="text-center text-xs font-medium text-slate-500">
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
										{has("quotation") && (
											<div
												className={`col-span-${col("quotation").colSpan} flex justify-center`}
											>
												{item.quotationFileUrl ? (
													<a
														href={item.quotationFileUrl}
														target="_blank"
														rel="noreferrer"
														className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 hover:bg-orange-50"
														title={item.quotationFileName ?? "View quotation"}
													>
														<Paperclip className="h-4 w-4 text-orange-700" />
													</a>
												) : item.quotationFileName ? (
													<span
														className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50"
														title={item.quotationFileName}
													>
														<Paperclip className="h-4 w-4 text-slate-500" />
													</span>
												) : (
													<span className="text-xs text-slate-400">--</span>
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
						<div className="mt-2 flex justify-end border-t border-slate-300 border-dashed  px-4 py-1">
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
		</div>
	);
}
