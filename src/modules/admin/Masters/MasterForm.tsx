import { useState, type FormEvent } from "react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";

import {
	emptyFormValues,
	rowToFormValues,
	validateForm,
	type Feed,
	type FieldDef,
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
	/** The live GET /master-data feed, for "select" fields (e.g. Division). */
	feed: Feed;
};

/** react-select needs a string value per option — feed ids are always strings. */
type SelectOption = { value: string; label: string };

const fieldOptions = (feed: Feed, field: FieldDef): SelectOption[] =>
	(feed[field.optionsFeedKey ?? ""] ?? []).map((option) => ({
		value: String(option.value),
		label: String(option.label ?? ""),
	}));

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
	feed,
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
							{field.type === "select" ? (
								(() => {
									const options = fieldOptions(feed, field);
									const selected =
										options.find(
											(option) => option.value === values[field.name],
										) ?? null;

									return (
										<SelectInput<SelectOption>
											inputId={`master-${field.name}`}
											name={field.name}
											label={field.label}
											required={field.required}
											isDisabled={isSaving}
											error={errors[field.name]}
											options={options}
											value={selected}
											onChange={(option) =>
												setField(field.name, option?.value ?? "")
											}
										/>
									);
								})()
							) : (
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
							)}
						</div>
					))}
				</div>
			</div>

			<footer className="mh-form-actions">
				<Button
					type="submit"
					text={
						isSaving
							? "Saving…"
							: isNew
								? `Create ${def.singular}`
								: "Save changes"
					}
					appearance="standard"
					variant="brand"
					size="sm"
					disabled={isSaving}
				/>
				<Button
					type="button"
					text="Cancel"
					appearance="standard"
					variant="outline"
					size="sm"
					disabled={isSaving}
					onClick={onClose}
				/>
			</footer>
		</form>
	);
};
