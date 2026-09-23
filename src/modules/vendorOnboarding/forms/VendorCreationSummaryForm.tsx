import { useState, type ReactNode } from "react";
import {
	Building2,
	ClipboardClock,
	FileDown,
	FileCheck2,
	FileSpreadsheet,
	MessageSquareText,
	Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";
import Card, { type CardSection } from "../../../components/common/Card";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { useToast } from "../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../services/ServerAxios";
import { ApprovalWorkflowTableContent } from "../../workflows/components/ApprovalWorkflowTableContent";
import type { ApprovalStageLike } from "../../workflows/types/types";

import { VendorCodeRequiredModal } from "../components/VendorCodeRequiredModal";
import {
	useOptionalVendorCreationFormContext,
	useVendorCreationSummaryController,
} from "../hooks/useVendorCreationForm";
import type {
	VendorCreationFormOneValues,
	VendorCreationFormTwoValues,
	VendorFormErrors,
	VendorOnboardingDocument,
} from "../types/vendorOnboarding.types";

import VendorCreationFormOne from "./VendorCreationFormOne";
import VendorCreationFormTwo from "./VendorCreationFormTwo";
import NavigateButton from "../../../components/common/NavigateButton";
import { Badge } from "../../../components/common/Badge";
import { vendorContent } from "../../../content/vendor.content";
import { showApiErrorToast } from "../../../utils/apiError.helper";
import ApprovalActionsBar from "../../../components/ui/ApprovalActionsBar";

type VendorCreationSummaryMode = "edit" | "view";

const EMPTY_DOCUMENTS: VendorOnboardingDocument[] = [];

type VendorCreationSummaryFormProps = {
	mode?: VendorCreationSummaryMode;
	onboardingId?: string;

	formOneValues?: VendorCreationFormOneValues;
	formTwoValues?: VendorCreationFormTwoValues;
	formOneErrors?: VendorFormErrors<VendorCreationFormOneValues>;
	formTwoErrors?: VendorFormErrors<VendorCreationFormTwoValues>;
	formOneDocuments?: VendorOnboardingDocument[];

	onFormTwoChange?: <K extends keyof VendorCreationFormTwoValues>(
		key: K,
		value: VendorCreationFormTwoValues[K],
	) => void;

	onBack?: () => void;
	onSubmit?: () => void | Promise<void>;

	// These are the "what happens after a successful approve/clarify"
	// callback (e.g. refetch the detail query) — NOT what fires the API
	// call itself. useVendorCreationSummaryController's own handleApprove/
	// handleClarify (below) call these internally once the mutation
	// succeeds. The footer never calls onApprove/onClarify directly.
	onApprove?: (reason: string) => void | Promise<void>;
	onClarify?: (reason: string) => void | Promise<void>;

	onHandleSendBackVendor?: () => void | Promise<void>;
	onAcceptAndClose?: () => void | Promise<void>;
	onSaveVendorCode?: (code?: string) => void | Promise<boolean>;

	canSendBackToVendor?: boolean;
	canSubmit?: boolean;
	canApprove?: boolean;
	canClarify?: boolean;
	canAcceptAndClose?: boolean;
	canEditVendorCode?: boolean;

	loading?: boolean;
	vendorCodeLoading?: boolean;

	workflowStages?: ApprovalStageLike[];
	commentsSection?: ReactNode;
	auditSection?: ReactNode;
	workflowSection?: ReactNode;
};

const VendorCreationSummaryForm = ({
	mode = "edit",
	onboardingId,
	formOneValues: formOneValuesProp,
	formTwoValues: formTwoValuesProp,
	formOneErrors: formOneErrorsProp,
	formTwoErrors: formTwoErrorsProp,
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
	loading,
	vendorCodeLoading,
	onSaveVendorCode,
	workflowStages = [],
	commentsSection,
	auditSection,
	workflowSection,
}: VendorCreationSummaryFormProps) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [isExportingExcel, setIsExportingExcel] = useState(false);
	const formContext = useOptionalVendorCreationFormContext();

	const formOneValues = formOneValuesProp ?? formContext?.formOneValues ?? {};
	const formTwoValues = formTwoValuesProp ?? formContext?.formTwoValues ?? {};
	const formOneErrors = formOneErrorsProp ?? formContext?.formOneErrors ?? {};
	const formTwoErrors = formTwoErrorsProp ?? formContext?.formTwoErrors ?? {};

	const resolvedDocuments =
		formOneDocuments.length > 0
			? formOneDocuments
			: (formContext?.formOneDocuments ?? EMPTY_DOCUMENTS);

	const resolvedWorkflowStages = (
		workflowStages.length > 0
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

	// These feed INTO the controller below as its post-success callback —
	// they are not called by the footer.
	const resolvedOnApprove = onApprove ?? formContext?.handleApprove;
	const resolvedOnClarify = onClarify ?? formContext?.handleClarify;

	const resolvedOnAcceptAndClose =
		onAcceptAndClose ?? formContext?.handleAcceptAndClose;
	const resolvedOnSendBack =
		onHandleSendBackVendor ?? formContext?.handleSendBackToVendor;
	const resolvedOnSaveVendorCode =
		onSaveVendorCode ?? formContext?.handleSaveVendorCode;

	const resolvedCanSubmit = canSubmit ?? formContext?.canSubmit ?? false;
	const resolvedCanApprove = canApprove ?? formContext?.canApprove ?? false;
	const resolvedCanClarify = canClarify ?? formContext?.canClarify ?? false;
	const resolvedCanSendBack =
		canSendBackToVendor ?? formContext?.canSendBackToVendor ?? false;
	const resolvedCanAcceptAndClose =
		canAcceptAndClose ?? formContext?.canAcceptAndClose ?? false;
	const resolvedCanEditVendorCode =
		canEditVendorCode ?? formContext?.canEditVendorCode ?? false;

	const resolvedLoading = loading ?? formContext?.mutationLoading ?? false;
	const resolvedVendorCodeLoading =
		vendorCodeLoading ?? formContext?.vendorCodeLoading ?? false;
	const isViewMode = mode === "view";

	const handleEdit = () => {
		if (!onboardingId) return;

		navigate(`/vendor-onboarding/${onboardingId}`);
	};

	const handleExport = async () => {
		if (!onboardingId || isExportingExcel) return;

		setIsExportingExcel(true);
		let blobUrl: string | undefined;
		let downloadLink: HTMLAnchorElement | undefined;

		try {
			const response = await ServerAxios.get(
				`/vendor-onboarding/export/${onboardingId}`,
				{ responseType: "blob" },
			);

			const referenceNumber =
				formContext?.vendorDetail?.referenceNumber?.trim() || onboardingId;
			blobUrl = window.URL.createObjectURL(response.data as Blob);
			downloadLink = document.createElement("a");

			downloadLink.href = blobUrl;
			downloadLink.download = `vendor-onboarding-${referenceNumber}.xlsx`;

			document.body.appendChild(downloadLink);
			downloadLink.click();
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				vendorContent.toast.export.excelErrorFallback,
				vendorContent.toast.export.excelErrorTitle,
			);
		} finally {
			if (blobUrl) {
				window.URL.revokeObjectURL(blobUrl);
			}

			downloadLink?.remove();
			setIsExportingExcel(false);
		}
	};

	const summaryActions: ActionMenuItem<string>[] = [
		{
			id: "download-pdf",
			label: formContext?.isDownloadingPdf
				? vendorContent.summary.actions.downloadingPdf
				: vendorContent.summary.actions.downloadPdf,
			Icon: FileDown,
			onClick: () => void formContext?.handleDownloadPdf?.(),
			disabled:
				!onboardingId ||
				!formContext?.handleDownloadPdf ||
				Boolean(formContext?.isDownloadingPdf),
		},
		{
			id: "export-excel",
			label: isExportingExcel
				? vendorContent.summary.actions.exportingExcel
				: vendorContent.summary.actions.exportExcel,
			Icon: FileSpreadsheet,
			onClick: () => void handleExport(),
			disabled: !onboardingId || isExportingExcel,
		},
		{
			id: "edit",
			label: vendorContent.summary.actions.edit,
			Icon: Pencil,
			onClick: handleEdit,
			hidden: !formContext?.canEditMainForm,
		},
	];

	const {
		canActOnCurrentStage,
		vendorCodeModal,
		closeVendorCodeModal,
		handleVendorCodeModalConfirm,
		// THE FIX: these are the real approve/clarify handlers — they call
		// approveStageMutation/clarifyStageMutation with the typed reason,
		// and only call resolvedOnApprove/resolvedOnClarify internally as
		// their post-success "refresh" step. ApprovalActionsBar must call
		// THESE, never resolvedOnApprove/resolvedOnClarify directly — that
		// was the bug (nothing fired the actual mutation).
		handleApprove,
		handleClarify,
		approveLoading,
		clarifyLoading,
	} = useVendorCreationSummaryController({
		workflowStages: resolvedWorkflowStages,
		vendorCode: formTwoValues.vendorCode,
		onApprove: resolvedOnApprove,
		onClarify: resolvedOnClarify,
		onSaveVendorCode: resolvedOnSaveVendorCode,
		onAcceptAndClose: resolvedOnAcceptAndClose,
	});

	const isActionLoading =
		resolvedLoading ||
		resolvedVendorCodeLoading ||
		approveLoading ||
		clarifyLoading;

	const showSubmitAction =
		!isViewMode && resolvedCanSubmit && typeof resolvedOnSubmit === "function";

	const showApproveAction = resolvedCanApprove;

	const showClarifyAction = resolvedCanClarify;

	const showSendBackAction =
		resolvedCanSendBack && typeof resolvedOnSendBack === "function";

	const showAcceptAndCloseAction =
		resolvedCanAcceptAndClose && typeof resolvedOnAcceptAndClose === "function";

	const hasApprovalActions =
		(canActOnCurrentStage && (showApproveAction || showClarifyAction)) ||
		showSendBackAction ||
		showAcceptAndCloseAction;
	const showButtons =
		showSendBackAction || showSubmitAction || hasApprovalActions;

	// Two footers: an approver who can act on the current stage gets
	// Back | reason | Clarify + Approve. Everyone else (proposer/creator)
	// gets Back | Accept & Close / Send Back / Final Submit — never the
	// reason box.
	const isApproverFooter =
		canActOnCurrentStage && (showApproveAction || showClarifyAction);

	const sections: CardSection[] = [
		{
			id: "vendor-submitted-details",
			title: vendorContent.summary.sections.vendorSubmittedDetails,
			Icon: Building2,
			defaultExpanded: true,
			children: (
				<VendorCreationFormOne
					mode="view"
					canEdit={false}
					values={formOneValues}
					errors={formOneErrors}
					initialDocuments={resolvedDocuments}
					requireDocuments={false}
					requireDpdpConsent={false}
				/>
			),
		},
		{
			id: "thcm-vendor-details",
			title: vendorContent.summary.sections.thcmVendorDetails,
			Icon: FileCheck2,
			defaultExpanded: true,
			children: (
				<VendorCreationFormTwo
					mode="view"
					canEdit={false}
					canEditVendorCode={resolvedCanEditVendorCode}
					values={formTwoValues}
					errors={formTwoErrors}
					onChange={resolvedFormTwoChange}
					vendorCodeLoading={resolvedVendorCodeLoading}
				/>
			),
		},
		{
			id: "approval-workflow",
			title: vendorContent.summary.sections.approvalWorkflow,
			Icon: ClipboardClock,
			defaultExpanded: true,
			children:
				workflowSection ??
				(resolvedWorkflowStages.length > 0 ? (
					<div className="px-4">
						<ApprovalWorkflowTableContent
							stages={resolvedWorkflowStages}
							showEmptyState={false}
						/>
					</div>
				) : (
					<CardEmpty
						title={vendorContent.summary.emptyWorkflow.title}
						description={vendorContent.summary.emptyWorkflow.description}
						Icon={ClipboardClock}
					/>
				)),
		},
		...(commentsSection
			? [
					{
						id: "comments-and-activity",
						title: vendorContent.summary.sections.chatSection,
						Icon: MessageSquareText,
						defaultExpanded: true,
						children: commentsSection,
					} satisfies CardSection,
				]
			: []),
		...(auditSection
			? [
					{
						id: "audit",
						title: vendorContent.summary.sections.auditSection,
						Icon: MessageSquareText,
						defaultExpanded: true,
						children: auditSection,
					} satisfies CardSection,
				]
			: []),
	];

	const footer = showButtons && (
		<ApprovalActionsBar
			variant={isApproverFooter ? "approver" : "proposer"}
			onBack={resolvedOnBack}
			canApprove={canActOnCurrentStage && showApproveAction}
			onApprove={handleApprove}
			canClarify={canActOnCurrentStage && showClarifyAction}
			onClarify={handleClarify}
			canSendBack={showSendBackAction}
			onSendBack={resolvedOnSendBack}
			canAcceptAndClose={showAcceptAndCloseAction}
			onAcceptAndClose={resolvedOnAcceptAndClose}
			canSubmit={showSubmitAction}
			onSubmit={resolvedOnSubmit}
			loading={isActionLoading}
			approveLabel={vendorContent.buttons.approve}
			clarifyLabel={vendorContent.buttons.sendForClarification}
			sendBackLabel={vendorContent.buttons.sendBackToVendor}
			acceptAndCloseLabel={vendorContent.buttons.acceptAndClose}
			submitLabel={vendorContent.buttons.finalSubmit}
			backLabel={vendorContent.buttons.back}
		/>
	);

	return (
		<div className="vendor-summary-form">
			<Card
				title={
					isViewMode ? (
						// Desktop: one line — Title / Ref / Name  [badge]
						// Mobile:  title on top, ref + name stacked under it,
						//          badge pinned to the right of the block.
						// "/" separators are CSS pseudo-elements so they never
						// dangle at the end of a wrapped line.
						<div className="vendor-summary-heading">
							<NavigateButton direction="back" />

							<div className="vendor-summary-heading-text">
								<span className="vendor-summary-heading-title">
									{vendorContent.summary.titles.view}
								</span>

								{formContext?.referenceNumber ||
								formContext?.vendorReferenceName ? (
									<span className="vendor-summary-heading-meta">
										{formContext?.referenceNumber ? (
											<span className="vendor-summary-heading-ref">
												{formContext.referenceNumber}
											</span>
										) : null}
										{formContext?.vendorReferenceName ? (
											<span className="vendor-summary-heading-name">
												{formContext.vendorReferenceName}
											</span>
										) : null}
									</span>
								) : null}
							</div>

							<Badge status={formContext?.formStatus} />
						</div>
					) : (
						vendorContent.summary.titles.edit
					)
				}
				className={!isViewMode ? "border-none" : ""}
				actions={
					isViewMode && onboardingId ? (
						<ActionMenu
							size="xs"
							row={onboardingId}
							actions={summaryActions}
							ariaLabel="Vendor onboarding actions"
							triggerLabel="Export"
							triggerVariant="brand"
						/>
					) : null
				}
				sections={sections}
				padding="compact"
				footer={footer}
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
