import type { ReactNode } from "react";
import Button from "../../../components/common/Button";
// import FormHeader from "../../marketing/activity-planner/components/common/FormHeader";

import {
	ArrowLeft,
	CheckCircle2,
	// FileCheck2,
	MessageSquareWarning,
	Save,
	ShieldCheck,
	XCircle,
} from "lucide-react";
import type {
	VendorCreationFormTwoValues,
	VendorCreationFormOneValues,
} from "../types/vendorOnboarding.types";
import VendorCreationFormOne from "./VendorCreationFormOne";
import VendorCreationFormTwo from "./VendorCreationFormTwo";

type VendorCreationSummaryFormProps = {
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
	const hasApprovalActions = canApprove || canClarify || canAcceptAndClose;

	return (
		<div className="vendor-summary-form">
			{/* <FormHeader title="Review Vendor Creation Request" Icon={FileCheck2} /> */}

			<div className="vendor-summary-intro">
				<div className="vendor-summary-intro-icon">
					<ShieldCheck size={18} aria-hidden="true" />
				</div>

				<div className="vendor-summary-intro-copy">
					<h2 className="vendor-summary-title">Final review before action</h2>
					<p className="vendor-summary-description">
						Review vendor master, finance, compliance, workflow and comments
						before submitting, approving, clarifying, or closing the request.
					</p>
				</div>
			</div>

			<section className="vendor-summary-block">
				<h3 className="vendor-summary-block-title">Vendor Details</h3>
				<div className="vendor-summary-block-body">
					<VendorCreationFormOne mode="view" values={formOneValues} />
				</div>
			</section>

			<section className="vendor-summary-block">
				<h3 className="vendor-summary-block-title">Finance & Compliance</h3>
				<div className="vendor-summary-block-body">
					<VendorCreationFormTwo mode="view" values={formTwoValues} />
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
							THCM approver can approve or request clarification. External user
							can review, comment, accept and close the request.
						</p>
					</div>

					<div className="vendor-approval-actions">
						{canClarify ? (
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

						{canApprove ? (
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

						{canAcceptAndClose ? (
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
					{canSubmit ? (
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
