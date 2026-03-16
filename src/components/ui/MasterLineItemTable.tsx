import { useState } from "react";
import Button from "../common/Button";
import { Edit, Trash } from "lucide-react";
import FormInput from "../FormElements/FormInput";

export interface MasterItem {
	id: string;
	code?: string;
	label: string;
}

interface MasterLineItemTableProps {
	title: string;
	nameLabel?: string;
	items: MasterItem[];
	selectedId?: string | null;
	onChange: (items: MasterItem[]) => void;
	onSelect?: (item: MasterItem) => void;
	isViewer?: boolean;
}

export function MasterLineItemTable({
	title,
	nameLabel = "Name",
	items,
	selectedId,
	onChange,
	onSelect,
	isViewer = false,
}: MasterLineItemTableProps) {
	const [draft, setDraft] = useState({ id: "", label: "" });

	const handleAdd = () => {
		if (!draft.label.trim()) return;
		onChange([...items, { ...draft, id: crypto.randomUUID() }]);
		setDraft({ id: "", label: "" });
	};

	const handleDelete = (id: string) => {
		onChange(items.filter((item) => item.id !== id));
	};

	return (
		<div className="flex flex-col h-full overflow-hidden bg-white border border-gray-200 rounded-lg">
			{/* Header */}
			<div className="px-4 py-3 border-b bg-gray-50 shrink-0">
				<h3 className="font-semibold text-sm text-gray-700">{title}</h3>
			</div>

			{/* Scrollable table */}
			<div className="flex-1 overflow-y-auto">
				<table className="w-full text-sm">
					<thead className="bg-gray-50 sticky top-0 font-medium text-gray-600">
						<tr>
							<th className="px-4 py-2.5 w-10">SNo.</th>
							<th className="px-4 py-2.5 text-left">{nameLabel}</th>
							<th className="px-4 py-2.5 text-left">{nameLabel}</th>
							{!isViewer && (
								<th className="px-4 py-2.5 w-10 text-right">Edit</th>
							)}
							{!isViewer && (
								<th className="px-4 py-2.5 w-10 text-right">Delete</th>
							)}
						</tr>
					</thead>

					<tbody>
						{items.map((item, index) => {
							const isSelected = selectedId === item.id;

							return (
								<tr
									key={item.id}
									onClick={() => onSelect?.(item)}
									className={`border-t border-gray-100 cursor-pointer text-left
              ${
								isSelected
									? "bg-orange-50 border-l-2 border-l-orange-400"
									: "hover:bg-gray-50 border-l-2 border-l-transparent"
							}`}
								>
									<td className="px-4 py-3 text-xs text-gray-400">
										{index + 1}
									</td>

									<td className="px-4 py-3 text-sm font-medium text-gray-700">
										{item.label}
									</td>

									<td className="px-4 py-3 text-sm font-medium text-gray-700">
										{item.code ?? "EXM"}
									</td>

									{!isViewer && (
										<td className="px-4 py-3 text-right">
											<button
												onClick={(e) => {
													e.stopPropagation();
													onSelect?.(item);
												}}
												className="p-1 rounded text-gray-300 hover:text-orange-500 cursor-pointer"
											>
												<Edit size={13} />
											</button>
										</td>
									)}

									{!isViewer && (
										<td className="px-4 py-3 text-right">
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDelete(item.id);
												}}
												className="p-1 rounded text-gray-300 hover:text-red-500 cursor-pointer"
											>
												<Trash size={13} />
											</button>
										</td>
									)}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Fixed Add Row */}
			{!isViewer && (
				<div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between gap-3">
					<span className="text-xs text-gray-400 w-6 mb-2">
						{items.length + 1}
					</span>

					<div className="flex-1">
						<FormInput
							name="name"
							value={draft.label}
							onChange={(e) => setDraft({ ...draft, label: e.target.value })}
							onKeyDown={(e: React.KeyboardEvent) =>
								e.key === "Enter" && handleAdd()
							}
							placeholder={"Name"}
						/>
					</div>

					<div className="flex-1">
						<FormInput
							name="code"
							// value={draft.code ?? ""}
							// onChange={(e) => setDraft({ ...draft, code: e.target.value })}
							placeholder={"Code"}
						/>
					</div>
					<div className="mb-2">
						<Button size="sm" status="brand" onClick={handleAdd}>
							Add
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
