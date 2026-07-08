import { useState, type KeyboardEvent } from "react";
import { X, Save, Database } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import { type MasterItem } from "../../../components/ui/tables/LineItemTable/MasterLineItemTable";

interface MasterDetailPanelProps {
	masterName: string;
	item: MasterItem | null;
	onSave: (updated: MasterItem) => void;
	onClose: () => void;
}

export function MasterDetailPanel({
	masterName,
	item,
	onSave,
	onClose,
}: MasterDetailPanelProps) {
	const [form, setForm] = useState<MasterItem | null>(
		item ? { ...item } : null,
	);
	const [dirty, setDirty] = useState(false);

	const handleChange = (field: keyof MasterItem, value: string) => {
		if (!form) return;
		setForm({ ...form, [field]: value });
		setDirty(true);
	};

	const handleSave = () => {
		if (!form || !form.label.trim()) return;
		onSave(form);
		console.log(form, "form");
		setDirty(false);
	};

	const handleEnterSave = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleSave();
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
				/>

				{masterName !== "Budget" && masterName !== "Event Names" && (
					<FormInput
						name="code"
						label={`${masterName.replace(/s$/, "")} Code`}
						value={form.code ?? ""}
						onChange={(event) => handleChange("code", event.target.value)}
						onKeyDown={handleEnterSave}
					/>
				)}

				<FormInput
					name="description"
					label={masterName === "Budget" ? "Budget Description" : "Description"}
					value={form.description ?? ""}
					onChange={(event) => handleChange("description", event.target.value)}
				/>

				{masterName === "Budget" && (
					<FormInput
						name="budgetAmount"
						label="Budget Amount"
						value={String(form.budgetAmount ?? "")}
						onChange={(event) =>
							handleChange("budgetAmount", event.target.value)
						}
					/>
				)}

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
			</div>

			<footer className="master-detail-footer">
				<Button
					type="button"
					size="sm"
					appearance="ghost"
					variant="secondary"
					onClick={onClose}
				>
					Cancel
				</Button>

				<Button
					type="button"
					size="sm"
					appearance="standard"
					variant="brand"
					Icon={Save}
					onClick={handleSave}
					disabled={!dirty}
				>
					Save changes
				</Button>
			</footer>
		</section>
	);
}
