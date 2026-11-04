import { useState, type FormEvent } from "react";

import FormInput from "../../../components/forms/FormInput";

import {
	emptyFormValues,
	rowToFormValues,
	validateForm,
	type FieldName,
	type MasterDef,
} from "./masters.config";
import type { MasterFormValues, MasterRow } from "./masters.types";

type MasterFormProps = {
	def: MasterDef;
	/** null = creating a new record. */
	row: MasterRow | null;
	isSaving: boolean;
	onSave: (values: MasterFormValues) => Promise<void>;
	/** Mobile: back to the list. Desktop: clears the selection. */
	onClose: () => void;
};

/**
 * Detail + edit form for one record. The parent gives it a `key` so
 * switching records resets the draft.
 */
export const MasterForm = ({
	def,
	row,
	isSaving,
	onSave,
	onClose,
}: MasterFormProps) => {
	const [values, setValues] = useState<MasterFormValues>(() =>
		row ? rowToFormValues(row) : emptyFormValues(),
	);
	const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

	const isNew = row === null;

	const setField = (name: FieldName, value: string) => {
		setValues((current) => ({ ...current, [name]: value }));
		if (errors[name])
			setErrors((current) => ({ ...current, [name]: undefined }));
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (isSaving) return;

		const found = validateForm(def, values);
		setErrors(found);
		if (Object.keys(found).length > 0) return;

		try {
			await onSave(values);
		} catch {
			// The page already toasted the server message; keep the draft.
		}
	};

	return (
		<form className="mh-form" onSubmit={handleSubmit} noValidate>
			<header className="mh-form-head">
				<button
					type="button"
					className="mh-back"
					onClick={onClose}
					aria-label={`Back to ${def.label}`}
				>
					‹
				</button>
				<div className="mh-form-heading">
					<span className="mh-eyebrow">
						{def.label} · {isNew ? "New" : "Detail"}
					</span>
					<h2 className="mh-form-title">
						{row ? def.primary(row) : `New ${def.singular}`}
					</h2>
				</div>
				<button
					type="button"
					className="mh-close"
					onClick={onClose}
					aria-label="Close details"
				>
					×
				</button>
			</header>

			<div className="mh-form-body">
				<div className="mh-fields">
					{def.fields.map((field) => (
						<div
							key={field.name}
							className={field.wide ? "mh-field mh-field--wide" : "mh-field"}
						>
							<FormInput
								name={`master-${field.name}`}
								label={field.label}
								type={field.type ?? "text"}
								value={values[field.name]}
								required={field.required}
								placeholder={field.placeholder}
								maxLength={field.maxLength}
								disabled={isSaving}
								error={errors[field.name]}
								onChange={(event) => setField(field.name, event.target.value)}
							/>
						</div>
					))}
				</div>
			</div>

			<footer className="mh-form-actions">
				<button
					type="submit"
					className="mh-btn mh-btn--brand"
					disabled={isSaving}
				>
					{isSaving
						? "Saving…"
						: isNew
							? `Create ${def.singular}`
							: "Save changes"}
				</button>
				<button
					type="button"
					className="mh-btn"
					disabled={isSaving}
					onClick={onClose}
				>
					Cancel
				</button>
			</footer>
		</form>
	);
};
