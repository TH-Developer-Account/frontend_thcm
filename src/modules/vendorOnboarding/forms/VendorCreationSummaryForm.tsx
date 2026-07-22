import React, { type ReactNode } from "react";
import { ArrowLeft, RefreshCcw, Save } from "lucide-react";

import Button from "../../../components/common/Button";
import ApprovalWorkflowTableContent from "../../../components/ui/workflow/ApprovalWorkflowTableContent";
import type { ApprovalStageLike } from "../../../components/ui/workflow/approvalWorkflow.types";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";

import {
	ReasonActionModal,
	type ReasonActionMode,
} from "../../../components/ui/ReasonActionModal";
import {
	getCurrentApprovalStage,
	getIsUserInCurrentStage,
} from "../../marketing/activity-planner/helpers/approvalWorkflow.helpers";

import type {
	VendorCreationFormOneValues,
	VendorCreationFormTwoValues,
	VendorOnboardingDocument,
} from "../types/vendorOnboarding.types";

import VendorCreationFormOne from "./VendorCreationFormOne";
import VendorCreationFormTwo from "./VendorCreationFormTwo";
import { workflowApi } from "../../../api/workflow.api";

type VendorCreationSummaryMode = "edit" | "view";

const EMPTY_DOCUMENTS: VendorOnboardingDocument[] = [];

type VendorCreationSummaryFormProps = {
	mode?: VendorCreationSummaryMode;

	formOneValues: VendorCreationFormOneValues;
	formTwoValues: VendorCreationFormTwoValues;
	formOneDocuments?: VendorOnboardingDocument[];

	onFormTwoChange?: <K extends keyof VendorCreationFormTwoValues>(
		key: K,
		value: VendorCreationFormTwoValues[K],
	) => void;

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

	canEditVendorCode?: boolean;
	canSaveVendorCode?: boolean;
	vendorCodeLoading?: boolean;
	onSaveVendorCode?: () => void | Promise<boolean>;

	workflowStages?: readonly ApprovalStageLike[];
	commentsSection?: ReactNode;
	workflowLoading?: boolean;
};

type ReasonModalState = {
	mode: ReasonActionMode | null;
	loading: boolean;
};

