import { useState, type KeyboardEvent } from "react";
import { Edit, Trash } from "lucide-react";

import Button from "../common/Button";
import FormInput from "../forms/FormInput";

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

	const [dirty, setDirty] = useState(false);

	const isBudget = title === "Budget";
	const canAdd = dirty && Boolean(draft.label?.trim());

	const resetDraft = () => {
		setDraft({
			id: "",
			label: "",
			code: "",
			description: "",
			budgetAmount: "",
		});
		setDirty(false);
	};

	const handleDraftChange = (field: keyof MasterItem, value: string) => {
		setDraft((previous) => ({
			...previous,
			[field]: value,
		}));
		setDirty(true);
	};

	const handleAdd = () => {
		if (!canAdd) return;

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
		resetDraft();
	};

	const handleDelete = (id: string) => {
		onChange(items.filter((item) => item.id !== id));
	};

	const handleEnterAdd = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleAdd();
		}
	};

	const emptyColSpan = isBudget ? (isViewer ? 4 : 6) : isViewer ? 3 : 5;

	return (
		<div className="master-line-item-card">
			<div className="master-line-item-header">
				<h3 className="master-line-item-title">{title}</h3>
			</div>

			<div className="master-line-item-scroll scrollbar-sleek">
				<table className="master-line-item-table">
					<thead className="master-line-item-thead">
						<tr>
							<th className="master-line-item-index-col">#</th>

							<th className="master-line-item-name-col">
								{isBudget ? "Budget Code" : nameLabel}
							</th>

							{isBudget ? (
								<>
									<th className="master-line-item-description-col">
										Description
									</th>
									<th className="master-line-item-amount-col">Amount</th>
								</>
							) : (
								<th className="master-line-item-code-col">Code</th>
							)}

							{!isViewer && (
								<>
									<th className="master-line-item-action-col">Edit</th>
									<th className="master-line-item-action-col">Delete</th>
								</>
							)}
						</tr>
					</thead>

					<tbody>
						{items.length === 0 ? (
							<tr>
								<td colSpan={emptyColSpan} className="master-line-item-empty">
									No items added yet.
								</td>
							</tr>
						) : (
							items.map((item, index) => {
								const isSelected = selectedId === item.id;

								return (
									<tr
										key={item.id}
										onClick={() => onSelect?.(item)}
										className={[
											"master-line-item-row",
											isSelected
												? "master-line-item-row-selected"
												: "master-line-item-row-default",
										].join(" ")}
									>
										<td className="master-line-item-index-cell">{index + 1}</td>

										<td
											className="master-line-item-primary-cell"
											title={item.label || "--"}
										>
											{item.label ? item.label : "--"}
										</td>

										{isBudget ? (
											<>
												<td
													className="master-line-item-description-cell"
													title={item.description || "--"}
												>
													{item.description ? item.description : "--"}
												</td>

												<td className="master-line-item-amount-cell">
													{item.budgetAmount !== undefined &&
													item.budgetAmount !== null
														? Number(item.budgetAmount).toLocaleString("en-IN")
														: "--"}
												</td>
											</>
										) : (
											<td
												className="master-line-item-code-cell"
												title={item.code || "--"}
											>
												{item.code ? item.code : "--"}
											</td>
										)}

										{!isViewer && (
											<td className="master-line-item-action-cell">
												<Button
													type="button"
													size="sm"
													appearance="icon"
													variant="outline"
													Icon={Edit}
													aria-label={`Edit ${item.label || "item"}`}
													onClick={(event) => {
														event.stopPropagation();
														onSelect?.(item);
													}}
												/>
											</td>
										)}

										{!isViewer && (
											<td className="master-line-item-action-cell">
												<Button
													type="button"
													size="sm"
													appearance="icon"
													variant="outline"
													Icon={Trash}
													aria-label={`Delete ${item.label || "item"}`}
													onClick={(event) => {
														event.stopPropagation();
														handleDelete(item.id);
													}}
												/>
											</td>
										)}
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{!isViewer && (
				<div className="master-line-item-add-row">
					<div
						className={
							isBudget
								? "master-line-item-add-grid master-line-item-add-grid-budget"
								: "master-line-item-add-grid master-line-item-add-grid-default"
						}
					>
						<span className="master-line-item-next-index">
							{items.length + 1}
						</span>

						<div className="master-line-item-field">
							<FormInput
								name="label"
								value={draft.label ?? ""}
								onChange={(event) =>
									handleDraftChange("label", event.target.value)
								}
								onKeyDown={handleEnterAdd}
								placeholder={isBudget ? "Budget Code" : "Name"}
							/>
						</div>

						{isBudget ? (
							<>
								<div className="master-line-item-field">
									<FormInput
										name="description"
										value={draft.description ?? ""}
										onChange={(event) =>
											handleDraftChange("description", event.target.value)
										}
										onKeyDown={handleEnterAdd}
										placeholder="Description"
									/>
								</div>

								<div className="master-line-item-field">
									<FormInput
										name="budgetAmount"
										value={String(draft.budgetAmount ?? "")}
										onChange={(event) =>
											handleDraftChange("budgetAmount", event.target.value)
										}
										onKeyDown={handleEnterAdd}
										placeholder="Amount"
									/>
								</div>
							</>
						) : (
							<div className="master-line-item-field">
								<FormInput
									name="code"
									value={draft.code ?? ""}
									onChange={(event) =>
										handleDraftChange("code", event.target.value)
									}
									onKeyDown={handleEnterAdd}
									placeholder="Code"
								/>
							</div>
						)}

						<div className="master-line-item-add-action">
							<Button
								type="button"
								size="sm"
								appearance="standard"
								variant="brand"
								onClick={handleAdd}
								disabled={!canAdd}
							>
								Add
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
