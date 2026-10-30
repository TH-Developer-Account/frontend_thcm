import { useState, type ReactNode } from "react";
import {
	ClipboardClock,
	FileDown,
	FileSpreadsheet,
	History,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";
import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import NavigateButton from "../../../components/common/NavigateButton";
import { TabsBar } from "../../../components/common/TabsBar";
import type { TabItem } from "../../../components/common/common.types";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { AuditLogSection } from "../../../components/ui/audit";
import { CommentsSection } from "../../../components/ui/comments";
import DetailPageLayout from "../../../layout/DetailPageLayout";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { ApprovalWorkflowTableContent } from "../../workflows";
import ClaimActions from "../components/ClaimActions";
import ClaimEligibilityLedger from "../components/ClaimEligibilityLedger";
import ClaimEmployeeCard from "../components/ClaimEmployeeCard";
import ClaimFormAlerts from "../components/ClaimFormAlerts";
import ClaimHeadsCard from "../components/ClaimHeadsCard";
import ReimbursementClaimForm from "../components/ReimbursementClaimForm";
import { useReimbursementClaimFormContext } from "../hooks/useReimbursementClaimForm";
import { useMedicalClaimView } from "../hooks/useMedicalClaimView";
import type { ReimbursementClaimFormMode } from "../types/reimbursementClaim.types";

/* -------------------------------------------------------------------------- */
/*                  INTERNAL VIEW layout (tabs + audit side column)           */
/* -------------------------------------------------------------------------- */

// Order: employee details (+ eligibility ledger) → claim heads → workflow → chat.
type ClaimTab = "employee" | "heads" | "workflow" | "chat";

type InternalClaimLayoutProps = {
	claimId: string;
	/** Export menu entries (Download PDF / Excel). Empty hides the menu. */
	exportActions: ActionMenuItem<string>[];
	commentsSection?: ReactNode;
	auditSection?: ReactNode;
	workflowSection?: ReactNode;
};

/**
 * Staff layout. A component (not an inline render helper) so its tab state
 * survives re-renders; it must be rendered inside <ReimbursementClaimForm>.
 */
const InternalClaimLayout = ({
	claimId,
	exportActions,
	commentsSection,
	auditSection,
	workflowSection,
}: InternalClaimLayoutProps) => {
	const { referenceNumber, claimStatusLabel } =
		useReimbursementClaimFormContext();
	const [activeTab, setActiveTab] = useState<ClaimTab>("employee");

	const claimTabs: TabItem<ClaimTab>[] = [
		{ value: "employee", label: "Employee Details" },
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

	const renderTab = (): ReactNode => {
		switch (currentTab) {
			case "employee":
				return (
					<div className="flex min-w-0 flex-col gap-4">
						<ClaimEmployeeCard actionsVariant="claimant" />
						<ClaimEligibilityLedger />
					</div>
				);
			case "heads":
				return <ClaimHeadsCard />;
			case "workflow":
				return (
					<Card title="Approval Workflow" padding="none">
						<div className="p-4">{workflowSection}</div>
					</Card>
				);
			case "chat":
				return (
					<Card title="Chat" padding="default">
						<div className="comments-chat">{commentsSection}</div>
					</Card>
				);
		}
	};

	return (
		<DetailPageLayout>
			<DetailPageLayout.Header
				back={<NavigateButton direction="back" />}
				title={referenceNumber || "Medical claim"}
				badge={<Badge status={claimStatusLabel} />}
			>
				<div className="flex items-center gap-3">
					<TabsBar<ClaimTab>
						items={claimTabs}
						active={currentTab}
						onChange={setActiveTab}
						variant="soft"
						ariaLabel="Claim sections"
					/>
					{claimId && exportActions.length ? (
						<ActionMenu
							size="xs"
							row={claimId}
							actions={exportActions}
							ariaLabel="Reimbursement claim actions"
							triggerLabel="Export"
							triggerVariant="brand"
						/>
					) : null}
				</div>
			</DetailPageLayout.Header>

			<DetailPageLayout.Body>
				<DetailPageLayout.Main>
					<form
						className="flex min-w-0 flex-col gap-2"
						noValidate
						onSubmit={(event) => event.preventDefault()}
					>
						<ClaimFormAlerts />
						{renderTab()}
					</form>
				</DetailPageLayout.Main>

				{auditSection ? (
					<DetailPageLayout.Side
						label="Audit trail and decision"
						width="380px"
						// Natural height, pinned from xl up (the layout's default
						// sticky mode is full-viewport-height, which is not wanted here).
						sticky={false}
						className="xl:sticky xl:top-3 xl:self-start"
					>
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

						{/* Approve / clarify / close live BELOW the audit trail. */}
						<ClaimActions variant="reviewer" card />
					</DetailPageLayout.Side>
				) : null}
			</DetailPageLayout.Body>
		</DetailPageLayout>
	);
};

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

type ReimbursementPageProps = {
	mode?: ReimbursementClaimFormMode;
	refreshKey?: string | number;
};

/** THCM claim detail: review, line-item approval, workflow, close, export. */
const ReimbursementPage = ({
	mode,
	refreshKey = 0,
}: ReimbursementPageProps) => {
	const navigate = useNavigate();

	const {
		claimId = "",
		medicalClaimId = "",
		id = "",
	} = useParams<{
		claimId?: string;
		medicalClaimId?: string;
		id?: string;
	}>();

	const resolvedClaimId = claimId || medicalClaimId || id;
	const claimView = useMedicalClaimView({ claimId: resolvedClaimId });

	let content: ReactNode;

	if (!resolvedClaimId) {
		content = (
			<Card padding="spacious">
				<p className="text-sm text-rejected" role="alert">
					Medical claim ID is missing.
				</p>
			</Card>
		);
	} else if (claimView.isLoading) {
		content = (
			<Card padding="spacious">
				<p role="status">Loading medical claim…</p>
			</Card>
		);
	} else if (claimView.isError || !claimView.detail) {
		content = (
			<Card padding="spacious">
				<div className="flex flex-col items-start gap-3">
					<p className="text-sm text-rejected" role="alert">
						{getApiErrorMessage(
							claimView.error,
							"Unable to load this medical claim. Please try again.",
						)}
					</p>
					<Button
						type="button"
						text="Retry"
						size="sm"
						appearance="standard"
						variant="outline"
						onClick={() => void claimView.refresh()}
					/>
				</div>
			</Card>
		);
	} else {
		const exportActions: ActionMenuItem<string>[] = [
			...(claimView.permissions.canDownloadPdf
				? [
						{
							id: "download-pdf",
							label: claimView.isDownloadingPdf
								? "Downloading…"
								: "Download PDF",
							Icon: FileDown,
							onClick: () => void claimView.handleDownloadPdf(),
							disabled: claimView.isDownloadingPdf,
						},
					]
				: []),
			...(claimView.permissions.canExport
				? [
						{
							id: "export-excel",
							label: claimView.isExportingExcel ? "Exporting…" : "Excel",
							Icon: FileSpreadsheet,
							onClick: () => void claimView.handleExport(),
							disabled: Boolean(claimView.isExportingExcel),
						},
					]
				: []),
		];

		content = (
			<ReimbursementClaimForm
				referenceNumber={claimView.referenceNumber}
				// Staff never edit claimant data — view mode unless a page forces it.
				mode={mode ?? claimView.mode}
				canEdit={claimView.canEdit}
				actorRole={claimView.actorRole}
				initialValues={claimView.initialValues}
				initialLineItems={claimView.initialLineItems}
				gradeOptions={claimView.gradeOptions}
				statusLabel={claimView.detail.status ?? undefined}
				correctionReason={claimView.correctionReason}
				eligibilityPendingAmount={claimView.eligibilityPendingAmount}
				// Approvers decide on over-limit claims; never block in staff view.
				enforceEligibilityLimit={false}
				canApprove={claimView.canApprove}
				canClarify={claimView.canClarify}
				canReviewLineItems={claimView.canApproveLineItems}
				isExternalApprover={claimView.isExternalApprover}
				approvalActionLoading={claimView.isWorkflowActionLoading}
				onApproveStage={claimView.approveCurrentStage}
				onClarifyStage={claimView.clarifyCurrentStage}
				hospitalisationSummary={claimView.hospitalisationSummary}
				onLineItemApprove={
					claimView.canApproveLineItems ? claimView.approveLineItem : undefined
				}
				onLineItemUnapprove={
					claimView.canApproveLineItems
						? claimView.unapproveLineItem
						: undefined
				}
				onLineItemRemarksSave={
					claimView.canApproveLineItems
						? claimView.saveLineItemRemarks
						: undefined
				}
				onLineItemRemarksBatchSave={
					claimView.canApproveLineItems
						? claimView.saveLineItemRemarksBatch
						: undefined
				}
				canClose={claimView.canClose}
				onCloseClaim={claimView.canClose ? claimView.closeClaim : undefined}
				isClosing={claimView.isClosing}
				actionText={claimView.actionText}
				onBack={() => navigate(-1)}
			>
				<InternalClaimLayout
					claimId={resolvedClaimId}
					exportActions={exportActions}
					commentsSection={
						claimView.canShowCommentSection ? (
							<CommentsSection
								subjectType="MEDICAL_CLAIM"
								subjectId={resolvedClaimId}
								approvalId={claimView.commentContext.approvalId}
								canComment={claimView.commentContext.canComment}
								mentionableUsers={claimView.commentContext.mentionableUsers}
								ccEmails={claimView.commentContext.ccEmails}
								currentUserId={claimView.currentUserId}
								refreshKey={refreshKey}
								emptyTitle="No comments yet"
								emptyDescription="Comments about this medical claim will appear here."
							/>
						) : null
					}
					auditSection={
						<AuditLogSection
							subjectType="MEDICAL_CLAIM"
							subjectId={resolvedClaimId}
							entityName="medical claim"
							refreshKey={refreshKey}
							emptyTitle="No medical claim activity yet"
							emptyDescription="Medical claim activity will appear here."
						/>
					}
					workflowSection={
						claimView.workflowStages.length > 0 ? (
							<ApprovalWorkflowTableContent
								stages={claimView.workflowStages}
								showEmptyState={false}
							/>
						) : (
							<CardEmpty
								title="No applicable workflow found"
								description="No workflow stages are available for this claim."
								Icon={ClipboardClock}
							/>
						)
					}
				/>
			</ReimbursementClaimForm>
		);
	}

	return <PageSectionLayout>{content}</PageSectionLayout>;
};

export default ReimbursementPage;
