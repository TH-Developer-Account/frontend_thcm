import type { ReactNode } from "react";
import {
	ArrowLeft,
	CheckCircle2,
	MessageSquareWarning,
	Save,
	XCircle,
} from "lucide-react";

import Button from "../../../components/common/Button";
import type {
	VendorCreationFormOneValues,
	VendorCreationFormTwoValues,
} from "../types/vendorOnboarding.types";
import VendorCreationFormOne from "./VendorCreationFormOne";
import VendorCreationFormTwo from "./VendorCreationFormTwo";

type VendorCreationSummaryMode = "edit" | "view";

type VendorCreationSummaryFormProps = {
	mode?: VendorCreationSummaryMode;

	formOneValues: VendorCreationFormOneValues;
	formTwoValues: VendorCreationFormTwoValues;

	onBack?: () => void;
	onSubmit?: () => void;
	onApprove?: () => void;
	onClarify?: () => void;
	onAcceptAndClose?: () => void;

	canSubmit?: boolean;
	canApprove?: boolean;
	canClarify?: boolean;
	canAcceptAndClose?: boolean;

	workflowSection?: ReactNode;
	commentsSection?: ReactNode;
};

const VendorCreationSummaryForm = ({
	mode = "edit",
	formOneValues,
	formTwoValues,
	onBack,
	onSubmit,
	onApprove,
	onClarify,
	onAcceptAndClose,
	canSubmit = false,
	canApprove = false,
	canClarify = false,
	canAcceptAndClose = false,
	workflowSection,
	commentsSection,
}: VendorCreationSummaryFormProps) => {
	const isViewMode = mode === "view";

	const showSubmitAction =
		!isViewMode && canSubmit && typeof onSubmit === "function";

	const showApproveAction = canApprove && typeof onApprove === "function";

	const showClarifyAction = canClarify && typeof onClarify === "function";

	const showAcceptAndCloseAction =
		canAcceptAndClose && typeof onAcceptAndClose === "function";

	const hasApprovalActions =
		showApproveAction || showClarifyAction || showAcceptAndCloseAction;

	return (
		<div className="vendor-summary-form">
			{/* {isViewMode ? (
				<div className="vendor-summary-intro">
					<div className="vendor-summary-intro-icon">
						<ShieldCheck size={18} aria-hidden="true" />
					</div>

					<div className="vendor-summary-intro-copy">
						<h2 className="vendor-summary-title">
							{isViewMode
								? "Vendor onboarding details"
								: "Final review before action"}
						</h2>

						<p className="vendor-summary-description">
							{isViewMode
								? "Review vendor master, finance, compliance, workflow, and comments."
								: "Review vendor master, finance, compliance, workflow and comments before submitting, approving, clarifying, or closing the request."}
						</p>
					</div>
				</div>
			) : null} */}

			<section className="vendor-summary-block">
				<h3 className="vendor-summary-block-title">Vendor Details</h3>

				<div className="vendor-summary-block-body">
					<VendorCreationFormOne
						mode="view"
						canEdit={false}
						values={formOneValues}
						errors={{}}
					/>
				</div>
			</section>

			<section className="vendor-summary-block">
				<h3 className="vendor-summary-block-title">Finance & Compliance</h3>

				<div className="vendor-summary-block-body">
					<VendorCreationFormTwo
						mode="view"
						canEdit={false}
						values={formTwoValues}
						errors={{}}
					/>
				</div>
			</section>

			{commentsSection ? (
				<section className="vendor-summary-block">
					<h3 className="vendor-summary-block-title">Comments</h3>

					<div className="vendor-summary-block-body">{commentsSection}</div>
				</section>
			) : null}

			{workflowSection ? (
				<section className="vendor-summary-block">
					<h3 className="vendor-summary-block-title">Workflow Details</h3>

					<div className="vendor-summary-block-body">{workflowSection}</div>
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
