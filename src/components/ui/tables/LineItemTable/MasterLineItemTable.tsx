import { useEffect, useState, type KeyboardEvent } from "react";
import { Check, Edit, X } from "lucide-react";

import Button from "../../../common/Button";
import FormInput from "../../../forms/FormInput";
import type {
	MasterItem,
	MasterStatus,
} from "../../../../modules/admin/Masters/masterData.types";

interface MasterLineItemTableProps {
	title: string;
	items: MasterItem[];

	onAdd: (item: MasterItem) => Promise<void> | void;
	onUpdate: (item: MasterItem) => Promise<void> | void;

	isSaving?: boolean;
	isViewer?: boolean;
}

const EMPTY_DRAFT: MasterItem = {
	id: "",
	description: "",
	status: "active",
};

export function MasterLineItemTable({
	title,
	items,
	onAdd,
	onUpdate,
	isSaving = false,
	isViewer = false,
}: MasterLineItemTableProps) {
	const [draft, setDraft] = useState<MasterItem>(EMPTY_DRAFT);

	const [editingId, setEditingId] = useState<string | null>(null);

	const [editDraft, setEditDraft] = useState<MasterItem | null>(null);

	useEffect(() => {
		setDraft(EMPTY_DRAFT);
		setEditingId(null);
		setEditDraft(null);
	}, [title]);

	const canAdd = Boolean(draft.description.trim()) && !isSaving;

	const handleAdd = async () => {
		if (!canAdd) return;

		await onAdd({
			...draft,
			description: draft.description.trim(),
		});

		setDraft(EMPTY_DRAFT);
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
		if (!editDraft || !editDraft.description.trim() || isSaving) {
			return;
		}

		await onUpdate({
			...editDraft,
			description: editDraft.description.trim(),
		});

		cancelEditing();
	};

	const updateStatus = (status: MasterStatus, target: "draft" | "edit") => {
		if (target === "draft") {
			setDraft((current) => ({
				...current,
				status,
			}));

			return;
		}

		setEditDraft((current) =>
			current
				? {
						...current,
						status,
					}
				: current,
		);
	};

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

							<th className="master-line-item-description-col">Description</th>

							<th className="master-line-item-status-col">Status</th>

							{!isViewer && (
								<th className="master-line-item-action-col">Action</th>
							)}
						</tr>
					</thead>

					<tbody>
						{items.length === 0 ? (
							<tr>
								<td
									colSpan={isViewer ? 3 : 4}
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
										className="master-line-item-row master-line-item-row-default"
									>
										<td className="master-line-item-index-cell">{index + 1}</td>

										<td className="master-line-item-description-cell">
											{isEditing ? (
												<FormInput
													name={`description-${item.id}`}
													value={editDraft.description}
													onChange={(event) =>
														setEditDraft((current) =>
															current
																? {
																		...current,
																		description: event.target.value,
																	}
																: current,
														)
													}
												/>
											) : (
												item.description || "--"
											)}
										</td>

										<td className="master-line-item-status-cell">
											{isEditing ? (
												<select
													value={editDraft.status}
													onChange={(event) =>
														updateStatus(
															event.target.value as MasterStatus,
															"edit",
														)
													}
													className="form-input"
												>
													<option value="active">Active</option>

													<option value="inactive">Inactive</option>
												</select>
											) : (
												<span
													className={
														item.status === "active"
															? "master-status master-status-active"
															: "master-status master-status-inactive"
													}
												>
													{item.status === "active" ? "Active" : "Inactive"}
												</span>
											)}
										</td>

										{!isViewer && (
											<td className="master-line-item-action-cell">
												{isEditing ? (
													<div className="flex items-center gap-1">
														<Button
															type="button"
															size="sm"
															appearance="icon"
															variant="outline"
															Icon={Check}
															aria-label="Save changes"
															disabled={
																isSaving || !editDraft.description.trim()
															}
															onClick={() => void handleUpdate()}
														/>

														<Button
															type="button"
															size="sm"
															appearance="icon"
															variant="outline"
															Icon={X}
															aria-label="Cancel editing"
															disabled={isSaving}
															onClick={cancelEditing}
														/>
													</div>
												) : (
													<Button
														type="button"
														size="sm"
														appearance="icon"
														variant="outline"
														Icon={Edit}
														aria-label={`Edit ${item.description || "item"}`}
														onClick={() => startEditing(item)}
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
					<div className="master-line-item-add-grid master-line-item-add-grid-simple">
						<span className="master-line-item-next-index">
							{items.length + 1}
						</span>

						<div className="master-line-item-field">
							<FormInput
								name="description"
								value={draft.description}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										description: event.target.value,
									}))
								}
								onKeyDown={handleEnterAdd}
								placeholder="Description"
								disabled={isSaving}
							/>
						</div>

						<div className="master-line-item-field">
							<select
								value={draft.status}
								onChange={(event) =>
									updateStatus(event.target.value as MasterStatus, "draft")
								}
								className="form-input"
								disabled={isSaving}
							>
								<option value="active">Active</option>

								<option value="inactive">Inactive</option>
							</select>
						</div>

						<div className="master-line-item-add-action">
							<Button
								type="button"
								size="sm"
								appearance="standard"
								variant="brand"
								onClick={() => void handleAdd()}
								disabled={!canAdd}
							>
								{isSaving ? "Saving..." : "Add"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
