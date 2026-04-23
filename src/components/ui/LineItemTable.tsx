import { Trash2, Pencil } from "lucide-react";
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

export default function LineItemTable({
	title,
	items,
	onChange,
	particularOptions,
	isViewer = false,
	category,
}: LineItemTableProps) {
	const [draft, setDraft] = useState<LineItemOption>({
		value: "",
		label: "",
		particular: "",
		description: "",
		rate: 0,
		quantity: 0,
	});

	const handleAdd = () => {
		if (!draft.particular) return;

		const newItem: LineItemOption = {
			...draft,
			category,
		};

		onChange((prev) => [...prev, newItem]); // ✅ FIXED

		setDraft({
			value: "",
			label: "",
			particular: "",
			description: "",
			rate: 0,
			quantity: 0,
		});
	};

	const handleDelete = (id: string) => {
		onChange((prev) => prev.filter((item) => item.value !== id));
	};

	const total = draft.rate * draft.quantity;

	const handleParticularChange = (opt: LineItemOption | null) => {
		if (!opt) return;

		setDraft({
			...draft,
			particular: opt.value,
			description: opt?.description,
			rate: opt.rate,
			quantity: opt.quantity ?? 1,
			value: opt.value,
			label: opt.label,
		});
	};

	const partNumbers = [
		{
			value: 1,
			label: "P00001",
		},
		{
			value: 2,
			label: "P00002",
		},
		{
			value: 3,
			label: "P00003",
		},
		{
			value: 4,
			label: "P00004",
		},
		{
			value: 5,
			label: "P00005",
		},
		{
			value: 6,
			label: "P00006",
		},
		{
			value: 7,
			label: "P00007",
		},
		{
			value: 8,
			label: "P00008",
		},
		{
			value: 9,
			label: "P00009",
		},
		{
			value: 10,
			label: "P000010",
		},
	];
	return (
		<div className="m-4 border border-gray-300 rounded-sm bg-white shadow-sm overflow-hidden">
			{/* Header */}
			<div className="bg-gray-200 px-6 py-2 border-b border-gray-300">
				<h3 className="font-semibold text-gray-800 text-md">{title}</h3>
			</div>

			<div className="p-3">
				{/* Table Header */}
				<div className="grid grid-cols-12 text-sm font-semibold text-gray-700 mb-2 ">
					<div className="col-span-1">SNo</div>
					<div className="col-span-2">Part No.</div>
					<div className="col-span-2">Particulars</div>
					<div className="col-span-2">Description</div>
					<div className="col-span-1 ">Rate</div>
					<div className="col-span-1 ">Qty</div>
					<div className="col-span-1 text-center">Total</div>
					<div className="col-span-2 text-center">Action</div>
				</div>

				{/* Draft Row */}
				{!isViewer && (
					<div className="grid grid-cols-12 gap-3 mb-2 items-center">
						<div className="col-span-1 text-gray-500">{items.length + 1}</div>
						<div className="col-span-2 text-gray-500">
							<SelectInput
								name="particular"
								options={partNumbers}
								value={"P00001"}
								onChange={handleParticularChange}
							/>
						</div>

						<div className="col-span-2">
							<SelectInput<LineItemOption>
								name="particular"
								label=""
								options={particularOptions}
								value={
									particularOptions.find((o) => o.value === draft.particular) ||
									null
								}
								onChange={handleParticularChange}
							/>
						</div>

						<div className="col-span-2">
							<FormInput
								name="description"
								value={draft.description as string}
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
									setDraft({
										...draft,
										quantity: Number(e.target.value),
									})
								}
							/>
						</div>

						<div className="col-span-1 text-right font-medium">
							<FormInput
								type="number"
								name="rate"
								value={total.toFixed(2)}
								disabled
							/>
						</div>

						<div className="col-span-2 flex justify-center">
							<Button text={"Add"} onClick={handleAdd} status="brand" />
						</div>
					</div>
				)}

				{/* Existing Items */}
				<div className="space-y-2 overflow-y-auto py-1 max-h-[30vh] scrollbar-sleek">
					{items.map((item, index) => (
						<div
							key={item.value}
							className="grid grid-cols-12 py-3 px-2 bg-gray-50 rounded-lg text-sm items-center"
						>
							<div className="col-span-1">{index + 1}</div>
							<div className="col-span-2">P0001</div>
							<div className="col-span-2">
								{
									particularOptions.find((p) => p.value === item.particular)
										?.label
								}
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
									className="cursor-pointer hover:text-orange-500"
								/>
								<Trash2
									size={16}
									className="cursor-pointer hover:text-red-500"
									onClick={() => handleDelete(item.value)}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
