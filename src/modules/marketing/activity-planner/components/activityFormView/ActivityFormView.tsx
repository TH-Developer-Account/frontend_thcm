import {
	CalendarCheck,
	FileDown,
	FileSpreadsheet,
	FileText,
	GitBranch,
	History,
	MessageSquareText,
	Pencil,
	Plus,
	ReceiptIndianRupee,
} from "lucide-react";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../../../components/common/ActionMenu";
import { Badge } from "../../../../../components/common/Badge";
import Button from "../../../../../components/common/Button";
import Card, { type CardSection } from "../../../../../components/common/Card";
import { AuditLogSection } from "../../../../../components/ui/audit";
import { CommentsSection } from "../../../../../components/ui/comments";
import { ReasonActionModal } from "../../../../../components/ui/ReasonActionModal";
import { ApprovalWorkflowSection } from "../../../../workflows";
import {
	activityPlannerAuditApi,
	activityPlannerCommentApi,
} from "../../api/activityPlannerComment.adapter";
import { EventOutcome } from "../../forms/EventOutcome/EventOutcome";
import { EventReportSection } from "../../forms/EventReport/EventReportSection";
import EpcForm from "../../forms/EPC/EpcForm";
import CrfSection from "../../forms/CRF/CrfSection";
import EpfSection from "../../forms/EPF/EpfSection";
import type { ActivityPlannerController } from "../../hooks/useActivityPlanner";
import ActivityDetailsSection from "./ActivityDetailsSection";

type ActivityFormViewProps = { activity: ActivityPlannerController };

