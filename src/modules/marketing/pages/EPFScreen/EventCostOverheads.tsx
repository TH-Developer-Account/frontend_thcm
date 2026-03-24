import { Trash2, Pencil } from "lucide-react";
import FormInput from "../../../../components/FormElements/FormInput";
import SelectInput from "../../../../components/FormElements/SelectInput";
import type { LineItem } from "../../types";

interface Props {
	title: string;
	items: LineItem[];
	draft: LineItem;
	particularOptions: { label: string; value: string }[];
	isViewer?: boolean;

	onDraftChange: (name: keyof LineItem, value: string | number) => void;
	onAdd: () => void;
	onDelete: (id: string) => void;
}

const EventCostOverheads = ({
	title,
	items,
	draft,
	particularOptions,
	onDraftChange,
	onAdd,
	onDelete,
	isViewer = false,
}: Props) => {
	const total = draft.rate * draft.quantity;

	return (
		<div className="mt-4 border border-gray-300 rounded-xs bg-white shadow-sm overflow-hidden">
			<div className="bg-gray-200 px-3 py-2 border-b border-gray-300 flex gap-2 items-center">
				<Pencil size={20} color="gray" />
				<h3 className="font-semibold text-gray-600 md:text-sm text-xs text-left">
					{title}
				</h3>
			</div>
			<div className="py-4 px-2">
				{/* Header */}
				<div className="grid grid-cols-12 text-sm font-medium text-gray-800 mb-3 items-center">
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
					<div className="grid grid-cols-12 gap-3 mb-3 items-center">
						<div className="col-span-1">{items.length + 1}</div>

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
									onDraftChange("particular", opt?.value || "")
								}
							/>
						</div>

						<div className="col-span-3">
							<FormInput
								name="description"
								label=""
								value={draft.description}
								onChange={(e) => onDraftChange("description", e.target.value)}
							/>
						</div>

						<div className="col-span-1">
							<FormInput
								type="number"
								name="rate"
								label=""
								value={draft.rate}
								onChange={(e) => onDraftChange("rate", Number(e.target.value))}
							/>
						</div>

						<div className="col-span-1">
							<FormInput
								type="number"
								name="quantity"
								label=""
								value={draft.quantity}
								onChange={(e) =>
									onDraftChange("quantity", Number(e.target.value))
								}
							/>
						</div>

						<div className="col-span-1 text-right font-medium">
							{total.toFixed(2)}
						</div>

						<div className="col-span-2 flex justify-center">
							<button
								type="button"
								onClick={onAdd}
								className="px-3 py-2 bg-orange-500 text-white rounded-lg"
							>
								Add
							</button>
						</div>
					</div>
				)}

				{/* Items */}
				<div className="space-y-2">
					{items.map((item, index) => (
						<div
							key={item.id}
							className="grid grid-cols-12 py-3 px-2 bg-gray-50 rounded-lg"
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
							<div className="col-span-2 flex justify-center gap-3">
								<Pencil size={16} />
								<Trash2 size={16} onClick={() => onDelete(item.id)} />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default EventCostOverheads;
