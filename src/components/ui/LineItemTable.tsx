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

	const partNumbers = particularOptions.map((item) => ({
		value: item.particular,
		label: item.partNumber,
	}));

	const isEditing = editingIndex !== null;

	const resetDraft = () => {
		setDraft(EMPTY_DRAFT);
		setEditingIndex(null);
	};

	const handleParticularChange = (
		fieldName: string,
		opt: LineItemOption | null,
	) => {
		if (!opt) return;

		const selected =
			fieldName === "partNumber"
				? particularOptions.find((i) => i.partNumber === opt.label)
				: particularOptions.find((i) => i.value === opt.value);

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

		onChange((prev) => prev.filter((_, i) => i !== index));
	};

	const total = Number(draft.rate) * Number(draft.quantity);

	const draftPartNumberOpt =
		partNumbers.find((o) => o.label === draft.partNumber) ?? null;

	const draftParticularOpt =
		particularOptions.find((o) => o.value === draft.particular) ?? null;

	return (
		<div className="mb-2 border border-gray-300 rounded-sm bg-white shadow-sm overflow-hidden">
			<div className="bg-gray-200 px-6 py-2 border-b border-gray-300">
				<h3 className="font-semibold text-gray-800 text-md">{title}</h3>
			</div>

			<div className="p-3">
				<div className="grid grid-cols-12 text-sm font-semibold text-gray-700 mb-2">
					<div className="col-span-1">SNo</div>
					<div className="col-span-2">Part No.</div>
					<div className="col-span-2">Particulars</div>
					<div className="col-span-3">Description</div>
					<div className="col-span-1">Rate</div>
					<div className="col-span-1">Qty</div>
					<div className="col-span-1 text-center">Total</div>
					<div className="col-span-1 text-center">Action</div>
				</div>

				{!isViewer && (
					<div className="grid grid-cols-12 gap-3 mb-2 items-center">
						<div className="col-span-1 text-gray-500">
							{isEditing ? editingIndex + 1 : items.length + 1}
						</div>

						<div className="col-span-2">
							<SelectInput
								name="partNumber"
								options={partNumbers}
								value={draftPartNumberOpt}
								onChange={(o: LineItemOption | null) =>
									handleParticularChange("partNumber", o)
								}
							/>
						</div>

						<div className="col-span-2">
							<SelectInput
								name="particular"
								options={particularOptions}
								value={draftParticularOpt}
								onChange={(o: LineItemOption | null) =>
									handleParticularChange("particular", o)
								}
							/>
						</div>

						<div className="col-span-3">
							<FormInput
								name="description"
								value={draft.description as string}
								onChange={(e) =>
									setDraft((prev) => ({
										...prev,
										description: e.target.value,
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
								onChange={(e) =>
									setDraft((prev) => ({
										...prev,
										rate: Number(e.target.value),
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
								onChange={(e) =>
									setDraft((prev) => ({
										...prev,
										quantity: Number(e.target.value),
									}))
								}
							/>
						</div>

						<div className="col-span-1 font-medium">
							<FormInput type="number" name="total" value={total} disabled />
						</div>

						<div className="col-span-1 flex justify-center gap-2">
							<Button
								onClick={handleAddOrUpdate}
								status="brand"
								size="sm"
								Icon={isEditing ? Check : Plus}
								className="p-2 rounded-full"
							/>

							<Button
								onClick={resetDraft}
								status="outline"
								size="sm"
								Icon={RotateCcw}
								className="p-2 rounded-full"
							/>
						</div>
					</div>
				)}

				<div className="space-y-2 overflow-y-auto py-1 max-h-[30vh] scrollbar-sleek">
					{items.map((item, index) => (
						<div
							key={`${item.value}-${item.partNumber}-${index}`}
							className={`grid grid-cols-12 py-3 px-2 rounded-lg text-sm items-center transition-colors ${
								editingIndex === index
									? "bg-orange-50 border border-orange-300"
									: "bg-gray-50"
							}`}
						>
							<div className="col-span-1">{index + 1}</div>

							<div className="col-span-2">{item.partNumber}</div>

							<div className="col-span-2">
								{particularOptions.find((p) => p.value === item.particular)
									?.label ?? item.label}
							</div>

							<div className="col-span-3">{item.description}</div>

							<div className="col-span-1 text-right">{item.rate}</div>

							<div className="col-span-1 text-right">{item.quantity}</div>

							<div className="col-span-1 text-right font-medium">
								{Number(item.rate) * Number(item.quantity)}
							</div>

							{!isViewer && (
								<div className="col-span-1 flex justify-center gap-3 text-gray-500">
									<Pencil
										size={16}
										className={`cursor-pointer hover:text-orange-500 ${
											editingIndex === index ? "text-orange-500" : ""
										}`}
										onClick={() => handleEdit(index)}
									/>

									<Trash2
										size={16}
										className="cursor-pointer hover:text-red-500"
										onClick={() => handleDelete(index)}
									/>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