const ActivityFormView = ({ activity }: ActivityFormViewProps) => {
	const {
		epcData,
		reportData,
		permissions,
		proposerName,
		currentUserId,
		workspaceId,
		appId,
		eventStatus,
		editingSection,
		startEditing,
		cancelEditing,
		finishEditing,
		handleCreatedEpc,
		workflowStages,
		deviationPreviewStages,
		workflowData,
		commentContext,
		canComment,
		commentsRefreshKey,
		reasonModal,
		openReasonModal,
		closeReasonModal,
		handleReasonConfirm,
		handleApproveWorkflow,
		handleDeviationPreviewSuccess,
		hasValidatorPreviewed,
		isValidatingReport,
		isClarifyingReport,
		handleOpenReportBuilder,
		handleOpenReportPreview,
		handleValidateReport,
		handleCloseEPC,
		isClosingEPC,
		isPreparingPdf,
		isDownloadingPdf,
		isExportingExcel,
		handleDownloadPdf,
		handleExport,
		isSubmittingClarifiedUpdate,
		canSubmitClarifiedUpdate,
		submitClarifiedUpdate,
		isSubmittingDeviationUpdate,
		canSubmitDeviationUpdate,
		submitDeviationUpdate,
		handleRefresh,
	} = activity;

	if (!epcData) {
		return (
			<div className="px-6 py-4">
				<EpcForm mode="create" onSuccess={handleCreatedEpc} />
			</div>
		);
	}

	const title = epcData.event_name?.title || "Activity Planning Calendar";
	const proposalNumber = epcData.proposal_number || "--";
	const status = epcData.status || "IN_PROGRESS";
	const hasCrfLineItems = Boolean(epcData.crf?.lineItems?.length);
	const hasEpf = Boolean(epcData.epf);
	const exportActions: ActionMenuItem<string>[] = [
		{
			id: "download-pdf",
			label: isPreparingPdf || isDownloadingPdf ? "Downloading…" : "PDF",
			Icon: FileDown,
			onClick: () => void handleDownloadPdf(),
			disabled: isPreparingPdf || isDownloadingPdf,
		},
		{
			id: "export-excel",
			label: isExportingExcel ? "Exporting…" : "Excel",
			Icon: FileSpreadsheet,
			onClick: () => void handleExport(),
			disabled: isExportingExcel,
		},
	];

	const sections: CardSection[] = [
		{
			id: "activity-details",
			title: "Activity Details",
			Icon: CalendarCheck,
			defaultExpanded: true,
			actions:
				permissions.canEditEpc && editingSection !== "epc" ? (
					<Button
						type="button"
						Icon={Pencil}
						text="Edit EPC"
						size="sm"
						onClick={() => startEditing("epc")}
						appearance="standard"
						variant="outline"
					/>
				) : undefined,
			children: (
				<ActivityDetailsSection
					epcData={epcData}
					isEditing={editingSection === "epc"}
					onCancel={cancelEditing}
					onSuccess={finishEditing}
				/>
			),
		},
		{
			id: "crf-details",
			title: "CRF Details",
			Icon: FileText,
			defaultExpanded: true,
			actions:
				editingSection !== "crf" &&
				(hasCrfLineItems
					? permissions.canEditCrf
					: permissions.canCreateCrf) ? (
					<Button
						type="button"
						Icon={hasCrfLineItems ? Pencil : Plus}
						text={hasCrfLineItems ? "Edit CRF" : "Create CRF"}
						size="sm"
						onClick={() => startEditing("crf")}
						appearance="standard"
						variant="outline"
					/>
				) : undefined,
			children: (
				<CrfSection
					epcData={epcData}
					isEditing={editingSection === "crf"}
					onCancel={cancelEditing}
					onSuccess={finishEditing}
				/>
			),
		},
		{
			id: "epf-details",
			title: "EPF Details",
			Icon: ReceiptIndianRupee,
			defaultExpanded: true,
			actions:
				editingSection !== "epf" &&
				(hasEpf ? permissions.canEditEpf : permissions.canCreateEpf) ? (
					<Button
						type="button"
						Icon={hasEpf ? Pencil : Plus}
						text={hasEpf ? "Edit EPF" : "Create EPF"}
						size="sm"
						onClick={() => startEditing("epf")}
						appearance="standard"
						variant="outline"
					/>
				) : undefined,
			children: (
				<EpfSection
					epcData={epcData}
					isEditing={editingSection === "epf"}
					onCancel={cancelEditing}
					onSuccess={finishEditing}
				/>
			),
		},
	];

	if (epcData.epf && editingSection !== "epf") {
		sections.push(
			{
				id: "approval-workflow",
				title: "Approval Workflow",
				Icon: GitBranch,
				defaultExpanded: true,
				children: (
					<ApprovalWorkflowSection
						stages={workflowStages}
						additionalFlows={
							deviationPreviewStages.length
								? [
										{
											key: "deviation",
											title: "Deviation Approval Flow",
											stages: deviationPreviewStages,
										},
									]
								: []
						}
					/>
				),
			},
			{
				id: "comments",
				title: "Comment Section",
				Icon: MessageSquareText,
				defaultExpanded: true,
				children: (
					<CommentsSection
						subjectType="EPC"
						subjectId={epcData.id}
						currentUserId={currentUserId}
						approvalId={commentContext.approvalId}
						mentionableUsers={commentContext.mentionableUsers}
						ccEmails={commentContext.ccEmails}
						refreshKey={commentsRefreshKey}
						canComment={canComment}
						api={activityPlannerCommentApi}
					/>
				),
			},
			{
				id: "activity-log",
				title: "Activity Log",
				Icon: History,
				defaultExpanded: true,
				children: (
					<AuditLogSection
						subjectType="EVENT_PROPOSAL"
						subjectId={epcData.id}
						entityName="event proposal"
						refreshKey={commentsRefreshKey}
						api={activityPlannerAuditApi}
					/>
				),
			},
		);
	}

	if (permissions.canShowInitialEventOutcome) {
		sections.push({
			id: "initial-event-outcome",
			title: "Event Outcome",
			Icon: CalendarCheck,
			defaultExpanded: true,
			children: <EventOutcome eventStatus={eventStatus} epcID={epcData.id} />,
		});
	}

	if (permissions.canShowReportSection) {
		sections.push({
			id: "event-report",
			title: "Event Report",
			Icon: FileText,
			defaultExpanded: true,
			children: (
				<EventReportSection
					report={reportData}
					isProposer={permissions.isProposer}
					isValidator={permissions.isValidator}
					canCreateReport={permissions.canCreateReport}
					hasValidatorPreviewed={hasValidatorPreviewed}
					isValidating={isValidatingReport}
					isClarifying={isClarifyingReport}
					onOpenReportBuilder={handleOpenReportBuilder}
					onOpenReportPreview={handleOpenReportPreview}
					onValidateReport={handleValidateReport}
					onClarifyReport={() => openReasonModal("clarify-report")}
				/>
			),
		});
	}

	if (permissions.canShowPostReportEventOutcome) {
		sections.push({
			id: "post-report-event-outcome",
			title: "Post-report Event Outcome",
			Icon: CalendarCheck,
			defaultExpanded: true,
			children: (
				<EventOutcome
					eventStatus={eventStatus}
					epcID={epcData.id}
					workspaceId={workspaceId ?? undefined}
					appId={appId ?? undefined}
					onSuccess={handleRefresh}
					onDeviationPreviewSuccess={handleDeviationPreviewSuccess}
				/>
			),
		});
	}

	const showFooter =
		workflowData.canActNow ||
		permissions.canShowCloseEpcAction ||
		permissions.isClarifiedPending ||
		permissions.isDeviationPending;

	return (
		<>
			<Card
				title={
					<div className="inline-flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-iron-dark">
						<div className="flex items-center gap-2 text-iron">
							<span>{proposerName || "--"} /</span>
						</div>
						<span>{title}</span>
						{proposalNumber !== "--" && <span>/ {proposalNumber} /</span>}

						<Badge status={status} />
					</div>
				}
				actions={
					<ActionMenu
						size="xs"
						row={epcData.id}
						actions={exportActions}
						ariaLabel="Activity planner actions"
						triggerLabel="Actions"
						triggerVariant="brand"
					/>
				}
				sections={sections}
				padding="none"
				footer={
					showFooter ? (
						<div className="flex w-full flex-wrap items-center justify-end gap-2">
							{permissions.isClarifiedPending && (
								<Button
									type="button"
									text={
										isSubmittingClarifiedUpdate
											? "Submitting..."
											: "Submit clarified changes"
									}
									variant="brand"
									appearance="standard"
									disabled={
										isSubmittingClarifiedUpdate || !canSubmitClarifiedUpdate
									}
									onClick={() => void submitClarifiedUpdate()}
								/>
							)}
							{permissions.isDeviationPending && (
								<Button
									type="button"
									text={
										isSubmittingDeviationUpdate
											? "Submitting..."
											: "Submit deviation changes"
									}
									variant="brand"
									appearance="standard"
									disabled={
										isSubmittingDeviationUpdate || !canSubmitDeviationUpdate
									}
									onClick={() => void submitDeviationUpdate()}
								/>
							)}
							{workflowData.canActNow && (
								<>
									<Button
										type="button"
										text="Send for Clarification"
										variant="outline"
										appearance="standard"
										onClick={() => openReasonModal("clarify-workflow")}
									/>
									<Button
										type="button"
										text="Approve"
										variant="brand"
										appearance="standard"
										onClick={() => void handleApproveWorkflow()}
									/>
								</>
							)}
							{permissions.canShowCloseEpcAction && (
								<Button
									type="button"
									text={isClosingEPC ? "Closing..." : "Close EPC"}
									variant="brand"
									appearance="standard"
									disabled={isClosingEPC || permissions.isClosed}
									onClick={() => void handleCloseEPC()}
								/>
							)}
						</div>
					) : null
				}
			/>

			<ReasonActionModal
				open={Boolean(reasonModal.mode)}
				mode={reasonModal.mode}
				loading={reasonModal.loading || isClarifyingReport}
				onClose={closeReasonModal}
				onConfirm={handleReasonConfirm}
			/>
		</>
	);
};

export default ActivityFormView;
