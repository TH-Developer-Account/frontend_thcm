// forms/EPF/EpfForm.tsx
// EPF form: ONE Card made of collapsible `sections` —
//   Budget Summary · Event Cost Overheads · Participants · Dealer Info · Budget
// with the actions in the card footer.
//
//   footer:  [footerStart…]                    [Cancel] [Reset] [Save & Review]
//
// `footerStart` lets a host (the wizard) put its own Back button in the same
// footer, so there is only ever one action bar per screen.
import { useState, type ReactNode } from "react";
import { ArrowRight, Receipt, RefreshCcw, Save, Wallet, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Card, { type CardSection } from "../../../../../components/common/Card";

import BudgetShare from "../../components/activityFormView/BudgetShare";
import { calculateBudgetShares } from "./epf.calculations";
import EpfItemsSection from "./EpfItemSection";
import { useEpfForm, type EpfFormProps } from "./useEpfForm";
import { useEpfFormSections } from "./EpfFormFields";

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
	const { onCancel, submitLabel, footerStart, title } = props;

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
		epcId,
		isEditMode,
		loading,
		submitting,
	} = useEpfForm(props);

	// An attachment is still uploading: its S3 key isn't known yet, so saving
	// now would drop the file from the line item.
	const [attachmentBusy, setAttachmentBusy] = useState(false);

	const fieldSections = useEpfFormSections({
		values,
		errors,
		handleChange,
		eventCost,
	});

	const primaryLabel = submitting
		? "Saving..."
		: attachmentBusy
			? "Uploading file..."
			: (submitLabel ?? (isEditMode ? "Update EPF" : "Save & Review"));

	// Live numbers for the summary — they move as the user edits the table
	// or the dealer percentage.
	const shares = calculateBudgetShares(values, eventCost);

	const sections: CardSection[] = [
		{
			id: "summary",
			title: "Budget Summary",
			Icon: Wallet,
			className: "epf-section--full",
			children: (
				<BudgetShare
					eventCost={eventCost}
					dealerName={values.dealerName}
					dealerPercent={shares.dealerPercent}
					dealerShare={shares.dealerShare}
					tataHitachiPercent={shares.tataHitachiPercent}
					tataHitachiShare={shares.tataHitachiShare}
					availableBudget={Number(values.availableBudget) || 0}
				/>
			),
		},
		{
			id: "overheads",
			title: "Event Cost Overheads",
			Icon: Receipt,
			className: "epf-section--full",
			actions: (
				<span className="line-item-editor-count">
					{costItems.length} {costItems.length === 1 ? "item" : "items"}
				</span>
			),
			children: (
				<EpfItemsSection
					items={costItems}
					onChange={setCostItems}
					options={options}
					isViewer={false}
					epcId={epcId}
					onAttachmentBusyChange={setAttachmentBusy}
				/>
			),
		},
		...fieldSections,
	];

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
					disabled={submitting || loading || attachmentBusy}
				/>
			</div>
		</div>
	);

	return (
		<Card
			className="epf-sections-card"
			title={title}
			sections={sections}
			footer={footer}
			loading={loading}
		/>
	);
}