const VendorCreationSummaryForm = ({
	mode = "edit",
	formOneValues,
	formTwoValues,
	formOneDocuments = EMPTY_DOCUMENTS,
	onFormTwoChange,
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
	canEditVendorCode = false,
	canSaveVendorCode = false,
	vendorCodeLoading = false,
	onSaveVendorCode,
	workflowStages = [],
	commentsSection,
	workflowLoading = false,
}: VendorCreationSummaryFormProps) => {
	const isViewMode = mode === "view";

	const { user } = useAuth();
	const { showToast } = useToast();

	const [reasonModal, setReasonModal] = React.useState<ReasonModalState>({
		mode: null,
		loading: false,
	});

	const userId = user?.id;

	const openReasonModal = React.useCallback(() => {
		setReasonModal({
			mode: "clarify-workflow",
			loading: false,
		});
	}, []);

	const closeReasonModal = React.useCallback(() => {
		setReasonModal({
			mode: null,
			loading: false,
		});
	}, []);

	const showSubmitAction =
		!isViewMode && canSubmit && typeof onSubmit === "function";

	const showApproveAction = canApprove;

	const showClarifyAction = canClarify && typeof onClarify === "function";

	const showAcceptAndCloseAction =
		canAcceptAndClose && typeof onAcceptAndClose === "function";

	const currentStage = React.useMemo(
		() => getCurrentApprovalStage(workflowStages),
		[workflowStages],
	);

	const hasWorkflow = workflowStages.length > 0;

	const showWorkflowBlock =
		hasWorkflow || typeof onFetchWorkflow === "function";

	const hasApprovalActions =
		showApproveAction || showClarifyAction || showAcceptAndCloseAction;

	const isUserInCurrentStage = React.useMemo(
		() => getIsUserInCurrentStage(workflowStages, userId),
		[workflowStages, userId],
	);

	const canActOnCurrentStage = Boolean(currentStage && isUserInCurrentStage);

	const handleApprove = React.useCallback(async () => {
		if (!currentStage?.id) {
			return;
		}

		try {
			const { message } = await workflowApi.approveStage(currentStage.id);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			onApprove?.();
		} catch (error) {
			showToast({
				type: "error",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Error while approving.",
			});
		}
	}, [currentStage?.id, onApprove, showToast]);

	const handleReasonConfirm = React.useCallback(
		async (reason: string) => {
			if (!currentStage?.id) {
				showToast({
					type: "error",
					title: "Not allowed",
					description: "No active approval stage found.",
				});

				return;
			}

			try {
				setReasonModal((current) => ({
					...current,
					loading: true,
				}));

				const { message } = await workflowApi.clarifyStage(
					currentStage.id,
					reason,
				);

				showToast({
					type: "success",
					title: "Success",
					description: message,
				});

				closeReasonModal();
				onClarify?.();
			} catch (error) {
				showToast({
					type: "error",
					title: "Error",
					description:
						error instanceof Error
							? error.message
							: "Unable to complete this action.",
				});
			} finally {
				setReasonModal((current) => ({
					...current,
					loading: false,
				}));
			}
		},
		[closeReasonModal, currentStage?.id, onClarify, showToast],
	);

	const handleVendorCodeSave = React.useCallback(() => {
		if (!onSaveVendorCode) {
			return;
		}

		void onSaveVendorCode();
	}, [onSaveVendorCode]);

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
				canEditVendorCode={canEditVendorCode}
				values={formTwoValues}
				errors={{}}
				onChange={onFormTwoChange}
				vendorCodeLoading={vendorCodeLoading}
			/>

			{commentsSection ? (
				<div className="vendor-summary-block-body">{commentsSection}</div>
			) : null}

			{showWorkflowBlock ? (
				<section className="vendor-summary-block">
					<div>
						{!hasWorkflow && typeof onFetchWorkflow === "function" ? (
							<>
								<span>Click the button to start the workflow</span>

								<Button
									type="button"
									text={
										workflowLoading ? "Fetching workflow..." : "Fetch workflow"
									}
									Icon={RefreshCcw}
									size="sm"
									appearance="standard"
									variant="outline"
									isTooltip="Click the button to start the workflow"
									disabled={workflowLoading}
									onClick={() => {
										void onFetchWorkflow();
									}}
								/>
							</>
						) : null}
					</div>

					{hasWorkflow ? (
						<ApprovalWorkflowTableContent
							stages={workflowStages}
							showEmptyState={!onFetchWorkflow}
						/>
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
				</section>
			) : null}

			<div className="vendor-onboarding-form-actions">
				<div className="vendor-approval-actions">
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
					) : null}
				</div>

				<div className="vendor-onboarding-form-actions-end">
					{canEditVendorCode ? (
						<Button
							type="button"
							text={vendorCodeLoading ? "Updating..." : "Update Vendor Code"}
							Icon={Save}
							iconPosition="left"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={handleVendorCodeSave}
							disabled={
								!canSaveVendorCode ||
								vendorCodeLoading ||
								typeof onSaveVendorCode !== "function"
							}
						/>
					) : null}
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
									disabled={reasonModal.loading || vendorCodeLoading}
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
							appearance="standard"
							variant="brand"
							disabled={vendorCodeLoading}
							onClick={onAcceptAndClose}
						/>
					) : null}

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

			<ReasonActionModal
				open={Boolean(reasonModal.mode)}
				mode={reasonModal.mode}
				loading={reasonModal.loading}
				onClose={closeReasonModal}
				onConfirm={handleReasonConfirm}
			/>
		</div>
	);
};

export default VendorCreationSummaryForm;
