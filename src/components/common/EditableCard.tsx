import {
	useEffect,
	useId,
	useState,
	type FormEvent,
	type ReactNode,
} from "react";
import { Pencil } from "lucide-react";

import Button from "./Button";
import Card from "./Card";
import FormInput from "../forms/FormInput";

export type EditableCardField<T extends Record<string, unknown>> = {
	/**
	 * Optional for display-only fields such as a grouped
	 * Social Links block.
	 */
	name?: keyof T;

	/**
	 * Stable identifier for display-only fields.
	 */
	id?: string;

	label: string;

	/**
	 * Custom content displayed when the card is in view mode.
	 */
	displayValue?: ReactNode;

	type?: "text" | "email" | "tel" | "url" | "number";
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;

	/**
	 * Number of grid columns occupied on tablet/desktop.
	 */
	span?: 1 | 2 | "full";

	/**
	 * Legacy edit-mode control.
	 *
	 * When false, the field is not rendered in edit mode.
	 */
	editable?: boolean;

	/**
	 * Controls whether the field is rendered in view mode.
	 */
	visibleInDisplay?: boolean;

	/**
	 * Controls whether the field is rendered in edit mode.
	 */
	visibleInEdit?: boolean;
};

export type EditableCardProps<T extends Record<string, unknown>> = {
	title?: ReactNode;
	subtitle?: ReactNode;
	header?: ReactNode;

	value: T;
	fields: EditableCardField<T>[];

	editable?: boolean;
	loading?: boolean;
	saving?: boolean;

	editTitle?: ReactNode;
	editSubtitle?: ReactNode;

	onSubmit: (value: T) => void | Promise<void>;

	/**
	 * Runs when editing starts, allowing the latest source values
	 * to populate the form instead of stale local values.
	 */
	onEditStart?: () => T;

	className?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

const getStringValue = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	return String(value);
};

const getFieldKey = <T extends Record<string, unknown>>(
	field: EditableCardField<T>,
	index: number,
) => {
	if (field.id) return field.id;
	if (field.name) return String(field.name);

	return `${field.label}-${index}`;
};

const getFieldSpanClass = (
	prefix: "editable-card-form-field" | "editable-card-value",
	span?: 1 | 2 | "full",
) => {
	if (span === 2) return `${prefix}-span-2`;
	if (span === "full") return `${prefix}-full`;

	return "";
};

export default function EditableCard<T extends Record<string, unknown>>({
	title,
	subtitle,
	header,
	value,
	fields,
	editable = true,
	loading = false,
	saving = false,
	editTitle,
	editSubtitle,
	onSubmit,
	onEditStart,
	className = "",
}: EditableCardProps<T>) {
	const formId = useId();

	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState<T>(value);

	/*
	 * Keep the draft synchronized with external values while the
	 * card is in view mode. Unsaved edits are not overwritten.
	 */
	useEffect(() => {
		if (!isEditing) {
			setDraft(value);
		}
	}, [isEditing, value]);

	const beginEditing = () => {
		setDraft(onEditStart?.() ?? value);
		setIsEditing(true);
	};

	const cancelEditing = () => {
		setDraft(value);
		setIsEditing(false);
	};

	const updateField = (name: keyof T, nextValue: string) => {
		setDraft((current) => ({
			...current,
			[name]: nextValue,
		}));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		try {
			await onSubmit(draft);
			setIsEditing(false);
		} catch {
			/*
			 * Keep the form open when submission fails.
			 * The parent mutation should surface the actual error.
			 */
		}
	};

	const cardTitle = isEditing ? (editTitle ?? title) : title;
	const cardSubtitle = isEditing ? (editSubtitle ?? subtitle) : subtitle;

	const editableFields = fields.filter(
		(field) =>
			field.name && field.editable !== false && field.visibleInEdit !== false,
	);

	const displayFields = fields.filter(
		(field) => field.visibleInDisplay !== false,
	);

	return (
		<Card
			title={cardTitle}
			subtitle={cardSubtitle}
			loading={loading}
			className={joinClassNames(
				"editable-card",
				isEditing && "editable-card-editing",
				className,
			)}
			actions={
				!isEditing && editable ? (
					<Button
						type="button"
						text="Edit"
						Icon={Pencil}
						size="sm"
						appearance="standard"
						variant="outline"
						onClick={beginEditing}
					/>
				) : null
			}
			footer={
				isEditing ? (
					<>
						<Button
							type="button"
							text="Cancel"
							appearance="standard"
							variant="outline"
							disabled={saving}
							onClick={cancelEditing}
						/>

						<Button
							type="submit"
							form={formId}
							text={saving ? "Saving..." : "Save Changes"}
							appearance="standard"
							variant="brand"
							disabled={saving}
						/>
					</>
				) : null
			}
		>
			{isEditing ? (
				<form
					id={formId}
					className="editable-card-form"
					onSubmit={handleSubmit}
				>
					<div className="editable-card-form-grid">
						{editableFields.map((field, index) => {
							/*
							 * Editable fields are filtered to ensure name exists.
							 */
							const fieldName = field.name as keyof T;

							return (
								<div
									key={getFieldKey(field, index)}
									className={joinClassNames(
										"editable-card-form-field",
										getFieldSpanClass("editable-card-form-field", field.span),
									)}
								>
									<FormInput
										name={String(fieldName)}
										label={field.label}
										type={field.type ?? "text"}
										value={getStringValue(draft[fieldName])}
										placeholder={field.placeholder}
										required={field.required}
										disabled={saving || field.disabled}
										onChange={(event) =>
											updateField(fieldName, event.target.value)
										}
									/>
								</div>
							);
						})}
					</div>
				</form>
			) : (
				<>
					{header ? (
						<div className="editable-card-custom-header">{header}</div>
					) : null}

					{displayFields.length ? (
						<div className="editable-card-value-grid">
							{displayFields.map((field, index) => {
								const rawValue = field.name ? value[field.name] : undefined;

								const displayValue =
									field.displayValue ?? getStringValue(rawValue);

								return (
									<div
										key={getFieldKey(field, index)}
										className={joinClassNames(
											"editable-card-value",
											getFieldSpanClass("editable-card-value", field.span),
										)}
									>
										<span className="editable-card-value-label">
											{field.label}
										</span>

										<div className="editable-card-value-content">
											{displayValue || "--"}
										</div>
									</div>
								);
							})}
						</div>
					) : null}
				</>
			)}
		</Card>
	);
}
