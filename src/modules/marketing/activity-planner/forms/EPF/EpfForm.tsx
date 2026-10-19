// forms/EPF/EpfForm.tsx
// EPF form: ONE Card made of collapsible `sections` —
//   Budget Summary · Event Cost Overheads · Participants · Dealer Info · Budget
//   · Approval Workflow (only when `submitWithWorkflow`)
// with the actions in the card footer.
//
//   footer:  [footerStart…] [Draft saved 10:42]   [Request workflow] [Cancel] [Reset] [Submit]
//
// With `submitWithWorkflow`, the primary button is disabled until a workflow
// exists for the current budget; if none does, a small "Request workflow"
// button appears instead of letting the user submit.
import { useState, type ReactNode } from "react";
import {
	ArrowRight,
	BellRing,
	Receipt,
	RefreshCcw,
	Save,
	ShieldCheck,
	Wallet,
	X,
} from "lucide-react";

import Button from "../../../../../components/common/Button";
import Card, { type CardSection } from "../../../../../components/common/Card";
import { ApprovalTable, getWorkflowErrorMessage } from "../../../../workflows";

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

/** Saving validates as a full submission. */
const SAVE_STATUS = "SUBMITTED";

export default function EpfForm(props: EpfFormCardProps) {
	const { onCancel, submitLabel, footerStart, title, submitWithWorkflow } =
		props;

	const {
		values,
		errors,
		handleChange,
		handleReset,
		options,
		costItems,
		setCostItems,
		handleSubmit,
		handleRequestWorkflow,
		eventCost,
		epcId,
		isEditMode,
		draftSavedAt,
		workflowPreview,
		loading,
		submitting,
	} = useEpfForm(props);

	const cardTitle =
		title ??
		(isEditMode
			? "Edit Event Proposition Form"
			: "Create Event Proposition Form");

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
		? submitWithWorkflow
			? "Submitting..."
			: "Saving..."
		: attachmentBusy
			? "Uploading file..."
			: (submitLabel ?? (isEditMode ? "Update EPF" : "Save"));

	// Live numbers for the summary — they move as the user edits the table
	// or the dealer percentage.
	const shares = calculateBudgetShares(values, eventCost);

	/** Submitting needs a workflow; plain saving does not. */
	const blockedByWorkflow = Boolean(
		workflowPreview.enabled && !workflowPreview.hasWorkflow,
	);

	/** Settled and still no workflow → offer "Request workflow". */
	const showRequestWorkflow = Boolean(
		workflowPreview.enabled &&
		!workflowPreview.loading &&
		!workflowPreview.hasWorkflow &&
		eventCost > 0,
	);

	const requestWorkflowButton = (
		<Button
			type="button"
			text="Request workflow"
			Icon={BellRing}
			size="sm"
			appearance="standard"
			variant="outline"
			onClick={() => void handleRequestWorkflow()}
		/>
	);

	const renderWorkflowPreview = () => {
		if (eventCost <= 0) {
			return (
				<p className="text-sm text-[var(--color-text-muted)]">
					Add event cost items to see the approval workflow for this budget.
				</p>
			);
		}

		if (workflowPreview.loading) {
			return (
				<p className="text-sm text-[var(--color-text-muted)]" role="status">
					Loading approval workflow...
				</p>
			);
		}

		if (workflowPreview.error) {
			return (
				<div className="flex flex-wrap items-center gap-3">
					<p className="text-sm text-[var(--color-danger)]">
						{getWorkflowErrorMessage(
							workflowPreview.error,
							"No approval workflow found for this budget.",
						)}
					</p>
					{requestWorkflowButton}
				</div>
			);
		}

		if (!workflowPreview.hasWorkflow) {
			return (
				<div className="flex flex-wrap items-center gap-3">
					<p className="text-sm text-[var(--color-danger)]">
						No approval workflow is configured for this budget. You can't submit
						without one.
					</p>
					{requestWorkflowButton}
				</div>
			);
		}

		return (
			<div className="approval-workflow-content max-w-full overflow-x-auto">
				<ApprovalTable data={workflowPreview.rows} />
			</div>
		);
	};

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
		...(submitWithWorkflow
			? [
					{
						id: "workflow",
						title: "Approval Workflow",
						Icon: ShieldCheck,
						className: "epf-section--full",
						children: renderWorkflowPreview(),
					} satisfies CardSection,
				]
			: []),
	];

	const footer = (
		<div className="flex w-full flex-wrap items-center justify-between gap-2">
			<div className="flex flex-wrap items-center gap-2">
				{footerStart}

				{!isEditMode && draftSavedAt && (
					<span
						className="text-xs text-[var(--color-text-muted)]"
						role="status"
					>
						Draft saved{" "}
						{new Date(draftSavedAt).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>
				)}
			</div>

			<div className="flex flex-wrap items-center justify-end gap-2">
				{showRequestWorkflow && requestWorkflowButton}

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
					Icon={isEditMode && !submitWithWorkflow ? Save : ArrowRight}
					disabled={
						submitting || loading || attachmentBusy || blockedByWorkflow
					}
				/>
			</div>
		</div>
	);

	return (
		<Card
			className="epf-sections-card"
			title={cardTitle}
			sections={sections}
			footer={footer}
			loading={loading}
		/>
	);
}
