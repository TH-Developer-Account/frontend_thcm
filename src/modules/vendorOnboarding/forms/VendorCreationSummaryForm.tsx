import { useState, type ReactNode } from "react";
import {
	Building2,
	CircleCheck,
	ClipboardClock,
	FileDown,
	FileCheck2,
	FileSpreadsheet,
	MessageSquareText,
	Pencil,
	Save,
	Send,
	ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";
import Button from "../../../components/common/Button";
import Card, { type CardSection } from "../../../components/common/Card";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { ReasonActionModal } from "../../../components/ui/ReasonActionModal";
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
	onApprove?: () => void | Promise<void>;
	onClarify?: () => void | Promise<void>;
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
	const resolvedOnApprove = onApprove ?? formContext?.handleApprove;
	const resolvedOnClarify = onClarify ?? formContext?.handleClarify;
	const resolvedOnAcceptAndClose =
		onAcceptAndClose ?? formContext?.handleAcceptAndClose;
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
	const isActionLoading = resolvedLoading || resolvedVendorCodeLoading;
	const isViewMode = mode === "view";

	const handleEdit = () => {
		if (!onboardingId) return;

		navigate(`/vendor/onboarding/${onboardingId}`);
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
		reasonModal,
		canActOnCurrentStage,
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

	const showApproveAction =
		resolvedCanApprove && typeof resolvedOnApprove === "function";

	const showClarifyAction =
		resolvedCanClarify && typeof resolvedOnClarify === "function";

	const showSendBackAction =
		resolvedCanSendBack && typeof onHandleSendBackVendor === "function";

	const showAcceptAndCloseAction =
		resolvedCanAcceptAndClose && typeof resolvedOnAcceptAndClose === "function";

	const hasApprovalActions =
		(canActOnCurrentStage && (showApproveAction || showClarifyAction)) ||
		showSendBackAction ||
		showAcceptAndCloseAction;
	const showButtons =
		showSendBackAction || showSubmitAction || hasApprovalActions;
	const sections: CardSection[] = [
		{
			id: "vendor-submitted-details",
			title: vendorContent.summary.sections.vendorSubmittedDetails,
			// subtitle: "Review the vendor information and uploaded documents.",
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
			// subtitle: "Review the THCM classification and vendor master details.",
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
			// subtitle: "Review the assigned approval stages and their current status.",
			Icon: ClipboardClock,
			defaultExpanded: true,
			children:
				workflowSection ??
				(resolvedWorkflowStages.length > 0 ? (
					<div className="px-4">
						{" "}
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
						// subtitle: "Review the discussion and audit history.",
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
						// subtitle: "Review the discussion and audit history.",
						Icon: MessageSquareText,
						defaultExpanded: true,
						children: auditSection,
					} satisfies CardSection,
				]
			: []),
	];

	const footer = showButtons && (
		<div className="vendor-onboarding-form-actions flex justify-between">
			<Button
				type="button"
				text={vendorContent.buttons.back}
				size="sm"
				appearance="standard"
				variant="outline"
				Icon={ArrowLeft}
				onClick={resolvedOnBack}
			/>{" "}
			<div className="vendor-onboarding-form-actions-end">
				{canActOnCurrentStage && showClarifyAction ? (
					<Button
						type="button"
						text={vendorContent.buttons.sendForClarification}
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={isActionLoading || reasonModal.loading}
						onClick={openReasonModal}
					/>
				) : null}
				{canActOnCurrentStage && showApproveAction ? (
					<Button
						type="button"
						text={vendorContent.buttons.approve}
						size="sm"
						appearance="standard"
						variant="brand"
						disabled={isActionLoading || reasonModal.loading}
						onClick={() => void handleApprove()}
					/>
				) : null}
				{showAcceptAndCloseAction ? (
					<Button
						type="button"
						text={vendorContent.buttons.acceptAndClose}
						size="sm"
						Icon={CircleCheck}
						appearance="standard"
						variant="brand"
						disabled={isActionLoading || reasonModal.loading}
						onClick={() => void resolvedOnAcceptAndClose?.()}
					/>
				) : null}
				{showSendBackAction ? (
					<Button
						type="button"
						text={vendorContent.buttons.sendBackToVendor}
						size="sm"
						appearance="standard"
						variant="outline"
						Icon={Send}
						disabled={isActionLoading || reasonModal.loading}
						onClick={() => void onHandleSendBackVendor?.()}
					/>
				) : null}
				{showSubmitAction ? (
					<Button
						type="button"
						text={vendorContent.buttons.finalSubmit}
						size="sm"
						appearance="standard"
						variant="brand"
						Icon={Save}
						disabled={isActionLoading || reasonModal.loading}
						onClick={() => void resolvedOnSubmit?.()}
					/>
				) : null}
			</div>
		</div>
	);

	return (
		<div className="vendor-summary-form">
			<Card
				title={
					isViewMode ? (
						<div className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight text-iron-dark">
							<NavigateButton direction="back" />
							<span>{vendorContent.summary.titles.view}</span>
							{formContext?.referenceNumber && (
								<span>/ {formContext?.referenceNumber} /</span>
							)}
							{formContext?.vendorReferenceName ? (
								<span> {formContext?.vendorReferenceName} /</span>
							) : (
								"Reference Name /"
							)}
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
				// subtitle="Review the complete request before taking the final action."
				sections={sections}
				padding="compact"
				footer={footer}
			/>

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
