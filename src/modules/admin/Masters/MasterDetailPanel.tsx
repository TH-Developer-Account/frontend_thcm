import { useState, type KeyboardEvent } from "react";
import { Database, Save, X } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { type MasterItem } from "../../../components/ui/tables/LineItemTable/MasterLineItemTable";

interface MasterDetailPanelProps {
	masterName: string;
	item: MasterItem | null;
	onSave: (updated: MasterItem) => Promise<void> | void;
	onClose: () => void;
	isSaving?: boolean;
	readOnly?: boolean;
}

export function MasterDetailPanel({
	masterName,
	item,
	onSave,
	onClose,
	isSaving = false,
	readOnly = false,
}: MasterDetailPanelProps) {
	const [form, setForm] = useState<MasterItem | null>(
		item ? { ...item } : null,
	);

	const [dirty, setDirty] = useState(false);

	const handleChange = (field: keyof MasterItem, value: string) => {
		if (!form || readOnly) return;

		setForm((current) =>
			current
				? {
						...current,
						[field]: value,
					}
				: current,
		);

		setDirty(true);
	};

	const handleSave = async () => {
		if (!form || !form.label.trim() || readOnly || isSaving) {
			return;
		}

		await onSave(form);

		setDirty(false);
	};

	const handleEnterSave = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			void handleSave();
		}
	};

	if (!item || !form) {
		return (
			<div className="master-detail-empty">
				<div className="master-detail-empty-icon" aria-hidden="true">
					<Database size={18} />
				</div>

				<p className="master-detail-empty-title">Select a record</p>

				<p className="master-detail-empty-text">
					Click any row to view or edit it here
				</p>
			</div>
		);
	}

	return (
		<section
			className="master-detail-panel"
			aria-label={`${masterName} details`}
		>
			<header className="master-detail-header">
				<div className="master-detail-heading">
					<p className="master-detail-eyebrow">{masterName}</p>

					<h3 className="master-detail-title">{form.label || "New"}</h3>
				</div>

				<Button
					type="button"
					size="sm"
					appearance="icon"
					variant="secondary"
					Icon={X}
					aria-label="Close details panel"
					onClick={onClose}
				/>
			</header>

			<div className="master-detail-body scrollbar-sleek">
				<FormInput
					name="label"
					label={
						masterName === "Budget"
							? "Budget Code"
							: `${masterName.replace(/s$/, "")} Name`
					}
					value={form.label}
					onChange={(event) => handleChange("label", event.target.value)}
					onKeyDown={handleEnterSave}
					disabled={readOnly}
				/>

				{masterName !== "Budget" && masterName !== "Event Names" && (
					<FormInput
						name="code"
						label={`${masterName.replace(/s$/, "")} Code`}
						value={form.code ?? ""}
						onChange={(event) => handleChange("code", event.target.value)}
						onKeyDown={handleEnterSave}
						disabled={readOnly}
					/>
				)}

				<FormInput
					name="description"
					label={masterName === "Budget" ? "Budget Description" : "Description"}
					value={form.description ?? ""}
					onChange={(event) => handleChange("description", event.target.value)}
					disabled={readOnly}
				/>

				{masterName === "Budget" && (
					<FormInput
						name="budgetAmount"
						label="Budget Amount"
						value={String(form.budgetAmount ?? "")}
						onChange={(event) =>
							handleChange("budgetAmount", event.target.value)
						}
						disabled={readOnly}
					/>
				)}

				{!readOnly && (
					<div className="master-detail-status-row">
						<p className="master-detail-status-label">Status</p>

						<div className="master-detail-status-group">
							{["Active", "Inactive"].map((status) => {
								const current = form.status ?? "Active";

								const isSelected = current === status;

								return (
									<Button
										key={status}
										type="button"
										size="sm"
										appearance="toggle"
										variant="secondary"
										active={isSelected}
										className={
											status === "Active"
												? "master-detail-status-button master-detail-status-button-active"
												: "master-detail-status-button master-detail-status-button-inactive"
										}
										onClick={() => handleChange("status", status)}
									>
										{status}
									</Button>
								);
							})}
						</div>
					</div>
				)}
			</div>

			<footer className="master-detail-footer">
				<Button
					type="button"
					size="sm"
					appearance="ghost"
					variant="secondary"
					onClick={onClose}
					disabled={isSaving}
				>
					Cancel
				</Button>

				{/* DELETE
				<Button
					type="button"
					size="sm"
					appearance="standard"
					variant="danger"
					onClick={handleDelete}
				>
					Delete
				</Button>
				*/}

				{!readOnly && (
					<Button
						type="button"
						size="sm"
						appearance="standard"
						variant="brand"
						Icon={Save}
						onClick={() => void handleSave()}
						disabled={!dirty || isSaving || !form.label.trim()}
					>
						{isSaving ? "Saving..." : "Save changes"}
					</Button>
				)}
			</footer>
		</section>
	);
}
