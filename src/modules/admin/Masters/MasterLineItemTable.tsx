import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Check, Edit, Plus, RotateCcw, X } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import type { MasterItem, MasterName } from "./masterData.types";

interface MasterLineItemTableProps {
	title: MasterName;
	items: MasterItem[];

	onAdd: (item: MasterItem) => Promise<void> | void;
	onUpdate: (item: MasterItem) => Promise<void> | void;

	// Detail panel selection
	selectedId?: string;
	onSelect?: (item: MasterItem) => void;

	isSaving?: boolean;
	isViewer?: boolean;
}

type MasterField = Exclude<keyof MasterItem, "id">;

type MasterColumn = {
	key: MasterField;
	label: string;
	type?: "text" | "number";
	placeholder?: string;
	className?: string;
};

const EMPTY_DRAFT: MasterItem = {
	id: "",
	name: "",
	code: "",
	description: "",
	budgetAmount: "",
	fiscalYear: "",
};

const MASTER_COLUMNS: Record<MasterName, MasterColumn[]> = {
	Branches: [
		{
			key: "name",
			label: "Name",
			placeholder: "Branch name",
			className: "master-line-item-name-col",
		},
		{
			key: "code",
			label: "Code",
			placeholder: "Branch code",
			className: "master-line-item-code-col",
		},
	],
	Departments: [
		{
			key: "name",
			label: "Name",
			placeholder: "Department name",
			className: "master-line-item-name-col",
		},
		{
			key: "code",
			label: "Code",
			placeholder: "Department code",
			className: "master-line-item-code-col",
		},
	],
	Regions: [
		{
			key: "name",
			label: "Name",
			placeholder: "Region name",
			className: "master-line-item-name-col",
		},
		{
			key: "code",
			label: "Code",
			placeholder: "Region code",
			className: "master-line-item-code-col",
		},
	],
	"Event Names": [
		{
			key: "name",
			label: "Name",
			placeholder: "Event name",
			className: "master-line-item-name-col",
		},
	],
	Budget: [
		{
			key: "code",
			label: "Code",
			placeholder: "Budget code",
			className: "master-line-item-code-col",
		},
		{
			key: "fiscalYear",
			label: "Fiscal Year",
			placeholder: "2026",
			className: "master-line-item-year-col",
		},
		{
			key: "description",
			label: "Description",
			placeholder: "Description",
			className: "master-line-item-description-col",
		},
		{
			key: "budgetAmount",
			label: "Budget Amount",
			type: "number",
			placeholder: "Amount",
			className: "master-line-item-amount-col",
		},
	],
};

const trimItem = (item: MasterItem): MasterItem => ({
	...item,
	name: item.name?.trim(),
	code: item.code?.trim(),
	description: item.description?.trim(),
	fiscalYear: item.fiscalYear?.trim(),
});

const getDisplayValue = (item: MasterItem, field: MasterField) => {
	const value = item[field];
	return value === undefined || value === null || value === ""
		? "--"
		: String(value);
};

