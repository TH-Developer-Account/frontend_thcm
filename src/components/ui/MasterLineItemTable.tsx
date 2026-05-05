import { useState } from "react";
import Button from "../common/Button";
import { Edit, Trash } from "lucide-react";
import FormInput from "../FormElements/FormInput";

export type MasterItem = {
	id: string;
	label: string;
	code?: string;
	description?: string;
	budgetAmount?: number | string;
	status?: string;
};

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
	const [draft, setDraft] = useState<MasterItem>({
		id: "",
		label: "",
		code: "",
		description: "",
		budgetAmount: "",
	});

	const handleAdd = () => {
		if (!draft.label?.trim()) return;

		const newItem: MasterItem = isBudget
			? {
					id: crypto.randomUUID(),
					label: draft.label.trim(),
					description: draft.description?.trim() ?? "",
					budgetAmount: Number(draft.budgetAmount ?? 0),
				}
			: {
					id: crypto.randomUUID(),
					label: draft.label.trim(),
					code: draft.code?.trim() ?? "",
				};

		onChange([...items, newItem]);

		setDraft({
			id: "",
			label: "",
			code: "",
			description: "",
			budgetAmount: "",
		});
	};

	const handleDelete = (id: any) => {
		onChange(items.filter((item) => item.id !== id));
	};
	const isBudget = title === "Budget";
	return (
		<div className="flex flex-col h-full overflow-hidden bg-white border border-gray-200 rounded-lg">
			{/* Header */}
			<div className="px-4 py-3 border-b bg-gray-50 shrink-0">
				<h3 className="font-semibold text-sm text-gray-700">{title}</h3>
			</div>

			{/* Scrollable table */}
			<div className="flex-1 overflow-y-auto scrollbar-sleek">
				<table className="w-full text-sm">
					<thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
						<tr>
							<th className="px-4 py-3 text-left font-medium w-auto">#</th>

							<th className="px-4 py-3 text-left font-medium">
								{isBudget ? "Budget Code" : nameLabel}
							</th>

							{isBudget ? (
								<>
									<th className="px-4 py-3 text-left font-medium">
										Description
									</th>
									<th className="px-4 py-3 text-right font-medium">Amount</th>
								</>
							) : (
								<th className="px-4 py-3 text-left font-medium">Code</th>
							)}

							{!isViewer && (
								<>
									<th className="px-4 py-3 text-right font-medium">Edit</th>
									<th className="px-4 py-3 text-right font-medium">Delete</th>
								</>
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

									{/* Normal: Name | Budget: Budget Code */}
									<td className="px-4 py-3 text-sm font-medium text-gray-700">
										{item.label ? item.label : "--"}
									</td>

									{isBudget ? (
										<>
											{/* Budget Description */}
											<td className="px-4 py-3 text-sm text-gray-600">
												{item.description ? item.description : "--"}
											</td>

											{/* Budget Amount */}
											<td className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
												{item.budgetAmount !== undefined &&
												item.budgetAmount !== null
													? Number(item.budgetAmount).toLocaleString("en-IN")
													: "--"}
											</td>
										</>
									) : (
										<>
											{/* Normal Code */}
											<td className="px-4 py-3 text-sm font-medium text-gray-700">
												{item.code ? item.code : "--"}
											</td>
										</>
									)}

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

					{/* Normal: Name | Budget: Budget Code */}
					<div className="flex-1">
						<FormInput
							name="label"
							value={draft.label ?? ""}
							onChange={(e) =>
								setDraft({
									...draft,
									label: e.target.value,
								})
							}
							onKeyDown={(e: React.KeyboardEvent) =>
								e.key === "Enter" && handleAdd()
							}
							placeholder={isBudget ? "Budget Code" : "Name"}
						/>
					</div>

					{isBudget ? (
						<>
							{/* Budget Description */}
							<div className="flex-1">
								<FormInput
									name="description"
									value={draft.description ?? ""}
									onChange={(e) =>
										setDraft({
											...draft,
											description: e.target.value,
										})
									}
									placeholder="Description"
								/>
							</div>

							{/* Budget Amount */}
							<div className="flex-1">
								<FormInput
									name="budgetAmount"
									value={String(draft.budgetAmount ?? "")}
									onChange={(e) =>
										setDraft({
											...draft,
											budgetAmount: e.target.value,
										})
									}
									onKeyDown={(e: React.KeyboardEvent) =>
										e.key === "Enter" && handleAdd()
									}
									placeholder="Amount"
								/>
							</div>
						</>
					) : (
						<div className="flex-1">
							<FormInput
								name="code"
								value={draft.code ?? ""}
								onChange={(e) =>
									setDraft({
										...draft,
										code: e.target.value,
									})
								}
								onKeyDown={(e: React.KeyboardEvent) =>
									e.key === "Enter" && handleAdd()
								}
								placeholder="Code"
							/>
						</div>
					)}

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
