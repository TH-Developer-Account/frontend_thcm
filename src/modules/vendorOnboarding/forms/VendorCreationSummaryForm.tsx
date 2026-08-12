import type { ReactNode } from "react";
import {
	ArrowLeft,
	CircleCheck,
	ClipboardClock,
	Save,
	Send,
} from "lucide-react";

import Button from "../../../components/common/Button";
import { ApprovalWorkflowTableContent } from "../../workflows/components/ApprovalWorkflowTableContent";

import { VendorCodeRequiredModal } from "../components/VendorCodeRequiredModal";
import { ReasonActionModal } from "../../../components/ui/ReasonActionModal";
import type {
	VendorCreationFormOneValues,
	VendorCreationFormTwoValues,
	VendorOnboardingDocument,
} from "../types/vendorOnboarding.types";

import VendorCreationFormOne from "./VendorCreationFormOne";
import VendorCreationFormTwo from "./VendorCreationFormTwo";
import {
	useOptionalVendorCreationFormContext,
	useVendorCreationSummaryController,
} from "../hooks/useVendorCreationForm";
import type { ApprovalStageLike } from "../../workflows/types/types";
import { CardEmpty } from "../../../components/ui/CardSkeleton";

type VendorCreationSummaryMode = "edit" | "view";

const EMPTY_DOCUMENTS: VendorOnboardingDocument[] = [];

type VendorCreationSummaryFormProps = {
	mode?: VendorCreationSummaryMode;

	formOneValues?: VendorCreationFormOneValues;
	formTwoValues?: VendorCreationFormTwoValues;
	formOneDocuments?: VendorOnboardingDocument[];

	onFormTwoChange?: <K extends keyof VendorCreationFormTwoValues>(
		key: K,
		value: VendorCreationFormTwoValues[K],
	) => void;

	onBack?: () => void;
	onSubmit?: () => void;
	onApprove?: () => void;
	onClarify?: () => void;
	onFetchWorkflow?: () => void | Promise<void>;
	onHandleSendBackVendor?: () => void | Promise<void>;
	onAcceptAndClose?: () => void | Promise<void>;
	onSaveVendorCode?: (code?: string) => void | Promise<boolean>;
	canSendBackToVendor?: boolean;
	canSubmit?: boolean;
	canApprove?: boolean;
	canClarify?: boolean;
	canAcceptAndClose?: boolean;

	canEditVendorCode?: boolean;
	vendorCodeLoading?: boolean;

	workflowStages?: ApprovalStageLike[];
	commentsSection?: ReactNode;
	workflowSection?: ReactNode;
};

