import { type ChangeEvent, useState } from "react";
import {
	ArrowLeft,
	BadgeIndianRupee,
	CheckCircle2,
	Eye,
	FileDown,
	FilePenLine,
	FileSpreadsheet,
	GitBranch,
	Lock,
	MessageSquareText,
	RefreshCcw,
	Save,
	Stethoscope,
} from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card, { type CardSection } from "../../../components/common/Card";
import DatePickerInput from "../../../components/common/DatePickerInput";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
import Radio from "../../../components/forms/Radio";
import SelectInput from "../../../components/forms/SelectInput";
import {
	COVERAGE_OPTIONS,
	ReimbursementClaimFormContext,
	currencyFormatter,
	toDatePickerValue,
	toDateString,
	useReimbursementClaimForm,
	useReimbursementClaimFormContext,
	type UseReimbursementClaimFormArgs,
} from "../hooks/useReimbursementClaimForm";
import ClaimHeadEntryTable from "./ClaimHeadEntryTable";
import EligibilitySidePanel from "./EligibilitySidePanel";
import PdfPreviewModal from "./PdfPreviewModal";
import NavigateButton from "../../../components/common/NavigateButton";
import type { ActionMenuItem } from "../../../components/common/ActionMenu";
import ActionMenu from "../../../components/common/ActionMenu";
import { Alert } from "../../../components/common/Alert";
import type { AlertVariant } from "../../../components/common/common.types";
import { formatDate } from "../../../utils/format";
import { MEDICLAIM_BACKEND } from "../utils/mediclaimBackend.config";
import { MAX_REASON_LENGTH } from "../utils/reimbursementClaim.schemas";
// Shared approve / clarify footer. Adjust this path if the component lives
// elsewhere in your repo (it imports ../forms/TextareaInput + ../common/Button).
import ApprovalActionsBar from "../../../components/ui/ApprovalActionsBar";

export type StatusBanner = {
	variant: AlertVariant;
	title: string;
	description: string;
};

export type ReimbursementClaimFormProps = UseReimbursementClaimFormArgs & {
	claimId?: string;
	isExportingExcel?: boolean;
	handleExport?: () => void | Promise<void>;
	isPreparingPdf?: boolean;
	isDownloadingPdf?: boolean;
	handleViewPdf?: () => void | Promise<void>;
	handleDownloadPdf?: () => void | Promise<void>;
	/** Signed URL of the PDF being previewed (null = modal closed). */
	pdfUrl?: string | null;
	onClosePdfPreview?: () => void;
	statusBanner?: StatusBanner;
	showAlertBanner?: boolean;
};

type ReimbursementClaimFormContentProps = Omit<
	ReimbursementClaimFormProps,
	keyof UseReimbursementClaimFormArgs | "showAlertBanner" | "statusBanner"
> & { statusBanner?: StatusBanner | null };

// One footer action can be pending at a time. approve/clarify share a reason
// textarea; close is a plain confirmation.
// Approve / clarify go through ApprovalActionsBar (it owns the reason box);
// only "close" still needs a local confirmation step.
type PendingFooterAction = "close" | null;

