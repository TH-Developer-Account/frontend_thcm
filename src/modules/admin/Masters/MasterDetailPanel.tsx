import { useEffect, useState, type KeyboardEvent } from "react";
import { Database, Save, X } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";

import type { MasterItem, MasterName } from "./masterData.types";

interface MasterDetailPanelProps {
	masterName: MasterName;
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

	useEffect(() => {
		setForm(item ? { ...item } : null);
		setDirty(false);
	}, [item]);

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
		if (!form || readOnly || isSaving || !dirty) {
			return;
		}

		await onSave(form);
		setDirty(false);
	};

	const handleEnterSave = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== "Enter") return;

		event.preventDefault();
		void handleSave();
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

	const title =
		form.name?.trim() ||
		form.code?.trim() ||
		form.description?.trim() ||
		"Master record";

	const showName =
		masterName === "Branches" ||
		masterName === "Departments" ||
		masterName === "Regions" ||
		masterName === "Event Names";

	const showCode =
		masterName === "Branches" ||
		masterName === "Departments" ||
		masterName === "Regions" ||
		masterName === "Budget";

	const showBudgetFields = masterName === "Budget";

	return (
		<section
			className="master-detail-panel"
			aria-label={`${masterName} details`}
		>
			<header className="master-detail-header">
				<div className="master-detail-heading">
					<p className="master-detail-eyebrow">{masterName}</p>

					<h3 className="master-detail-title">{title}</h3>
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
				{showName && (
					<FormInput
						name="name"
						label="Name"
						value={form.name ?? ""}
						onChange={(event) => handleChange("name", event.target.value)}
						onKeyDown={handleEnterSave}
						disabled={readOnly || isSaving}
					/>
				)}

				{showCode && (
					<FormInput
						name="code"
						label="Code"
						value={form.code ?? ""}
						onChange={(event) => handleChange("code", event.target.value)}
						onKeyDown={handleEnterSave}
						disabled={readOnly || isSaving}
					/>
				)}

				{showBudgetFields && (
					<>
						<FormInput
							name="fiscalYear"
							label="Fiscal Year"
							value={form.fiscalYear ?? ""}
							placeholder="2026"
							onChange={(event) =>
								handleChange("fiscalYear", event.target.value)
							}
							onKeyDown={handleEnterSave}
							disabled={readOnly || isSaving}
						/>

						<FormInput
							name="description"
							label="Description"
							value={form.description ?? ""}
							onChange={(event) =>
								handleChange("description", event.target.value)
							}
							onKeyDown={handleEnterSave}
							disabled={readOnly || isSaving}
						/>

						<FormInput
							type="number"
							name="budgetAmount"
							label="Budget Amount"
							value={String(form.budgetAmount ?? "")}
							onChange={(event) =>
								handleChange("budgetAmount", event.target.value)
							}
							onKeyDown={handleEnterSave}
							disabled={readOnly || isSaving}
						/>
					</>
				)}
			</div>

			{!readOnly && (
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

					<Button
						type="button"
						size="sm"
						appearance="standard"
						variant="brand"
						Icon={Save}
						onClick={() => void handleSave()}
						disabled={!dirty || isSaving}
					>
						{isSaving ? "Saving..." : "Save changes"}
					</Button>
				</footer>
			)}
		</section>
	);
}
