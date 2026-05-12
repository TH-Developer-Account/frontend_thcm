import { Trash2, Pencil, Plus, Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import SelectInput from "../FormElements/SelectInput";
import FormInput from "../FormElements/FormInput";
import Button from "../common/Button";
import type { LineItemOption } from "../../modules/marketing/types";

interface LineItemTableProps {
	title: string;
	items: LineItemOption[];
	onChange: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	particularOptions: LineItemOption[];
	isViewer?: boolean;
	category: string;
}

const EMPTY_DRAFT: LineItemOption = {
	value: "",
	label: "",
	particular: "",
	description: "",
	rate: 0,
	quantity: 0,
	partNumber: "",
};

export default function LineItemTable({
	title,
	items,
	onChange,
	particularOptions,
	isViewer = false,
	category,
}: LineItemTableProps) {
	const [draft, setDraft] = useState<LineItemOption>(EMPTY_DRAFT);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	const isEditing = editingIndex !== null;

	const partNumbers = particularOptions.map((item) => ({
		value: item.particular,
		label: item.partNumber || "--",
	}));

	const draftPartNumberOpt =
		partNumbers.find((option) => option.label === draft.partNumber) ?? null;

	const draftParticularOpt =
		particularOptions.find((option) => option.value === draft.particular) ??
		null;

	const total = Number(draft.rate || 0) * Number(draft.quantity || 0);

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
			value: selected.value,
			label: selected.label,
			particular: selected.value,
			partNumber: selected.partNumber ?? "",
			description: selected.description ?? "",
			rate: Number(selected.rate) || 0,
			quantity:
				prev.quantity > 0 ? prev.quantity : Number(selected.quantity) || 1,
		}));
	};

	const handleAddOrUpdate = () => {
		if (!draft.particular) return;

		const payload: LineItemOption = {
			...draft,
			category,
			rate: Number(draft.rate) || 0,
			quantity: Number(draft.quantity) || 1,
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
		});

		setEditingIndex(index);
	};

	const handleDelete = (index: number) => {
		if (editingIndex === index) resetDraft();
		onChange((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
	};

	const grandTotal = items.reduce(
		(sum, item) => sum + Number(item.rate || 0) * Number(item.quantity || 0),
		0,
	);

	return (
		<div className="my-2 overflow-hidden rounded-lg border border-orange-200 bg-white">
			<div className="flex items-center justify-between border-b border-orange-200 bg-orange-50 px-3 py-2">
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
					<div className="grid grid-cols-12 items-center gap-3 rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
						<div className="col-span-1">SNo</div>
						<div className="col-span-2">Part No.</div>
						<div className="col-span-2">Particulars</div>
						<div className="col-span-3">Description</div>
						<div className="col-span-1 text-right">Rate</div>
						<div className="col-span-1 text-right">Qty</div>
						<div className="col-span-1 text-right">Total</div>
						{!isViewer && <div className="col-span-1 text-center">Action</div>}
					</div>

					{!isViewer && (
						<div className="mt-2 grid grid-cols-12 items-center gap-3  px-3 py-2">
							<div className="col-span-1 text-xs font-semibold text-slate-600">
								{isEditing ? Number(editingIndex) + 1 : items.length + 1}.
							</div>

							<div className="col-span-2">
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

							<div className="col-span-2">
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

							<div className="col-span-3">
								<FormInput
									name="description"
									value={draft.description as string}
									placeholder="Description"
									onChange={(event) =>
										setDraft((prev) => ({
											...prev,
											description: event.target.value,
										}))
									}
								/>
							</div>

							<div className="col-span-1">
								<FormInput
									type="number"
									name="rate"
									value={draft.rate}
									disabled={category !== "EVENT_OVERHEAD"}
									onChange={(event) =>
										setDraft((prev) => ({
											...prev,
											rate: Number(event.target.value),
										}))
									}
								/>
							</div>

							<div className="col-span-1">
								<FormInput
									type="number"
									name="quantity"
									min={1}
									value={draft.quantity}
									onChange={(event) =>
										setDraft((prev) => ({
											...prev,
											quantity: Number(event.target.value),
										}))
									}
								/>
							</div>

							<div className="col-span-1">
								<FormInput type="number" name="total" value={total} disabled />
							</div>

							<div className="col-span-1 flex justify-center gap-1.5">
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
						</div>
					)}

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
										className={`
											grid grid-cols-12 items-center gap-3 px-3 py-2 text-[13px] transition
											${isActiveRow ? "bg-orange-100" : "hover:bg-slate-50"}
										`}
									>
										<div className="col-span-1 text-xs font-medium text-slate-600">
											{index + 1}.
										</div>

										<div className="col-span-2 truncate text-slate-700">
											{item.partNumber || "--"}
										</div>

										<div className="col-span-2 truncate font-semibold text-slate-950">
											{item.label || item.particular || "--"}
										</div>

										<div className="col-span-3 truncate text-slate-700">
											{item.description || "--"}
										</div>

										<div className="col-span-1 text-right tabular-nums font-medium text-slate-800">
											{Number(item.rate || 0).toFixed(2)}
										</div>

										<div className="col-span-1 text-right tabular-nums font-medium text-slate-800">
											{Number(item.quantity || 0)}
										</div>

										<div className="col-span-1 text-right font-bold tabular-nums text-slate-950">
											{rowTotal.toFixed(2)}
										</div>

										{!isViewer && (
											<div className="col-span-1 flex justify-center gap-1.5">
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
		</div>
	);
}
