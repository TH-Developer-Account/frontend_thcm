import {
	useEffect,
	useId,
	useState,
	type ReactNode,
	type SubmitEvent,
} from "react";
import { Pencil } from "lucide-react";

import Button from "./Button";
import Card from "./Card";
import FormInput from "../forms/FormInput";

export type EditableCardField<T extends Record<string, unknown>> = {
	name?: keyof T;
	id?: string;
	label: string;
	displayValue?: ReactNode;
	type?: "text" | "email" | "tel" | "url" | "number";
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	error?: string;
	span?: 1 | 2 | "full";
	editable?: boolean;
	visibleInDisplay?: boolean;
	visibleInEdit?: boolean;
	render?: (params: {
		draft: T;
		disabled: boolean;
		setFieldValue: <K extends keyof T>(name: K, value: T[K]) => void;
	}) => ReactNode;
};

export type EditableCardProps<T extends Record<string, unknown>> = {
	title?: ReactNode;
	subtitle?: ReactNode;
	header?: ReactNode;
	editHeader?: ReactNode;
	value: T;
	fields: EditableCardField<T>[];
	titleAction?: ReactNode;
	editable?: boolean;
	loading?: boolean;
	saving?: boolean;
	defaultEditing?: boolean;
	editTitle?: ReactNode;
	editSubtitle?: ReactNode;
	onSubmit: (value: T) => void | boolean | Promise<void | boolean>;
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
	editHeader,
	value,
	fields,
	editable = true,
	loading = false,
	saving = false,
	defaultEditing = false,
	editTitle,
	titleAction,
	editSubtitle,
	onSubmit,
	onEditStart,
	className = "",
}: EditableCardProps<T>) {
	const formId = useId();
	const [isEditing, setIsEditing] = useState(defaultEditing);
	const [draft, setDraft] = useState<T>(value);

	/*
	 * Synchronize external values while the card is not being edited.
	 * Edit routes should render this component only after their data is ready,
	 * or remount it with a stable record key when the selected record changes.
	 */
	useEffect(() => {
		if (!isEditing) {
			setDraft(value);
		}
	}, [isEditing, value]);

	useEffect(() => {
		setIsEditing(defaultEditing);
	}, [defaultEditing]);

	const beginEditing = () => {
		setDraft(onEditStart?.() ?? value);
		setIsEditing(true);
	};

	const cancelEditing = () => {
		setDraft(value);
		setIsEditing(false);
	};

	const setFieldValue = <K extends keyof T>(name: K, nextValue: T[K]) => {
		setDraft((current) => ({ ...current, [name]: nextValue }));
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		try {
			const succeeded = await onSubmit(draft);
			if (succeeded === false) return;

			setIsEditing(false);
		} catch {
			// Keep edit mode open when submission fails.
		}
	};

	const cardTitle = isEditing ? (editTitle ?? title) : title;
	const cardSubtitle = isEditing ? (editSubtitle ?? subtitle) : subtitle;
	const editableFields = fields.filter(
		(field) =>
			(field.name || field.render) &&
			field.editable !== false &&
			field.visibleInEdit !== false,
	);
	const displayFields = fields.filter(
		(field) => field.visibleInDisplay !== false,
	);

	return (
		<Card
			title={cardTitle}
			subtitle={cardSubtitle}
			loading={loading}
			padding="spacious"
			className={joinClassNames(
				"editable-card",
				isEditing && "editable-card-editing",
				className,
			)}
			actions={
				!isEditing ? (
					<div className="editable-card-title-actions">
						{editable ? (
							<Button
								type="button"
								text="Edit"
								Icon={Pencil}
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={beginEditing}
								className="mb-2"
							/>
						) : null}
						{titleAction}
					</div>
				) : null
			}
			secondaryHeader={
				isEditing ? (
					editHeader ? (
						<div className="editable-card-custom-header">{editHeader}</div>
					) : null
				) : header ? (
					<div className="editable-card-custom-header">{header}</div>
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
					<div className="editable-card-value-grid">
						{editableFields.map((field, index) => {
							const key = getFieldKey(field, index);
							const spanClass = getFieldSpanClass(
								"editable-card-form-field",
								field.span,
							);

							if (field.render) {
								return (
									<div
										key={key}
										className={joinClassNames(
											"editable-card-form-field",
											spanClass,
										)}
									>
										{field.render({
											draft,
											disabled: saving || Boolean(field.disabled),
											setFieldValue,
										})}
									</div>
								);
							}

							if (!field.name) return null;
							const fieldName = field.name;

							return (
								<div
									key={key}
									className={joinClassNames(
										"editable-card-form-field",
										spanClass,
									)}
								>
									<FormInput
										name={String(fieldName)}
										label={field.label}
										type={field.type ?? "text"}
										value={getStringValue(draft[fieldName])}
										placeholder={field.placeholder}
										required={field.required}
										error={field.error}
										disabled={saving || Boolean(field.disabled)}
										onChange={(event) =>
											setFieldValue(
												fieldName,
												event.target.value as T[typeof fieldName],
											)
										}
									/>
								</div>
							);
						})}
					</div>
				</form>
			) : displayFields.length > 0 ? (
				<div className="editable-card-value-grid">
					{displayFields.map((field, index) => {
						const rawValue = field.name ? value[field.name] : undefined;
						const displayValue =
							field.displayValue ??
							(rawValue !== null && rawValue !== undefined && rawValue !== ""
								? getStringValue(rawValue)
								: "--");

						return (
							<div
								key={getFieldKey(field, index)}
								className={joinClassNames(
									"editable-card-value",
									getFieldSpanClass("editable-card-value", field.span),
								)}
							>
								<span className="editable-card-value-label">{field.label}</span>
								<div className="editable-card-value-content">
									{displayValue}
								</div>
							</div>
						);
					})}
				</div>
			) : null}
		</Card>
	);
}