const ReimbursementClaimFormContent = ({
	claimId,
	isExportingExcel,
	handleExport,
	isPreparingPdf,
	isDownloadingPdf,
	handleViewPdf,
	handleDownloadPdf,
	pdfUrl,
	onClosePdfPreview,
	statusBanner,
}: ReimbursementClaimFormContentProps) => {
	const {
		values,
		errors,
		referenceNumber,
		isLoading,
		isSubmitting,
		isSavingDraft,
		gradeOptions,
		selectedGrade,
		isGradeLocked,
		lineItemsTotal,
		isReadOnly,
		canEditClaimForm,
		fieldMode,
		claimStatusLabel,
		canCompleteStage,
		savedClaims,
		mode,
		canApprove,
		canClarify,
		canClose,
		isClosing,
		correctionReason,
		isExternalApprover,
		approvalActionLoading,
		onBack,
		submittedMessage,
		actionText,
		commentsSection,
		auditSection,
		workflowSection,
		hasSubmitAction,
		hasSaveDraftAction,
		hasApproveStageAction,
		hasClarifyStageAction,
		hasCloseAction,
		handleChange,
		handleSubmit,
		handleSaveDraft,
		handleReset,
		clarifyLoading,
		buildClarifyReasonPrefix,
		handleClarifyConfirm,
		handleApproveStage,
		handleCloseClaim,
	} = useReimbursementClaimFormContext();

	const [pendingAction, setPendingAction] = useState<PendingFooterAction>(null);
	const [isConfirming, setIsConfirming] = useState(false);

	const isReasonFlowOpen = pendingAction !== null;
	const isReasonBusy =
		clarifyLoading || approvalActionLoading || isConfirming || isClosing;

	const openFooterAction = (action: PendingFooterAction) => {
		setPendingAction(action);
	};

	const cancelFooterAction = () => {
		if (isReasonBusy) return;
		setPendingAction(null);
	};

	const handleFooterConfirm = async () => {
		if (pendingAction !== "close") return;
		setIsConfirming(true);
		try {
			await handleCloseClaim?.();
			setPendingAction(null);
		} catch {
			// The page-level handler already showed an error toast.
		} finally {
			setIsConfirming(false);
		}
	};

	// ApprovalActionsBar validates the reason length and clears it on
	// success. The page handlers toast their own errors, so failures are
	// swallowed here (the bar fires these without a catch).
	const approveFromBar = async (reason: string) => {
		try {
			await handleApproveStage(reason);
		} catch {
			/* toasted by the page */
		}
	};

	// The claimant should see exactly which bills to fix, so the flagged
	// bills (with the approver's remarks) are appended to the typed reason.
	const clarifyFromBar = async (reason: string) => {
		const flagged = buildClarifyReasonPrefix();
		try {
			await handleClarifyConfirm(flagged ? `${reason}\n\n${flagged}` : reason);
		} catch {
			/* toasted by the page */
		}
	};

	const showSpouse =
		values.coverageType === "SPOUSE" || values.coverageType === "BOTH";

	// Employee details + coverage sit at the top of the card, without their
	// own collapsible sections.
	// Top of the card: employee + coverage fields on the left, eligibility
	// panel on the right (stacks below the fields on small screens), all
	// above the Claim Heads table.
	// `w-full` makes the grid span the whole card even when the parent
	// secondary-header is a flex container.
	const headerFields = (
		<div className="grid w-full grid-cols-1 gap-5 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_420px]">
			{/* Employee / claim information */}
			<div className="min-w-0">
				<div className="mb-4 flex items-center gap-2">
					<div className="h-4 w-1 rounded-full bg-orange-500" />
					<h3 className="text-sm font-semibold text-iron-dark">
						Employee Details
					</h3>
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 2xl:grid-cols-3">
					<FormInput
						mode="view"
						name="employeeName"
						label="Name of Employee"
						value={values.employeeName}
						readOnly
						error={errors.employeeName}
					/>

					<FormInput
						mode="view"
						name="ticketNumber"
						label="Ticket Number"
						value={values.ticketNumber || "--"}
						readOnly
						helperText={
							canEditClaimForm
								? "Set by HR. Contact HR if this is wrong."
								: undefined
						}
					/>

					<SelectInput
						mode={isGradeLocked ? "view" : fieldMode}
						name="grade"
						label="Grade"
						placeholder="Select grade"
						options={gradeOptions.map(({ label, value }) => ({
							label,
							value,
						}))}
						value={
							selectedGrade
								? {
										label: selectedGrade.label,
										value: selectedGrade.value,
									}
								: null
						}
						error={errors.grade}
						onChange={(option) => {
							if (!isGradeLocked) {
								handleChange("grade", option?.value ?? "");
							}
						}}
					/>

					<FormInput
						mode={fieldMode}
						name="location"
						label="Location"
						value={values.location}
						required={canEditClaimForm}
						maxLength={100}
						error={errors.location}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("location", event.target.value)
						}
					/>

					<Radio
						groupLabel="Coverage Type"
						name="coverageType"
						options={COVERAGE_OPTIONS}
						selectedValue={values.coverageType}
						disabled={isReadOnly}
						error={errors.coverageType}
						required
						onChange={(value) =>
							handleChange(
								"coverageType",
								value as (typeof COVERAGE_OPTIONS)[number]["value"],
							)
						}
					/>

					{showSpouse ? (
						<FormInput
							mode={fieldMode}
							name="spouseName"
							label="Spouse Name"
							value={values.spouseName}
							required={canEditClaimForm}
							maxLength={100}
							error={errors.spouseName}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								handleChange("spouseName", event.target.value)
							}
						/>
					) : null}
				</div>
			</div>

			{/* Eligibility summary */}
			<EligibilitySidePanel className="min-w-0 xl:self-stretch" />
		</div>
	);

	const sections: CardSection[] = [
		{
			id: "claim-heads",
			title: "Claim Heads",
			Icon: Stethoscope,
			actions: (
				<span className="text-sm font-semibold text-iron-dark">
					Claimed total: {currencyFormatter.format(lineItemsTotal)}
				</span>
			),
			defaultExpanded: true,
			children: <ClaimHeadEntryTable />,
		},
		...(mode === "edit" && canEditClaimForm
			? [
					{
						id: "declaration-signature",
						title: "Declaration and Signature",
						Icon: BadgeIndianRupee,
						defaultExpanded: true,
						children: (
							<div className="flex flex-col gap-3 px-4.5">
								<p className="text-sm leading-6 text-iron">
									I confirm that I have kept the Company informed in writing of
									all changes in the status of my dependants covered under the
									Health Scheme. I declare that the information provided in this
									claim is true and complete in every respect.
								</p>
								<Checkbox
									name="declarationAccepted"
									className="shrink-0"
									checked={values.declarationAccepted}
									disabled={isReadOnly || isLoading}
									onChange={(checked) =>
										handleChange("declarationAccepted", checked)
									}
									label="I confirm and accept the declaration above."
									error={errors.declarationAccepted}
								/>
								<div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
									<DatePickerInput
										label="Date"
										mode="single"
										value={toDatePickerValue(values.claimDate)}
										onChange={(nextValue) => {
											if (nextValue instanceof Date) {
												handleChange("claimDate", toDateString(nextValue));
											}
										}}
										error={errors.claimDate}
										placeholder="Date"
										disabled={isReadOnly}
										toDate={new Date()}
									/>
								</div>
							</div>
						),
					},
				]
			: values.declarationAccepted
				? [
						{
							id: "declaration-signature",
							title: "Declaration",
							Icon: BadgeIndianRupee,
							defaultExpanded: false,
							children: (
								<p className="flex items-center gap-2 px-4.5 text-sm text-iron">
									<CheckCircle2
										aria-hidden="true"
										size={16}
										className="shrink-0"
									/>
									Declaration accepted
									{values.employeeSignature
										? ` by ${values.employeeSignature}`
										: ""}
									{values.claimDate
										? ` on ${formatDate(values.claimDate)}`
										: ""}
									.
								</p>
							),
						},
					]
				: []),
		...(workflowSection
			? [
					{
						id: "approval-workflow",
						title: "Approval Workflow",
						Icon: GitBranch,
						defaultExpanded: true,
						children: workflowSection,
					},
				]
			: []),
		...(commentsSection
			? [
					{
						id: "chat",
						title: "Chat Section",
						Icon: MessageSquareText,
						defaultExpanded: true,
						children: commentsSection,
					},
				]
			: []),
		...(auditSection
			? [
					{
						id: "audit",
						title: "Audit Messages",
						Icon: MessageSquareText,
						defaultExpanded: true,
						children: auditSection,
					},
				]
			: []),
	];

	const canShowClose = canClose && hasCloseAction;
	const showButtons =
		canEditClaimForm || canApprove || canClarify || canShowClose;

	const claimActions: ActionMenuItem<string>[] = [
		...(handleViewPdf
			? [
					{
						id: "view-pdf",
						label: isPreparingPdf ? "Preparing…" : "View PDF",
						Icon: Eye,
						onClick: () => void handleViewPdf(),
						disabled: isPreparingPdf || isDownloadingPdf,
					},
				]
			: []),
		...(handleDownloadPdf
			? [
					{
						id: "download-pdf",
						label: isDownloadingPdf ? "Downloading…" : "Download PDF",
						Icon: FileDown,
						onClick: () => void handleDownloadPdf(),
						disabled: isDownloadingPdf || isPreparingPdf,
					},
				]
			: []),
		...(handleExport
			? [
					{
						id: "export-excel",
						label: isExportingExcel ? "Exporting…" : "Excel",
						Icon: FileSpreadsheet,
						onClick: () => void handleExport(),
						disabled: Boolean(isExportingExcel),
					},
				]
			: []),
	];

	const approveLabel = isExternalApprover
		? MEDICLAIM_BACKEND.externalApproverClose
			? "OK and Close"
			: "OK"
		: "Approve";
	// Approve stays visible but disabled until every line item is approved.
	const approveBlocked =
		canApprove && hasApproveStageAction && !canCompleteStage;
	const approveBlockedMessage = `Approve every line item to enable ${approveLabel}.`;
	const approvedLineItemCount = savedClaims.filter(
		(item) => item.approvalStatus === "APPROVED",
	).length;

	const isApproverFooter =
		(canApprove && hasApproveStageAction) ||
		(canClarify && hasClarifyStageAction);

	return (
		<div className="flex flex-col gap-3">
			<form
				className="flex min-w-0 flex-col gap-2"
				noValidate
				onSubmit={(event) => event.preventDefault()}
			>
				{statusBanner ? (
					<Alert
						key={`${statusBanner.title}-${statusBanner.description ?? ""}`}
						type="banner"
						variant={statusBanner.variant}
						title={statusBanner.title}
						description={statusBanner.description}
						dismissible
					/>
				) : null}
				{correctionReason ? (
					<Alert
						type="banner"
						variant="warning"
						title="Changes requested by the approver"
						description={correctionReason}
					/>
				) : null}
				<Card
					title={
						<div className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight text-iron-dark">
							<NavigateButton direction="back" />
							{referenceNumber ? <span>{referenceNumber}</span> : null}
							<Badge status={claimStatusLabel} />
						</div>
					}
					actions={
						claimId && claimActions.length ? (
							<ActionMenu
								size="xs"
								row={claimId}
								actions={claimActions}
								ariaLabel="Reimbursement claim actions"
								triggerLabel="Export"
								triggerVariant="brand"
							/>
						) : null
					}
					footer={
						showButtons && (
							<div className="flex w-full flex-col gap-3">
								{isReasonFlowOpen ? (
									<div className="flex w-full flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
										<p className="flex-1 text-sm text-iron">
											Close this approved claim? Closed claims are final and can
											no longer be changed.
										</p>
										<div className="flex shrink-0 gap-2">
											<Button
												type="button"
												text="Cancel"
												size="sm"
												appearance="standard"
												variant="outline"
												disabled={isReasonBusy}
												onClick={cancelFooterAction}
											/>
											<Button
												type="button"
												text={isReasonBusy ? "Closing…" : "Close Claim"}
												Icon={Lock}
												size="sm"
												appearance="standard"
												variant="brand"
												disabled={isReasonBusy}
												onClick={() => void handleFooterConfirm()}
											/>
										</div>
									</div>
								) : isApproverFooter ? (
									<>
										{approveBlocked ? (
											<Alert
												type="banner"
												variant="warning"
												title={approveBlockedMessage}
												description={`${approvedLineItemCount} of ${savedClaims.length} line items approved. Approve or adjust the rest to finish this stage.`}
											/>
										) : null}
										<ApprovalActionsBar
											variant="approver"
											showBack={Boolean(onBack)}
											onBack={onBack}
											canApprove={canApprove && hasApproveStageAction}
											approveDisabled={approveBlocked}
											approveDisabledReason={approveBlockedMessage}
											canClarify={canClarify && hasClarifyStageAction}
											onApprove={approveFromBar}
											onClarify={clarifyFromBar}
											approveLabel={approveLabel}
											clarifyLabel="Send for Clarification"
											loading={isReasonBusy}
											maxReasonLength={MAX_REASON_LENGTH}
											reasonPlaceholder={
												canClarify
													? "Reason for approval, or what the claimant should correct"
													: "Add a reason (at least 3 characters)"
											}
										/>
									</>
								) : canShowClose ? (
									<ApprovalActionsBar
										variant="proposer"
										showBack={Boolean(onBack)}
										onBack={onBack}
										canAcceptAndClose
										onAcceptAndClose={() => openFooterAction("close")}
										acceptAndCloseLabel="Close Claim"
										loading={isReasonBusy}
									/>
								) : (
									<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
										<div>
											{onBack ? (
												<Button
													type="button"
													text="Back"
													Icon={ArrowLeft}
													size="sm"
													appearance="standard"
													variant="outline"
													disabled={isLoading}
													onClick={onBack}
												/>
											) : null}
										</div>

										{canEditClaimForm ? (
											<div className="flex flex-col gap-2 sm:flex-row">
												<Button
													type="button"
													text="Reset"
													Icon={RefreshCcw}
													size="sm"
													appearance="standard"
													variant="outline"
													disabled={isLoading}
													onClick={handleReset}
												/>
												{hasSaveDraftAction ? (
													<Button
														type="button"
														text={isSavingDraft ? "Saving..." : "Save as Draft"}
														Icon={FilePenLine}
														size="sm"
														appearance="standard"
														variant="outline"
														disabled={isLoading}
														onClick={() => void handleSaveDraft()}
													/>
												) : null}
												{hasSubmitAction ? (
													<Button
														type="button"
														text={isSubmitting ? "Submitting..." : actionText}
														Icon={Save}
														size="sm"
														appearance="standard"
														variant="brand"
														disabled={isLoading}
														onClick={() => void handleSubmit()}
													/>
												) : null}
											</div>
										) : null}
									</div>
								)}
							</div>
						)
					}
					secondaryHeader={
						<div className="flex w-full min-w-0 flex-col gap-3">
							{submittedMessage ? (
								<div
									className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-iron"
									role="status"
								>
									<CheckCircle2
										aria-hidden="true"
										className="shrink-0"
										size={18}
									/>
									<span>{submittedMessage}</span>
								</div>
							) : null}
							{headerFields}
						</div>
					}
					sections={sections}
					padding="none"
				/>
			</form>

			<PdfPreviewModal
				url={pdfUrl ?? null}
				title={
					referenceNumber ? `Medical claim ${referenceNumber}` : "Medical claim"
				}
				onClose={onClosePdfPreview}
			/>
		</div>
	);
};

const ReimbursementClaimForm = (props: ReimbursementClaimFormProps) => {
	const {
		claimId,
		isExportingExcel,
		handleExport,
		isPreparingPdf,
		isDownloadingPdf,
		handleViewPdf,
		handleDownloadPdf,
		pdfUrl,
		onClosePdfPreview,
		statusBanner,
		showAlertBanner,
		...formArgs
	} = props;

	const controller = useReimbursementClaimForm(formArgs);

	return (
		<ReimbursementClaimFormContext.Provider value={controller}>
			<ReimbursementClaimFormContent
				claimId={claimId}
				isExportingExcel={isExportingExcel}
				handleExport={handleExport}
				isPreparingPdf={isPreparingPdf}
				isDownloadingPdf={isDownloadingPdf}
				handleViewPdf={handleViewPdf}
				handleDownloadPdf={handleDownloadPdf}
				pdfUrl={pdfUrl}
				onClosePdfPreview={onClosePdfPreview}
				statusBanner={showAlertBanner ? statusBanner : null}
			/>
		</ReimbursementClaimFormContext.Provider>
	);
};

export default ReimbursementClaimForm;
