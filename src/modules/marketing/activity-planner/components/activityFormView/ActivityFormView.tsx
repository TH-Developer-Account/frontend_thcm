// components/activityFormView/ActivityFormView.tsx
// EPC detail ("view") page body: header + tabs, one card per tab,
// comments/audit side panels, approval actions bar.
//
// Rules:
//   • No collapsible sections — every tab is ONE card.
//   • Adding CRF / EPF and Final Submit live in the stepper (no Create
//     buttons here, no Review tab).
//   • Editing existing forms:
//       not submitted → the proposer can edit EPC / CRF / EPF freely
//                       (ActivityPlannerPage shows the "Not submitted" banner)
//       submitted     → existing permissions (edit via clarification)
import { useState, type ComponentProps, type ReactNode } from "react";
import {
	FileDown,
	FileSpreadsheet,
	GitBranch,
	History,
	MessageSquareText,
	Pencil,
	TriangleAlert,
	Truck,
} from "lucide-react";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../../../components/common/ActionMenu";
import { Badge } from "../../../../../components/common/Badge";
import Button from "../../../../../components/common/Button";
import Card from "../../../../../components/common/Card";
import NavigateButton from "../../../../../components/common/NavigateButton";
import { TabsBar } from "../../../../../components/common/TabsBar";
import type { TabItem } from "../../../../../components/common/common.types";
import FormHeader from "../../../../../components/ui/FormHeader";
import { AuditLogSection } from "../../../../../components/ui/audit";
import { CommentsSection } from "../../../../../components/ui/comments";
import ApprovalActionsBar from "../../../../../components/ui/ApprovalActionsBar";
import { ReasonActionModal } from "../../../../../components/ui/ReasonActionModal";
import { ApprovalWorkflowSection } from "../../../../workflows";

import { EventOutcome } from "../../forms/EventOutcome/EventOutcome";
import { EventReportSection } from "../../forms/EventReport/EventReportSection";
import EpcForm from "../../forms/EPC/EpcForm";
import CrfSection from "../../../crf/CrfSection";
import EpfSection from "../../forms/EPF/EpfSection";
import type { ActivityPlannerController } from "../../hooks/useActivityPlanner";
import {
	activityPlannerAuditApi,
	activityPlannerCommentApi,
} from "../../api/epc.api";
import { EVENT_PROPOSAL_SUBJECT_TYPE } from "../../queries/epc.queries";

/* ========================================================================== */
/*                                    Tabs                                    */
/* ========================================================================== */

type ActivityTab =
	| "epc"
	| "crf"
	| "epf"
	| "approval"
	| "outcome"
	| "report"
	| "deviation"
	| "tracking";

/** Full tab order. Conditional tabs are filtered out at render time. */
const ACTIVITY_TABS: readonly TabItem<ActivityTab>[] = [
	{ value: "epc", label: "EPC Info" },
	{ value: "crf", label: "CRF" },
	{ value: "epf", label: "EPF Info" },
	{ value: "approval", label: "Approval Workflow" },
	{ value: "outcome", label: "Event Outcome" },
	{ value: "report", label: "Event Report" },
	{ value: "deviation", label: "Deviation" },
	{ value: "tracking", label: "Tracking" },
];

const TAB_TITLES: Record<ActivityTab, string> = {
	epc: "EPC Information",
	crf: "CRF Details",
	epf: "EPF Information",
	approval: "Approval Workflow",
	outcome: "Event Outcome",
	report: "Event Report",
	deviation: "Post-report Outcome & Deviation",
	tracking: "Order Tracking",
};

/** Which tab owns each editable section — used to jump there when editing starts. */
const EDIT_SECTION_TAB: Record<"epc" | "epf" | "crf", ActivityTab> = {
	epc: "epc",
	epf: "epf",
	crf: "crf",
};

const TabEmptyState = ({
	Icon,
	title,
	description,
}: {
	Icon: typeof Truck;
	title: string;
	description: ReactNode;
}) => (
	<div className="activity-form-view-empty">
		<Icon size={22} strokeWidth={1.8} aria-hidden="true" />
		<p className="activity-form-view-empty-title">{title}</p>
		<p className="activity-form-view-empty-description">{description}</p>
	</div>
);

/* ========================================================================== */
/*                                  Component                                 */
/* ========================================================================== */

/**
 * Event report wiring owned by the page (report query, generation watcher,
 * builder mode). Typed off EventReportSection so the two never drift.
 */
