import { Trash2, Pencil } from "lucide-react";
import SelectInput from "../FormElements/SelectInput";
import FormInput from "../FormElements/FormInput";
import { useState } from "react";

export interface LineItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

interface LineItemTableProps {
	title: string;
	items: LineItem[];
	onChange: (items: LineItem[]) => void;
	particularOptions: { label: string; value: string }[];
	isViewer?: boolean;
}

export default function LineItemTable({
	title,
	items,
	onChange,
	particularOptions,
	isViewer = false,
}: LineItemTableProps) {
	const [draft, setDraft] = useState<LineItem>({
		id: "",
		particular: "",
		description: "",
		rate: 0,
		quantity: 0,
	});

	const handleAdd = () => {
		if (!draft.particular) return;

		const updated = [
			...items,
			{
				...draft,
				id: crypto.randomUUID(),
			},
		];

		onChange(updated);

		setDraft({
			id: "",
			particular: "",
			description: "",
			rate: 0,
			quantity: 0,
		});
	};

	const handleDelete = (id: string) => {
		onChange(items.filter((item) => item.id !== id));
	};

	const total = draft.rate * draft.quantity;

	return (
		<div className="mt-6 border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
			{/* Header */}
			<div className="bg-gray-100 px-6 py-3 border-b border-gray-300">
				<h3 className="font-semibold text-gray-600 text-lg">{title}</h3>
			</div>

			<div className="p-6">
				{/* Table Header */}
				<div className="grid grid-cols-12 text-sm font-medium text-gray-600 mb-3">
					<div className="col-span-1">SNo</div>
					<div className="col-span-3">Particulars</div>
					<div className="col-span-3">Description</div>
					<div className="col-span-1 text-right">Rate</div>
					<div className="col-span-1 text-right">Qty</div>
					<div className="col-span-1 text-right">Total</div>
					<div className="col-span-2 text-center">Action</div>
				</div>

				{/* Draft Row */}
				{!isViewer && (
					<div className="grid grid-cols-12 gap-3 mb-6 items-center">
						<div className="col-span-1 text-gray-500">{items.length + 1}</div>

						<div className="col-span-3">
							<SelectInput
								name="particular"
								label=""
								options={particularOptions}
								value={
									particularOptions.find((o) => o.value === draft.particular) ||
									null
								}
								onChange={(opt) =>
									setDraft({
										...draft,
										particular: opt?.value || "",
									})
								}
							/>
						</div>

						<div className="col-span-3">
							<FormInput
								name="description"
								label=""
								value={draft.description}
								onChange={(e) =>
									setDraft({
										...draft,
										description: e.target.value,
									})
								}
							/>
						</div>

						<div className="col-span-1">
							<FormInput
								type="number"
								name="rate"
								label=""
								value={draft.rate}
								onChange={(e) =>
									setDraft({
										...draft,
										rate: Number(e.target.value),
									})
								}
							/>
						</div>

						<div className="col-span-1">
							<FormInput
								type="number"
								name="quantity"
								label=""
								value={draft.quantity}
								onChange={(e) =>
									setDraft({
										...draft,
										quantity: Number(e.target.value),
									})
								}
							/>
						</div>

						<div className="col-span-1 text-right font-medium">
							{total.toFixed(2)}
						</div>

						<div className="col-span-2 flex justify-center">
							<button
								type="button"
								onClick={handleAdd}
								className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
							>
								Add
							</button>
						</div>
					</div>
				)}

				{/* Existing Items */}
				<div className="space-y-2">
					{items.map((item, index) => (
						<div
							key={item.id}
							className="grid grid-cols-12 py-3 px-2 bg-gray-50 rounded-lg text-sm items-center"
						>
							<div className="col-span-1">{index + 1}</div>
							<div className="col-span-3">
								{
									particularOptions.find((p) => p.value === item.particular)
										?.label
								}
							</div>
							<div className="col-span-3">{item.description}</div>
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
									className="cursor-pointer hover:text-orange-500"
								/>
								<Trash2
									size={16}
									className="cursor-pointer hover:text-red-500"
									onClick={() => handleDelete(item.id)}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
