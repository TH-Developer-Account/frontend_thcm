import { type ReactNode } from "react";
import {
	ArrowLeft,
	CheckCircle2,
	MessageSquareWarning,
	RefreshCcw,
	Save,
	XCircle,
} from "lucide-react";

import Button from "../../../components/common/Button";
import type {
	VendorCreationFormOneValues,
	VendorCreationFormTwoValues,
	VendorOnboardingDocument,
} from "../types/vendorOnboarding.types";
import ApprovalWorkflowTableContent from "../../../components/ui/workflow/ApprovalWorkflowTableContent";
import VendorCreationFormOne from "./VendorCreationFormOne";
import VendorCreationFormTwo from "./VendorCreationFormTwo";
import type { ApprovalStageLike } from "../../../components/ui/workflow/approvalWorkflow.types";

type VendorCreationSummaryMode = "edit" | "view";

const EMPTY_DOCUMENTS: VendorOnboardingDocument[] = [];

type VendorCreationSummaryFormProps = {
	mode?: VendorCreationSummaryMode;

	formOneValues: VendorCreationFormOneValues;
	formTwoValues: VendorCreationFormTwoValues;
	formOneDocuments?: VendorOnboardingDocument[];

	onBack?: () => void;
	onSubmit?: () => void;
	onApprove?: () => void;
	onClarify?: () => void;
	onAcceptAndClose?: () => void;
	onFetchWorkflow?: () => void | Promise<void>;

	canSubmit?: boolean;
	canApprove?: boolean;
	canClarify?: boolean;
	canAcceptAndClose?: boolean;

	workflowStages?: readonly ApprovalStageLike[];
	commentsSection?: ReactNode;
	workflowLoading?: boolean;
};

const VendorCreationSummaryForm = ({
	mode = "edit",
	formOneValues,
	formTwoValues,
	formOneDocuments = EMPTY_DOCUMENTS,
	onBack,
	onSubmit,
	onApprove,
	onClarify,
	onAcceptAndClose,
	onFetchWorkflow,
	canSubmit = false,
	canApprove = false,
	canClarify = false,
	canAcceptAndClose = false,
	workflowStages = [],
	commentsSection,
	workflowLoading = false,
}: VendorCreationSummaryFormProps) => {
	const isViewMode = mode === "view";

	const showSubmitAction =
		!isViewMode && canSubmit && typeof onSubmit === "function";

	const showApproveAction = canApprove && typeof onApprove === "function";
	const showClarifyAction = canClarify && typeof onClarify === "function";

	const showAcceptAndCloseAction =
		canAcceptAndClose && typeof onAcceptAndClose === "function";

	const hasWorkflow = workflowStages.length > 0;

	const showWorkflowBlock =
		hasWorkflow || typeof onFetchWorkflow === "function";

	const hasApprovalActions =
		showApproveAction || showClarifyAction || showAcceptAndCloseAction;

	return (
		<div className="vendor-summary-form">
			<VendorCreationFormOne
				mode="view"
				canEdit={false}
				values={formOneValues}
				errors={{}}
				initialDocuments={formOneDocuments}
				requireDocuments={false}
				requireDpdpConsent={false}
			/>

			<VendorCreationFormTwo
				mode="view"
				canEdit={false}
				values={formTwoValues}
				errors={{}}
			/>

			{commentsSection ? (
				<section className="vendor-summary-block">
					<h3 className="vendor-summary-block-title">Comments</h3>

					<div className="vendor-summary-block-body">{commentsSection}</div>
				</section>
			) : null}

			{showWorkflowBlock ? (
				<section className="vendor-summary-block">
					<div className="vendor-summary-block-header">
						{!hasWorkflow && typeof onFetchWorkflow === "function" ? (
							<Button
								type="button"
								text={
									workflowLoading ? "Fetching workflow..." : "Fetch workflow"
								}
								Icon={RefreshCcw}
								size="sm"
								appearance="standard"
								variant="outline"
								disabled={workflowLoading}
								onClick={() => {
									void onFetchWorkflow();
								}}
							/>
						) : null}
					</div>

					{hasWorkflow ? (
						<div className="vendor-summary-block-body">
							<ApprovalWorkflowTableContent
								stages={workflowStages}
								showEmptyState={!onFetchWorkflow}
							/>
						</div>
					) : (
						<div className="vendor-summary-block-body">
							<div className="approval-workflow-empty">
								<p className="approval-workflow-empty-title">
									No approval workflow assigned
								</p>

								<p className="approval-workflow-empty-description">
									Fetch the applicable workflow to generate the approval stages.
								</p>
							</div>
						</div>
					)}
				</section>
			) : null}

			{hasApprovalActions ? (
				<section className="vendor-approval-panel">
					<div className="vendor-approval-copy">
						<h3 className="vendor-approval-title">Approval action</h3>

						<p className="vendor-approval-description">
							Review the request and perform the available workflow action.
						</p>
					</div>

					<div className="vendor-approval-actions">
						{showClarifyAction ? (
							<Button
								type="button"
								text="Clarify"
								size="sm"
								Icon={MessageSquareWarning}
								appearance="standard"
								variant="outline"
								onClick={onClarify}
							/>
						) : null}

						{showApproveAction ? (
							<Button
								type="button"
								text="Approve"
								size="sm"
								Icon={CheckCircle2}
								appearance="standard"
								variant="success"
								onClick={onApprove}
							/>
						) : null}

						{showAcceptAndCloseAction ? (
							<Button
								type="button"
								text="Accept & Close"
								size="sm"
								Icon={XCircle}
								appearance="standard"
								variant="brand"
								onClick={onAcceptAndClose}
							/>
						) : null}
					</div>
				</section>
			) : null}

			<div className="vendor-onboarding-form-actions">
				{onBack ? (
					<Button
						type="button"
						text="Back"
						size="sm"
						Icon={ArrowLeft}
						iconPosition="left"
						appearance="standard"
						variant="outline"
						onClick={onBack}
					/>
				) : (
					<div />
				)}

				<div className="vendor-onboarding-form-actions-end">
					{showSubmitAction ? (
						<Button
							type="button"
							text="Submit"
							size="sm"
							appearance="standard"
							variant="brand"
							Icon={Save}
							onClick={onSubmit}
						/>
					) : null}
				</div>
			</div>
		</div>
	);
};

export default VendorCreationSummaryForm;