export type EventReportController = Pick<
	ComponentProps<typeof EventReportSection>,
	| "report"
	| "isValidating"
	| "onOpenReportBuilder"
	| "onDownload"
	| "onValidateReport"
>;

type ActivityFormViewProps = {
	activity: ActivityPlannerController;
	eventReport: EventReportController;
};

const ActivityFormView = ({ activity, eventReport }: ActivityFormViewProps) => {
	const [activeTab, setActiveTab] = useState<ActivityTab>("epc");

	const {
		epcData,
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
		closeReasonModal,
		handleReasonConfirm,
		handleApproveWorkflow,
		handleClarifyWorkflow,
		handleDeviationPreviewSuccess,
		handleCloseEPC,
		isClosingEPC,
		isPreparingPdf,
		isDownloadingPdf,
		isExportingExcel,
		handleDownloadPdf,
		handleExport,
		isSubmittingClarifiedUpdate,
		submitClarifiedUpdate,
		isSubmittingDeviationUpdate,
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
	const workflowStarted = Boolean(epcData.activeWorkflow);

	/** Before submission the proposer owns the EPC and can edit every saved form. */
	const canEditBeforeSubmit =
		!workflowStarted && Boolean(permissions.isProposer);

	const canEditEpc = canEditBeforeSubmit || permissions.canEditEpc;
	const canEditCrf =
		hasCrfLineItems && (canEditBeforeSubmit || permissions.canEditCrf);
	const canEditEpf = hasEpf && (canEditBeforeSubmit || permissions.canEditEpf);

	/** Comments + audit need a workflow context (approvalId) → only once submitted. */
	const showSidePanels = workflowStarted && editingSection !== "epf";

	/** Conditional tabs only exist when their section applies. */
	const conditionalTabVisibility: Partial<Record<ActivityTab, boolean>> = {
		outcome: permissions.canShowInitialEventOutcome,
		report: permissions.canShowReportSection,
		deviation: permissions.canShowPostReportEventOutcome,
	};

	const visibleTabs = ACTIVITY_TABS.filter(
		(tab) => conditionalTabVisibility[tab.value] ?? true,
	);

	// If the active tab disappears (status changed after a refresh), fall back to EPC.
	const currentTab: ActivityTab = visibleTabs.some(
		(tab) => tab.value === activeTab,
	)
		? activeTab
		: "epc";

	/** Start editing and make sure the owning tab is the one on screen. */
	const editSection = (section: keyof typeof EDIT_SECTION_TAB) => {
		setActiveTab(EDIT_SECTION_TAB[section]);
		startEditing(section);
	};

	/* ------------------------------------------------------------------------ */
	/*                          Header actions (view cards)                     */
	/* ------------------------------------------------------------------------ */

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

	const exportMenu = (
		<ActionMenu
			size="xs"
			row={epcData.id}
			actions={exportActions}
			ariaLabel="Activity planner export actions"
			triggerLabel="Export"
			triggerVariant="brand"
		/>
	);

	/** Edit only — adding forms happens in the stepper. */
	const editButton = (
		section: keyof typeof EDIT_SECTION_TAB,
		label: string,
	) => (
		<Button
			type="button"
			Icon={Pencil}
			text={label}
			size="sm"
			onClick={() => editSection(section)}
			appearance="standard"
			variant="outline"
		/>
	);

	/**
	 * Standard view card for a tab: title + [action] + Export.
	 * A render helper, NOT a component declared in here — an inner component
	 * would get a new identity every render and remount (wiping form state).
	 */
	const renderViewCard = (children: ReactNode, action?: ReactNode) => (
		<Card
			key={currentTab}
			title={TAB_TITLES[currentTab]}
			actions={
				<>
					{action}
					{exportMenu}
				</>
			}
		>
			{children}
		</Card>
	);

	/* ------------------------------------------------------------------------ */
	/*                            Tab → card                                    */
	/* ------------------------------------------------------------------------ */

	const renderTab = (): ReactNode => {
		switch (currentTab) {
			/* ------------------------------- EPC ------------------------------- */
			case "epc":
				if (editingSection === "epc") {
					return (
						<Card key="epc-edit" title="Edit EPC">
							<EpcForm
								mode="edit"
								epcId={epcData.id}
								initialData={epcData}
								onCancel={cancelEditing}
								onSuccess={finishEditing}
							/>
						</Card>
					);
				}

				return renderViewCard(
					<EpcForm mode="view" initialData={epcData} />,
					canEditEpc ? editButton("epc", "Edit EPC") : undefined,
				);

			/* ------------------------------- CRF ------------------------------- */
			case "crf":
				if (editingSection === "crf") {
					// CrfSection in edit mode renders CrfForm — a card with its own footer.
					return (
						<CrfSection
							epcData={epcData}
							isEditing
							onCancel={cancelEditing}
							onSuccess={finishEditing}
						/>
					);
				}

				return renderViewCard(
					<CrfSection
						epcData={epcData}
						isEditing={false}
						onCancel={cancelEditing}
						onSuccess={finishEditing}
					/>,
					canEditCrf ? editButton("crf", "Edit CRF") : undefined,
				);

			/* ------------------------------- EPF ------------------------------- */
			case "epf":
				if (editingSection === "epf") {
					// EpfSection in edit mode renders EpfForm — a card with its own footer.
					return (
						<EpfSection
							epcData={epcData}
							isEditing
							onCancel={cancelEditing}
							onSuccess={finishEditing}
						/>
					);
				}

				return renderViewCard(
					<EpfSection
						epcData={epcData}
						isEditing={false}
						onCancel={cancelEditing}
						onSuccess={finishEditing}
					/>,
					canEditEpf ? editButton("epf", "Edit EPF") : undefined,
				);

			/* ------------------------- Approval workflow ----------------------- */
			case "approval":
				return renderViewCard(
					workflowStarted && editingSection !== "epf" ? (
						<div className="activity-form-view-tab-body">
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
						</div>
					) : (
						<TabEmptyState
							Icon={GitBranch}
							title="Workflow not started"
							description={
								editingSection === "epf"
									? "Finish editing the EPF to view the approval workflow."
									: "The approval workflow starts when the EPC is submitted (Continue to submit, above)."
							}
						/>
					),
				);

			/* ------------------------------ Outcome ---------------------------- */
			case "outcome":
				return renderViewCard(
					<EventOutcome eventStatus={eventStatus} epcID={epcData.id} />,
				);

			/* ------------------------------ Report ----------------------------- */
			case "report":
				return renderViewCard(
					<EventReportSection
						report={eventReport.report}
						isProposer={permissions.isProposer}
						isValidator={permissions.isValidator}
						canCreateReport={permissions.canCreateReport}
						isValidating={eventReport.isValidating}
						onOpenReportBuilder={eventReport.onOpenReportBuilder}
						onDownload={eventReport.onDownload}
						onValidateReport={eventReport.onValidateReport}
					/>,
				);

			/* ----------------------------- Deviation --------------------------- */
			case "deviation":
				return renderViewCard(
					<div className="flex min-w-0 flex-col gap-4">
						<EventOutcome
							eventStatus={eventStatus}
							epcID={epcData.id}
							workspaceId={workspaceId ?? undefined}
							appId={appId ?? undefined}
							onSuccess={handleRefresh}
							onDeviationPreviewSuccess={handleDeviationPreviewSuccess}
						/>

						{/* Show the deviation approval flow right where it was generated. */}
						{deviationPreviewStages.length > 0 && (
							<section className="min-w-0">
								<FormHeader
									title="Deviation Approval Flow"
									Icon={TriangleAlert}
								/>
								<ApprovalWorkflowSection
									stages={deviationPreviewStages}
									additionalFlows={[]}
								/>
							</section>
						)}
					</div>,
				);

			/* ------------------------------ Tracking --------------------------- */
			case "tracking":
				return renderViewCard(
					<TabEmptyState
						Icon={Truck}
						title="No shipment updates yet"
						description="Order and shipment tracking will appear here once the CRF is approved and the Shopify order is created."
					/>,
				);
		}
	};

	/* ------------------------------------------------------------------------ */
	/*                          Approval actions bar                            */
	/* ------------------------------------------------------------------------ */

	// Proposer "submit" slot: clarified resubmission takes priority over deviation.
	// The hook's submit handlers already toast when the form hasn't been updated yet.
	const resubmit = permissions.isClarifiedPending
		? {
				label: "Submit clarified changes",
				onSubmit: submitClarifiedUpdate,
				isSubmitting: isSubmittingClarifiedUpdate,
			}
		: permissions.isDeviationPending
			? {
					label: "Submit deviation changes",
					onSubmit: submitDeviationUpdate,
					isSubmitting: isSubmittingDeviationUpdate,
				}
			: null;

	const canCloseEpc =
		permissions.canShowCloseEpcAction && !permissions.isClosed;

	const showFooter = workflowData.canActNow || canCloseEpc || Boolean(resubmit);

	/* ------------------------------------------------------------------------ */
	/*                                  Render                                  */
	/* ------------------------------------------------------------------------ */

	return (
		<>
			<div className="activity-form-view">
				{/* ── Header: back + title (left) · tabs (right) ── */}
				<header className="activity-form-view-header">
					<div className="activity-form-view-header-copy">
						<NavigateButton direction="back" />

						<div className="min-w-0">
							<div className="activity-form-view-title-row">
								<h2 className="activity-form-view-title">{title}</h2>
								<Badge status={status} />
							</div>

							<p className="activity-form-view-subtitle">
								{proposerName || "--"}
								{proposalNumber !== "--" && <> · {proposalNumber}</>}
							</p>
						</div>
					</div>

					<TabsBar<ActivityTab>
						items={visibleTabs}
						active={currentTab}
						onChange={setActiveTab}
						variant="soft"
						ariaLabel="Activity sections"
						className="activity-form-view-tabs"
					/>
				</header>

				{/* ── Body: tab card (left) · comments + audit (right) ── */}
				<div
					className={[
						"activity-form-view-body",
						showSidePanels && "has-side-panels",
					]
						.filter(Boolean)
						.join(" ")}
				>
					<div className="activity-form-view-main min-w-0">{renderTab()}</div>

					{showSidePanels && (
						<aside
							className="activity-form-view-side"
							aria-label="Activity log and comments"
						>
							<Card
								className="activity-form-view-panel"
								accordion
								defaultExpanded
								title={
									<span className="activity-form-view-panel-title">
										<MessageSquareText size={15} aria-hidden="true" />
										Comments
									</span>
								}
								padding="none"
								bodyClassName="activity-form-view-panel-body"
							>
								<CommentsSection
									subjectType={EVENT_PROPOSAL_SUBJECT_TYPE}
									subjectId={epcData.id}
									currentUserId={currentUserId}
									approvalId={commentContext.approvalId}
									mentionableUsers={commentContext.mentionableUsers}
									ccEmails={commentContext.ccEmails}
									refreshKey={commentsRefreshKey}
									canComment={canComment}
									api={activityPlannerCommentApi}
								/>
							</Card>
							<Card
								className="activity-form-view-panel"
								accordion
								defaultExpanded
								title={
									<span className="activity-form-view-panel-title">
										<History size={15} aria-hidden="true" />
										Audit Trail
									</span>
								}
								padding="none"
								bodyClassName="activity-form-view-panel-body"
							>
								<AuditLogSection
									subjectType={EVENT_PROPOSAL_SUBJECT_TYPE}
									subjectId={epcData.id}
									entityName="event proposal"
									refreshKey={commentsRefreshKey}
									api={activityPlannerAuditApi}
								/>
							</Card>
						</aside>
					)}
				</div>

				{/* ── Footer: approval actions bar ── */}
				{showFooter && (
					<footer className="activity-form-view-footer">
						<ApprovalActionsBar
							showBack={false}
							/* Approver: reason box + Clarify / Approve */
							canApprove={workflowData.canActNow}
							canClarify={workflowData.canActNow}
							onApprove={(reason) => handleApproveWorkflow(reason)}
							onClarify={(reason) => handleClarifyWorkflow(reason)}
							/* Proposer: resubmit / close */
							canSubmit={Boolean(resubmit)}
							onSubmit={resubmit?.onSubmit}
							submitLabel={
								resubmit?.isSubmitting
									? "Submitting..."
									: (resubmit?.label ?? "Final Submit")
							}
							canAcceptAndClose={canCloseEpc}
							onAcceptAndClose={handleCloseEPC}
							acceptAndCloseLabel={isClosingEPC ? "Closing..." : "Close EPC"}
							loading={
								isClosingEPC ||
								isSubmittingClarifiedUpdate ||
								isSubmittingDeviationUpdate
							}
						/>
					</footer>
				)}
			</div>

			<ReasonActionModal
				open={Boolean(reasonModal.mode)}
				mode={reasonModal.mode}
				loading={reasonModal.loading}
				onClose={closeReasonModal}
				onConfirm={handleReasonConfirm}
			/>
		</>
	);
};

export default ActivityFormView;
