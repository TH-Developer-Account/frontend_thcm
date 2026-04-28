import { Trash2, Pencil, Plus, Check, RotateCcw } from "lucide-react";
import SelectInput from "../FormElements/SelectInput";
import FormInput from "../FormElements/FormInput";
import { useState } from "react";
import type { LineItemOption } from "../../modules/marketing/types";
import Button from "../common/Button";

interface LineItemTableProps {
	title: string;
	items: LineItemOption[];
	onChange: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	particularOptions: LineItemOption[];
	isViewer?: boolean;
	category: string;
}

// Stable unique ID for each row, separate from `value`
interface LineItem extends LineItemOption {
	_id: string;
}

const generateId = () =>
	`item-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const EMPTY_DRAFT: LineItemOption = {
	value: "",
	label: "",
	particular: "",
	description: "",
	rate: 0,
	quantity: 0,
	partNumber: "",
};

function toLineItem(item: LineItemOption): LineItem {
	return "_id" in item && (item as LineItem)._id
		? (item as LineItem)
		: { ...item, _id: generateId() };
}

export default function LineItemTable({
	title,
	items,
	onChange,
	particularOptions,
	isViewer = false,
	category,
}: LineItemTableProps) {
	const [draft, setDraft] = useState<LineItemOption>(EMPTY_DRAFT);
	const [editingId, setEditingId] = useState<string | null>(null);

	// Ensure every item (including API-loaded ones) has a stable _id
	const lineItems: LineItem[] = items.map(toLineItem);

	const partNumbers = particularOptions.map((item) => ({
		value: item.particular,
		label: item.partNumber,
	}));

	const resetDraft = () => {
		setDraft(EMPTY_DRAFT);
		setEditingId(null);
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
			partNumber: selected.partNumber ?? "",
			particular: selected.value,
			description: selected.description ?? "",
			rate: selected.rate,
			quantity: prev.quantity > 0 ? prev.quantity : (selected.quantity ?? 1),
			value: selected.value,
			label: selected.label,
		}));
	};

	const handleAdd = () => {
		if (!draft.particular) return;
		if (editingId) {
			onChange((prev) =>
				prev.map((i) =>
					(i as LineItem)._id === editingId
						? { ...draft, category, _id: editingId }
						: i,
				),
			);
		} else {
			const newItem: LineItem = { ...draft, category, _id: generateId() };
			onChange((prev) => [...prev, newItem]);
		}
		resetDraft();
	};

	const handleEdit = (id: string) => {
		const item = lineItems.find((i) => i._id === id);
		if (!item) return;
		setDraft({
			value: item.value,
			label: item.label,
			particular: item.particular,
			description: item.description ?? "",
			rate: item.rate,
			quantity: item.quantity,
			partNumber: item.partNumber ?? "",
		});
		setEditingId(id);
	};

	const handleDelete = (id: string) => {
		if (editingId === id) resetDraft();
		onChange((prev) => prev.filter((i) => (i as LineItem)._id !== id));
	};

	const handleCancel = () => resetDraft();

	const total = draft.rate * draft.quantity;

	// Derive SelectInput controlled values from draft each render
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
				{/* Table Header */}
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

				{/* Draft / Edit Row */}
				{!isViewer && (
					<div className="grid grid-cols-12 gap-3 mb-2 items-center">
						<div className="col-span-1 text-gray-500">
							{editingId
								? lineItems.findIndex((i) => i._id === editingId) + 1
								: lineItems.length + 1}
						</div>

						<div className="col-span-2">
							<SelectInput
								key={`partNumber-${editingId ?? "new"}`}
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
								key={`particular-${editingId ?? "new"}`}
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
									setDraft((prev) => ({ ...prev, description: e.target.value }))
								}
							/>
						</div>

						<div className="col-span-1">
							<FormInput
								type="number"
								name="rate"
								value={draft.rate}
								disabled
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

						<div className="col-span-1 text-right font-medium">
							<FormInput
								type="number"
								name="total"
								value={total.toFixed(2)}
								disabled
							/>
						</div>

						<div className="col-span-1 flex justify-center gap-2">
							<Button
								onClick={handleAdd}
								status="brand"
								size="sm"
								Icon={editingId ? Check : Plus}
								className="p-2 rounded-full"
							/>
							{/* {editingId && ( */}
							<Button
								onClick={handleCancel}
								status="outline"
								size="sm"
								Icon={RotateCcw}
								className="p-2 rounded-full"
							/>
							{/* )} */}
						</div>
					</div>
				)}

				{/* Existing Items */}
				<div className="space-y-2 overflow-y-auto py-1 max-h-[30vh] scrollbar-sleek">
					{lineItems.map((item, index) => (
						<div
							key={item._id}
							className={`grid grid-cols-12 py-3 px-2 rounded-lg text-sm items-center transition-colors ${
								editingId === item._id
									? "bg-orange-50 border border-orange-300"
									: "bg-gray-50"
							}`}
						>
							<div className="col-span-1">{index + 1}</div>
							<div className="col-span-2">
								{partNumbers.find((o) => o.label === item.partNumber)?.label ??
									item.partNumber}
							</div>
							<div className="col-span-2">
								{particularOptions.find((p) => p.value === item.particular)
									?.label ?? item.label}
							</div>
							<div className="col-span-2">{item.description}</div>
							<div className="col-span-1 text-right">
								{item.rate.toFixed(2)}
							</div>
							<div className="col-span-1 text-right">
								{item.quantity.toFixed(2)}
							</div>
							<div className="col-span-1 text-right font-medium">
								{(item.rate * item.quantity).toFixed(2)}
							</div>
							<div className="col-span-2 flex justify-center gap-3 text-gray-500">
								<Pencil
									size={16}
									className={`cursor-pointer hover:text-orange-500 ${editingId === item._id ? "text-orange-500" : ""}`}
									onClick={() => handleEdit(item._id)}
								/>
								<Trash2
									size={16}
									className="cursor-pointer hover:text-red-500"
									onClick={() => handleDelete(item._id)}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