const VendorCreationSummaryForm = ({
	mode = "edit",
	formOneValues: formOneValuesProp,
	formTwoValues: formTwoValuesProp,
	formOneDocuments = EMPTY_DOCUMENTS,
	onFormTwoChange,
	onBack,
	onSubmit,
	onApprove,
	onClarify,
	onAcceptAndClose,
	onHandleSendBackVendor,
	canSendBackToVendor,
	canSubmit,
	canApprove,
	canClarify,
	canAcceptAndClose,
	canEditVendorCode,
	vendorCodeLoading,
	onSaveVendorCode,
	workflowStages = [],
	commentsSection,
}: VendorCreationSummaryFormProps) => {
	const formContext = useOptionalVendorCreationFormContext();
	const formOneValues = formOneValuesProp ?? formContext?.formOneValues ?? {};
	const formTwoValues = formTwoValuesProp ?? formContext?.formTwoValues ?? {};
	const resolvedDocuments =
		formOneDocuments.length > 0
			? formOneDocuments
			: (formContext?.formOneDocuments ?? EMPTY_DOCUMENTS);

	const resolvedWorkflowStages = (
		workflowStages && workflowStages.length > 0
			? workflowStages
			: (formContext?.workflowStages ?? [])
	).map((stage) => ({
		...stage,
		approvals: stage.approvals ? [...stage.approvals] : undefined,
	}));
	const resolvedFormTwoChange =
		onFormTwoChange ?? formContext?.handleFormTwoChange;
	const resolvedOnBack = onBack ?? formContext?.handleBack;
	const resolvedOnSubmit = onSubmit ?? formContext?.handleSubmitSummary;
	const resolvedOnApprove = onApprove ?? formContext?.handleApprove;
	const resolvedOnClarify = onClarify ?? formContext?.handleClarify;
	const resolvedOnAcceptAndClose =
		onAcceptAndClose ?? formContext?.handleAcceptAndClose;
	const resolvedOnSaveVendorCode =
		onSaveVendorCode ?? formContext?.handleSaveVendorCode;
	const resolvedCanSubmit = canSubmit ?? formContext?.canSubmit ?? false;
	const resolvedCanApprove = canApprove ?? formContext?.canApprove ?? false;
	const resolvedCanClarify = canClarify ?? formContext?.canClarify ?? false;
	const resolvedCanAcceptAndClose =
		canAcceptAndClose ?? formContext?.canAcceptAndClose ?? false;
	const resolvedCanEditVendorCode =
		canEditVendorCode ?? formContext?.canEditVendorCode ?? false;
	const resolvedVendorCodeLoading =
		vendorCodeLoading ?? formContext?.vendorCodeLoading ?? false;
	const isViewMode = mode === "view";
	const {
		reasonModal,
		canActOnCurrentStage,
		// requiresVendorCodeToApprove,
		// isThcmProposer,
		vendorCodeModal,
		openReasonModal,
		closeReasonModal,
		closeVendorCodeModal,
		handleApprove,
		handleVendorCodeModalConfirm,
		handleReasonConfirm,
	} = useVendorCreationSummaryController({
		workflowStages: resolvedWorkflowStages,
		vendorCode: formTwoValues.vendorCode,
		onApprove: resolvedOnApprove,
		onClarify: resolvedOnClarify,
		onSaveVendorCode: resolvedOnSaveVendorCode,
		onAcceptAndClose: resolvedOnAcceptAndClose,
	});

	const showSubmitAction =
		!isViewMode && resolvedCanSubmit && typeof resolvedOnSubmit === "function";

	const showApproveAction = resolvedCanApprove;

	const showClarifyAction =
		resolvedCanClarify && typeof resolvedOnClarify === "function";

	const showAcceptAndCloseAction =
		resolvedCanAcceptAndClose && typeof resolvedOnAcceptAndClose === "function";

	const showSendBackAction =
		(formContext?.hasPendingClarifiedApproval && canSendBackToVendor) ??
		formContext?.canSendBackToVendor ??
		false;

	const hasWorkflow = resolvedWorkflowStages.length > 0;

	const hasApprovalActions =
		showApproveAction || showClarifyAction || showAcceptAndCloseAction;

	return (
		<div className="vendor-summary-form">
			<VendorCreationFormOne
				mode="view"
				canEdit={false}
				values={formOneValues}
				errors={{}}
				initialDocuments={resolvedDocuments}
				requireDocuments={false}
				requireDpdpConsent={false}
			/>
			<VendorCreationFormTwo
				mode="view"
				canEdit={false}
				canEditVendorCode={resolvedCanEditVendorCode}
				values={formTwoValues}
				errors={{}}
				onChange={resolvedFormTwoChange}
				vendorCodeLoading={resolvedVendorCodeLoading}
			/>
			{commentsSection ? (
				<section className="vendor-summary-block-body">
					{commentsSection}
				</section>
			) : null}

			{hasWorkflow ? (
				<section className="vendor-summary-block-body">
					{hasWorkflow ? (
						<ApprovalWorkflowTableContent
							stages={resolvedWorkflowStages}
							showEmptyState={!hasWorkflow}
						/>
					) : (
						<CardEmpty
							title="No approval workflow assigned"
							description="Fetch the applicable workflow to generate the approval stages."
							Icon={ClipboardClock}
						/>
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
				</section>
			) : null}
			<div className="vendor-onboarding-form-actions">
				<div className="vendor-approval-actions">
					{resolvedOnBack && (
						<Button
							type="button"
							text="Back"
							size="sm"
							Icon={ArrowLeft}
							iconPosition="left"
							appearance="standard"
							variant="outline"
							onClick={resolvedOnBack}
						/>
					)}
				</div>

				<div className="vendor-onboarding-form-actions-end">
					{canActOnCurrentStage ? (
						<>
							{showClarifyAction ? (
								<Button
									type="button"
									text="Send for Clarification"
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={reasonModal.loading}
									onClick={openReasonModal}
								/>
							) : null}

							{showApproveAction ? (
								<Button
									type="button"
									text="Approve"
									size="sm"
									appearance="standard"
									variant="brand"
									disabled={reasonModal.loading || resolvedVendorCodeLoading}
									onClick={() => {
										void handleApprove();
									}}
								/>
							) : null}
						</>
					) : null}
					{showAcceptAndCloseAction ? (
						<Button
							type="button"
							text="Accept and Close"
							size="sm"
							Icon={CircleCheck}
							appearance="standard"
							variant="brand"
							disabled={resolvedVendorCodeLoading}
							onClick={resolvedOnAcceptAndClose}
						/>
					) : null}
					{showSendBackAction ? (
						<Button
							type="button"
							text="Send Back to Vendor"
							size="sm"
							disabled={!showSendBackAction}
							appearance="standard"
							variant="outline"
							Icon={Send}
							onClick={onHandleSendBackVendor}
						/>
					) : null}
					{showSubmitAction ? (
						<Button
							type="button"
							text="Final Submit"
							size="sm"
							appearance="standard"
							variant="brand"
							Icon={Save}
							onClick={resolvedOnSubmit}
						/>
					) : null}
				</div>
			</div>
			<ReasonActionModal
				open={Boolean(reasonModal.mode)}
				mode={reasonModal.mode}
				loading={reasonModal.loading}
				onClose={closeReasonModal}
				onConfirm={handleReasonConfirm}
			/>
			<VendorCodeRequiredModal
				open={vendorCodeModal.open}
				loading={vendorCodeModal.loading}
				onClose={closeVendorCodeModal}
				onConfirm={handleVendorCodeModalConfirm}
			/>
		</div>
	);
};

export default VendorCreationSummaryForm;
