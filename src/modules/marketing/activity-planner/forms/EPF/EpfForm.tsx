// forms/EPF/EpfForm.tsx
// EPF form rendered as one card: title on top, fields in the body, actions in
// the card footer. No collapsible section.
//
//   footer:  [footerStart…]                    [Cancel] [Reset] [Save & Review]
//
// `footerStart` lets a host (the wizard) put its own Back button in the same
// footer, so there is only ever one action bar per screen.
import type { ReactNode } from "react";
import { ArrowRight, RefreshCcw, Save, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Card from "../../../../../components/common/Card";

import EpfItemsSection from "./EpfItemSection";
import { useEpfForm, type EpfFormProps } from "./useEpfForm";
import EpfFormFields from "./EpfFormFields";

export type EpfFormCardProps = EpfFormProps & {
	/** Card title. Defaults to "Create / Edit Event Proposition Form". */
	title?: ReactNode;
	/** Overrides the primary button label. */
	submitLabel?: string;
	/** Rendered at the left of the footer (e.g. the wizard's Back button). */
	footerStart?: ReactNode;
};

/** Saving validates as a full submission; the workflow starts on Review & Submit. */
const SAVE_STATUS = "SUBMITTED";

export default function EpfForm(props: EpfFormCardProps) {
	const { onCancel, title, submitLabel, footerStart } = props;

	const {
		values,
		errors,
		handleChange,
		handleReset,
		options,
		costItems,
		setCostItems,
		handleSubmit,
		eventCost,
		isEditMode,
		loading,
		submitting,
	} = useEpfForm(props);

	const cardTitle =
		title ??
		(isEditMode
			? "Edit Event Proposition Form"
			: "Create Event Proposition Form");

	const primaryLabel = submitting
		? "Saving..."
		: (submitLabel ?? (isEditMode ? "Update EPF" : "Save & Review"));

	const footer = (
		<div className="flex w-full flex-wrap items-center justify-between gap-2">
			<div className="flex flex-wrap items-center gap-2">{footerStart}</div>

			<div className="flex flex-wrap items-center justify-end gap-2">
				{onCancel && (
					<Button
						type="button"
						text="Cancel"
						onClick={onCancel}
						size="sm"
						Icon={X}
						appearance="standard"
						variant="outline"
						disabled={submitting}
					/>
				)}

				<Button
					type="button"
					text="Reset"
					onClick={handleReset}
					Icon={RefreshCcw}
					size="sm"
					appearance="standard"
					variant="outline"
					disabled={submitting || loading}
				/>

				<Button
					type="button"
					onClick={() => void handleSubmit(SAVE_STATUS)}
					text={primaryLabel}
					size="sm"
					appearance="standard"
					variant="brand"
					Icon={isEditMode ? Save : ArrowRight}
					disabled={submitting || loading}
				/>
			</div>
		</div>
	);

	return (
		<Card title={cardTitle} footer={footer} loading={loading}>
			<EpfItemsSection
				items={costItems}
				onChange={setCostItems}
				options={options}
				isViewer={false}
			/>

			<div className="mb-2">
				<EpfFormFields
					values={values}
					errors={errors}
					handleChange={handleChange}
					eventCost={eventCost}
				/>
			</div>
		</Card>
	);
}