export function MasterLineItemTable({
	title,
	items,
	onAdd,
	onUpdate,
	selectedId,
	onSelect,
	isSaving = false,
	isViewer = false,
}: MasterLineItemTableProps) {
	const [draft, setDraft] = useState<MasterItem>({ ...EMPTY_DRAFT });
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editDraft, setEditDraft] = useState<MasterItem | null>(null);

	const columns = useMemo(() => MASTER_COLUMNS[title], [title]);

	useEffect(() => {
		setDraft({ ...EMPTY_DRAFT });
		setEditingId(null);
		setEditDraft(null);
	}, [title]);

	const hasDraftValue = columns.some((column) => {
		const value = draft[column.key];
		return value !== undefined && value !== null && String(value).trim() !== "";
	});

	const canAdd = hasDraftValue && !isSaving;

	const updateDraftField = (field: MasterField, value: string) =>
		setDraft((current) => ({ ...current, [field]: value }));

	const updateEditField = (field: MasterField, value: string) =>
		setEditDraft((current) =>
			current ? { ...current, [field]: value } : current,
		);

	const resetDraft = () => setDraft({ ...EMPTY_DRAFT });

	const handleAdd = async () => {
		if (!canAdd) return;
		await onAdd(trimItem(draft));
		resetDraft();
	};

	const handleEnterAdd = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== "Enter") return;
		event.preventDefault();
		void handleAdd();
	};

	const startEditing = (item: MasterItem) => {
		setEditingId(item.id);
		setEditDraft({ ...item });
	};

	const cancelEditing = () => {
		setEditingId(null);
		setEditDraft(null);
	};

	const handleUpdate = async () => {
		if (!editDraft || isSaving) return;
		await onUpdate(trimItem(editDraft));
		cancelEditing();
	};

	return (
		<section className="master-line-item-card">
			<div className="master-line-item-scroll scrollbar-sleek">
				<table className="master-line-item-table">
					<thead className="master-line-item-thead">
						<tr>
							<th className="master-line-item-index-col">Sl. No.</th>
							{columns.map((column) => (
								<th key={column.key} className={column.className}>
									{column.label}
								</th>
							))}
							{!isViewer && (
								<th className="master-line-item-action-col">Action</th>
							)}
						</tr>
					</thead>

					<tbody>
						{items.length === 0 ? (
							<tr>
								<td
									colSpan={1 + columns.length + (isViewer ? 0 : 1)}
									className="master-line-item-empty"
								>
									No items added yet.
								</td>
							</tr>
						) : (
							items.map((item, index) => {
								const isEditing = editingId === item.id && editDraft !== null;

								return (
									<tr
										key={item.id}
										onClick={() => {
											if (!isEditing) {
												onSelect?.(item);
											}
										}}
										className={`master-line-item-row ${
											isEditing
												? "master-line-item-row-active"
												: selectedId === item.id
													? "master-line-item-row-selected"
													: "master-line-item-row-default"
										}`}
									>
										<td className="master-line-item-index-cell">{index + 1}</td>

										{columns.map((column) => (
											<td
												key={column.key}
												className="master-line-item-data-cell"
											>
												{isEditing ? (
													<FormInput
														type={column.type ?? "text"}
														name={`${column.key}-${item.id}`}
														value={String(editDraft[column.key] ?? "")}
														placeholder={column.placeholder}
														disabled={isSaving}
														onChange={(event) =>
															updateEditField(column.key, event.target.value)
														}
													/>
												) : (
													getDisplayValue(item, column.key)
												)}
											</td>
										))}

										{!isViewer && (
											<td className="master-line-item-action-cell">
												{isEditing ? (
													<div className="flex items-center justify-end gap-1">
														<Button
															type="button"
															size="sm"
															appearance="icon"
															variant="outline"
															Icon={Check}
															aria-label="Save changes"
															disabled={isSaving}
															onClick={(event) => {
																event.stopPropagation();
																void handleUpdate();
															}}
														/>

														<Button
															type="button"
															size="sm"
															appearance="icon"
															variant="outline"
															Icon={X}
															aria-label="Cancel editing"
															disabled={isSaving}
															onClick={(event) => {
																event.stopPropagation();
																cancelEditing();
															}}
														/>
													</div>
												) : (
													<Button
														type="button"
														size="sm"
														appearance="icon"
														variant="outline"
														Icon={Edit}
														aria-label="Edit item"
														disabled={isSaving}
														onClick={(event) => {
															event.stopPropagation();
															startEditing(item);
														}}
													/>
												)}
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
						className={`master-line-item-add-grid ${
							title === "Budget"
								? "master-line-item-add-grid-budget"
								: "master-line-item-add-grid-default"
						}`}
					>
						<span className="master-line-item-next-index">
							{items.length + 1}
						</span>

						{columns.map((column) => (
							<div key={column.key} className="master-line-item-field">
								<FormInput
									type={column.type ?? "text"}
									name={`new-${column.key}`}
									value={String(draft[column.key] ?? "")}
									placeholder={column.placeholder}
									disabled={isSaving}
									onChange={(event) =>
										updateDraftField(column.key, event.target.value)
									}
									onKeyDown={handleEnterAdd}
								/>
							</div>
						))}

						<div className="master-line-item-add-action">
							<Button
								type="button"
								size="sm"
								appearance="icon"
								variant="outline"
								Icon={RotateCcw}
								aria-label="Reset"
								disabled={isSaving}
								onClick={resetDraft}
							/>
							<Button
								type="button"
								size="sm"
								appearance="standard"
								variant="brand"
								Icon={Plus}
								disabled={!canAdd}
								onClick={() => void handleAdd()}
							>
								{isSaving ? "Saving..." : "Add"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
