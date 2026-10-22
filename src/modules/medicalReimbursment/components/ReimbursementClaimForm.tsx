import { type ChangeEvent, type ReactNode, useState } from "react";
import {
	ArrowLeft,
	BadgeIndianRupee,
	CheckCircle2,
	Eye,
	FileDown,
	FilePenLine,
	FileSpreadsheet,
	History,
	Lock,
	RefreshCcw,
	Save,
} from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import DatePickerInput from "../../../components/common/DatePickerInput";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
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
import { TabsBar } from "../../../components/common/TabsBar";
import type { TabItem } from "../../../components/common/common.types";
import type { ActionMenuItem } from "../../../components/common/ActionMenu";
import ActionMenu from "../../../components/common/ActionMenu";
import { Alert } from "../../../components/common/Alert";
import type { AlertVariant } from "../../../components/common/common.types";
import { formatDate } from "../../../utils/format";
import { MEDICLAIM_BACKEND } from "../utils/mediclaimBackend.config";
import DetailPageLayout from "../../../layout/DetailPageLayout";
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

// Page tabs. "workflow" and "chat" only exist when the page supplies them.
// Order: employee details → eligibility → claim heads → workflow → chat.
type ClaimTab = "employee" | "eligibility" | "heads" | "workflow" | "chat";

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
	const [activeTab, setActiveTab] = useState<ClaimTab>("employee");

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

	const employeeName = values.employeeName.trim();
	const avatarInitial = (employeeName[0] ?? "?").toUpperCase();
	const gradeLabel = selectedGrade?.label ?? values.grade;
	// Grade comes from HR when on record; only a claim without one can pick it.
	const showGradeSelect = !isGradeLocked && canEditClaimForm;

	// Employee tab: avatar, name, HR-set chips, then the fields the claimant
	// fills (coverage, grade, spouse, location).
	const headerFields = (
		<div className="flex w-full flex-col gap-4">
			{/* Employee card */}
			<section aria-label="Employee details" className="min-w-0 ">
				<div className="grid grid-cols-1 gap-x-5 gap-y-4 border-t border-slate-200 px-5 py-4 md:grid-cols-3">
					{/* Set by HR: also shown as inputs (the badges above stay). */}
					<FormInput
						mode="view"
						name="ticketNumber"
						label="Ticket Number"
						value={values.ticketNumber || "--"}
						onChange={() => undefined}
					/>

					{showGradeSelect ? (
						<SelectInput
							mode={fieldMode}
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
							onChange={(option) => handleChange("grade", option?.value ?? "")}
						/>
					) : null}

					{/* Grade already on record (set by HR): read-only input. */}
					{!showGradeSelect ? (
						<FormInput
							mode="view"
							name="grade"
							label="Grade"
							value={gradeLabel || "--"}
							onChange={() => undefined}
						/>
					) : null}
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
					{/* Coverage type — segmented control */}
					<div className="flex flex-col gap-1.5">
						<span
							id="coverage-type-label"
							className="text-sm font-medium text-iron-dark"
						>
							Coverage type
							{canEditClaimForm ? (
								<span className="text-red-500"> *</span>
							) : null}
						</span>
						<div
							role="radiogroup"
							aria-labelledby="coverage-type-label"
							aria-invalid={Boolean(errors.coverageType)}
							className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
						>
							{COVERAGE_OPTIONS.map((option) => {
								const selected = values.coverageType === option.value;
								return (
									<button
										key={option.value}
										type="button"
										role="radio"
										aria-checked={selected}
										disabled={isReadOnly}
										onClick={() => handleChange("coverageType", option.value)}
										className={`rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed ${
											selected
												? "bg-white font-semibold text-orange-600 shadow-sm"
												: "font-medium text-slate-500 hover:text-iron-dark"
										} ${isReadOnly && !selected ? "opacity-60" : ""}`}
									>
										{option.label}
									</button>
								);
							})}
						</div>
						{errors.coverageType ? (
							<p role="alert" className="text-xs text-red-600">
								{errors.coverageType}
							</p>
						) : null}
					</div>

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
			</section>
		</div>
	);

	// Eligibility summary: its own tab.
	const eligibilityPanel = <EligibilitySidePanel className="min-w-0" />;

	// Declaration: editable checkbox while drafting, one-line summary afterwards.
	const declarationBody: ReactNode =
		mode === "edit" && canEditClaimForm ? (
			<section
				aria-label="Declaration and signature"
				className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4"
			>
				<h3 className="flex items-center gap-2 text-sm font-semibold text-brand">
					<BadgeIndianRupee size={16} aria-hidden="true" />
					Declaration and Signature
				</h3>
				<p className="text-sm leading-6 text-iron">
					I confirm that I have kept the Company informed in writing of all
					changes in the status of my dependants covered under the Health
					Scheme. I declare that the information provided in this claim is true
					and complete in every respect.
				</p>
				<Checkbox
					name="declarationAccepted"
					className="shrink-0"
					checked={values.declarationAccepted}
					disabled={isReadOnly || isLoading}
					onChange={(checked) => handleChange("declarationAccepted", checked)}
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
			</section>
		) : values.declarationAccepted ? (
			<p className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-iron">
				<CheckCircle2 aria-hidden="true" size={16} className="shrink-0" />
				Declaration accepted
				{values.employeeSignature ? ` by ${values.employeeSignature}` : ""}
				{values.claimDate ? ` on ${formatDate(values.claimDate)}` : ""}.
			</p>
		) : null;

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

	// Staff view (an audit trail is supplied): the audit trail renders in a
	// side column and the approver / close actions sit BELOW it, like the
	// activity form view. Claimant forms (public, guest) pass no audit section,
	// so they keep every action in the card footer, exactly as before.
	const hasSidePanel = Boolean(auditSection);
	const showSideActions = hasSidePanel && (isApproverFooter || canShowClose);

	/** "Close this approved claim?" confirmation. `stacked` = narrow side column. */
	const renderCloseConfirm = (stacked: boolean) => (
		<div
			className={`flex w-full flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 ${
				stacked ? "" : "sm:flex-row sm:items-center"
			}`}
		>
			<p className="flex-1 text-sm text-iron">
				Close this approved claim? Closed claims are final and can no longer be
				changed.
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
	);

	/** Approve / Send for Clarification. `card` = side-column card layout. */
	const renderApproverActions = (card: boolean) => (
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
				{...(card ? { layout: "card" as const } : {})}
				showBack={card ? false : Boolean(onBack)}
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
	);

	/** Close Claim (initiator / external approver once APPROVED). */
	const renderCloseBar = (card: boolean) => (
		<ApprovalActionsBar
			variant="proposer"
			showBack={card ? false : Boolean(onBack)}
			onBack={onBack}
			canAcceptAndClose
			onAcceptAndClose={() => openFooterAction("close")}
			acceptAndCloseLabel="Close Claim"
			loading={isReasonBusy}
		/>
	);

	/** Claimant buttons: Back, Reset, Save as Draft, Submit. */
	const editButtons = (
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
	);

	// Card footer. With a side column, approver / close actions live there, so
	// the footer only keeps the claimant buttons (when the form is editable).
	let footerContent: ReactNode = null;
	if (showSideActions) {
		footerContent = canEditClaimForm ? editButtons : null;
	} else if (isReasonFlowOpen) {
		footerContent = renderCloseConfirm(false);
	} else if (isApproverFooter) {
		footerContent = renderApproverActions(false);
	} else if (canShowClose) {
		footerContent = renderCloseBar(false);
	} else {
		footerContent = editButtons;
	}

	// Content of the side column. The <aside> itself is DetailPageLayout.Side.
	const sidePanelContent = hasSidePanel ? (
		<>
			<Card
				accordion
				defaultExpanded
				title={
					<span className="inline-flex items-center gap-2 text-sm font-semibold text-iron-dark">
						<History size={15} aria-hidden="true" />
						Audit Trail
					</span>
				}
				padding="none"
				bodyClassName="max-h-[26rem] overflow-y-auto"
			>
				{auditSection}
			</Card>

			{/* ALL actions live BELOW the audit trail. */}
			{showSideActions ? (
				isReasonFlowOpen ? (
					renderCloseConfirm(true)
				) : isApproverFooter ? (
					renderApproverActions(true)
				) : (
					<section className="approval-decision-card" aria-label="Your actions">
						<div className="approval-decision-card-head">
							<span className="approval-decision-card-eyebrow">
								Your actions
							</span>
						</div>
						{renderCloseBar(true)}
					</section>
				)
			) : null}
		</>
	) : null;

	/* ------------------------------------------------------------------ */
	/*                              Tabs                                  */
	/* ------------------------------------------------------------------ */

	const claimTabs: TabItem<ClaimTab>[] = [
		{ value: "employee", label: "Employee Details" },
		{ value: "eligibility", label: "Eligibility" },
		{ value: "heads", label: "Claim Heads" },
		...(workflowSection
			? [{ value: "workflow" as const, label: "Approval Workflow" }]
			: []),
		...(commentsSection ? [{ value: "chat" as const, label: "Chat" }] : []),
	];

	// A tab that disappears (e.g. after a refresh) falls back to the first one.
	const currentTab: ClaimTab = claimTabs.some((tab) => tab.value === activeTab)
		? activeTab
		: "employee";

	// Editable tabs carry the same footer (claimant buttons / approver actions).
	const cardFooter =
		showButtons && footerContent ? (
			<div className="flex w-full flex-col gap-3">{footerContent}</div>
		) : undefined;

	// A render helper, NOT an inner component: an inner component gets a new
	// identity every render and would remount (wiping the form's input state).
	const renderTab = (): ReactNode => {
		switch (currentTab) {
			case "employee":
				return (
					<Card
						key="employee"
						title={
							<div className="flex items-center gap-4 px-5 py-4">
								<div
									aria-hidden="true"
									className="grid size-12 shrink-0 place-items-center rounded-full bg-slate-800 text-lg font-semibold text-white"
								>
									{avatarInitial}
								</div>

								<div className="min-w-0">
									<h3
										className="truncate text-lg font-semibold leading-tight text-iron-dark"
										title={employeeName || undefined}
									>
										{employeeName || "--"}
									</h3>

									{errors.employeeName ? (
										<p role="alert" className="mt-0.5 text-xs text-red-600">
											{errors.employeeName}
										</p>
									) : null}

									<div className="mt-1.5 flex flex-wrap items-center gap-2">
										<Badge variant={"pending"}>
											Ticket {values.ticketNumber || "--"}
										</Badge>

										{gradeLabel && !showGradeSelect ? (
											<Badge variant={"success"}>Grade {gradeLabel}</Badge>
										) : null}
										{values.ticketNumber || isGradeLocked ? (
											<Badge variant={"danger"}> Set by HR</Badge>
										) : null}
									</div>
								</div>
							</div>
						}
						padding="none"
						footer={cardFooter}
					>
						<div className="flex flex-col gap-4 p-4">
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
					</Card>
				);

			case "eligibility":
				return <div>{eligibilityPanel}</div>;

			// Claim heads, then the declaration the claimant accepts before
			// submitting (the footer's Submit lives on this tab).
			case "heads":
				return (
					<Card
						key="heads"
						title="Claim Heads"
						padding="none"
						actions={
							<span className="text-sm font-semibold text-iron-dark">
								Claimed total: {currencyFormatter.format(lineItemsTotal)}
							</span>
						}
						footer={cardFooter}
					>
						<div className="flex flex-col gap-4 p-4">
							<ClaimHeadEntryTable />
							{declarationBody}
						</div>
					</Card>
				);

			case "workflow":
				return (
					<Card key="workflow" title="Approval Workflow" padding="none">
						<div className="p-4">{workflowSection}</div>
					</Card>
				);

			// Same treatment as the activity page's Comments tab: one card, the
			// comments panel borderless inside it.
			case "chat":
				return (
					<Card key="chat" title="Chat" padding="default">
						<div className="comments-chat">{commentsSection}</div>
					</Card>
				);
		}
	};

	return (
		<>
			<DetailPageLayout>
				{/* ── Header above the two columns: back + reference + status (left),
				    export menu (right) ── */}
				<DetailPageLayout.Header
					back={<NavigateButton direction="back" />}
					title={referenceNumber || "Medical claim"}
					badge={<Badge status={claimStatusLabel} />}
					subtitle={employeeName || undefined}
				>
					<div className="flex items-center gap-3">
						<TabsBar<ClaimTab>
							items={claimTabs}
							active={currentTab}
							onChange={setActiveTab}
							variant="soft"
							ariaLabel="Claim sections"
						/>
						{claimId && claimActions.length ? (
							<ActionMenu
								size="xs"
								row={claimId}
								actions={claimActions}
								ariaLabel="Reimbursement claim actions"
								triggerLabel="Export"
								triggerVariant="brand"
							/>
						) : null}
					</div>
				</DetailPageLayout.Header>

				<DetailPageLayout.Body>
					{/* ── Main: the claim form card ── */}
					<DetailPageLayout.Main>
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
							{renderTab()}
						</form>
					</DetailPageLayout.Main>

					{/* ── Side: staff view only (audit trail supplied). Claimant /
					    guest forms pass no auditSection → no side column and Main
					    is full width, exactly as before. ── */}
					{hasSidePanel && (
						<DetailPageLayout.Side
							label="Audit trail and decision"
							width="380px"
							// Natural height, pinned from xl up (the layout's default
							// sticky mode is full-viewport-height — not wanted here).
							sticky={false}
							className="xl:sticky xl:top-3 xl:self-start"
						>
							{sidePanelContent}
						</DetailPageLayout.Side>
					)}
				</DetailPageLayout.Body>
			</DetailPageLayout>

			<PdfPreviewModal
				url={pdfUrl ?? null}
				title={
					referenceNumber ? `Medical claim ${referenceNumber}` : "Medical claim"
				}
				onClose={onClosePdfPreview}
			/>
		</>
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
