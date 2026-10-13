// components/activityFormView/ActivityFormView.tsx
// EPC detail ("view") page body: header + tabs, one card per tab,
// audit side panel, approval actions bar.
//
// Layout rules:
//   • No collapsible sections, no per-tab card titles — the selected tab IS
//     the title. Edit / Export actions sit in the header beside the tabs.
//   • EPC Info renders ActivityDetailsSection (same layout as the wizard).
//   • Comments is a tab (only once the workflow has started). The Audit Trail
//     is the only side panel and takes the full height of the page.
//   • Adding CRF / EPF and Final Submit live in the stepper.
import { useState, type ComponentProps, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
	FileDown,
	FileSpreadsheet,
	GitBranch,
	History,
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
import CrfSection from "../../../crf/core/CrfSection";
import { CrfOrderSection, isCrfOrderActive } from "../../../crf";
import EpfSection from "../../forms/EPF/EpfSection";
import ActivityDetailsSection from "./ActivityDetailsSection";
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
	| "comments"
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
	{ value: "comments", label: "Comments" },
	{ value: "outcome", label: "Event Outcome" },
	{ value: "report", label: "Event Report" },
	{ value: "deviation", label: "Deviation" },
	{ value: "tracking", label: "Tracking" },
];

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

/** Router state the EPC listing sends to open a tab directly (e.g. "CRF Order"). */
export type ActivityFormViewLocationState = { openTab?: "order" } | null;

const ActivityFormView = ({ activity, eventReport }: ActivityFormViewProps) => {
	const location = useLocation();
	const [activeTab, setActiveTab] = useState<ActivityTab>(() =>
		(location.state as ActivityFormViewLocationState)?.openTab === "order"
			? "tracking"
			: "epc",
	);

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
	const hasCrfLineItems = Boolean(epcData.crf?.items?.length);
	const hasEpf = Boolean(epcData.epf);
	const workflowStarted = Boolean(epcData.activeWorkflow);

	const canEditBeforeSubmit =
		!workflowStarted && Boolean(permissions.isProposer);

	const canEditEpc = canEditBeforeSubmit || permissions.canEditEpc;
	const canEditCrf =
		hasCrfLineItems && (canEditBeforeSubmit || permissions.canEditCrf);
	const canEditEpf = hasEpf && (canEditBeforeSubmit || permissions.canEditEpf);

	/** Comments + audit need a workflow context (approvalId) → only once submitted. */
	const showSidePanels = workflowStarted && editingSection !== "epf";

	const conditionalTabVisibility: Partial<Record<ActivityTab, boolean>> = {
		comments: showSidePanels,
		outcome: permissions.canShowInitialEventOutcome,
		report: permissions.canShowReportSection,
		deviation: permissions.canShowPostReportEventOutcome,
	};

	const orderOpen = isCrfOrderActive(epcData.crf?.status);

	const visibleTabs = ACTIVITY_TABS.filter(
		(tab) => conditionalTabVisibility[tab.value] ?? true,
	).map((tab) =>
		tab.value === "tracking" && orderOpen
			? { ...tab, label: "CRF Order" }
			: tab,
	);

	const currentTab: ActivityTab = visibleTabs.some(
		(tab) => tab.value === activeTab,
	)
		? activeTab
		: "epc";

	const editSection = (section: keyof typeof EDIT_SECTION_TAB) => {
		setActiveTab(EDIT_SECTION_TAB[section]);
		startEditing(section);
	};

	/* ------------------------------------------------------------------------ */
	/*                      Header actions (Edit · Export)                      */
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

	/** The Edit button that belongs to the tab on screen (none while editing). */
	const tabEditAction = (): ReactNode => {
		if (editingSection) return null;
		switch (currentTab) {
			case "epc":
				return canEditEpc ? editButton("epc", "Edit EPC") : null;
			case "crf":
				return canEditCrf ? editButton("crf", "Edit CRF") : null;
			case "epf":
				return canEditEpf ? editButton("epf", "Edit EPF") : null;
			default:
				return null;
		}
	};

	/**
	 * Standard view card: no title (the tab is the title). A render helper, NOT
	 * a component declared in here — an inner component would remount each render.
	 */
	const renderViewCard = (children: ReactNode, className?: string) => (
		<Card key={currentTab} className={className}>
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
					<ActivityDetailsSection
						epcData={epcData}
						isEditing={false}
						onCancel={cancelEditing}
						onSuccess={finishEditing}
					/>,
				);

			/* ------------------------------- CRF ------------------------------- */
			case "crf":
				if (editingSection === "crf") {
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
				);

			/* ------------------------------- EPF ------------------------------- */
			case "epf":
				if (editingSection === "epf") {
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

			/* ------------------------------ Comments --------------------------- */
			case "comments":
				return (
					<Card
						key="comments"
						className="activity-form-view-comments-card"
						padding="none"
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
					<CrfOrderSection
						crf={epcData.crf ?? null}
						onRefresh={handleRefresh}
					/>,
				);
		}
	};

	/* ------------------------------------------------------------------------ */
	/*                          Approval actions bar                            */
	/* ------------------------------------------------------------------------ */

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

	const showAudit = showSidePanels;

	return (
		<>
			<div className="activity-form-view">
				{/* ── Header: back + title (left) · tabs + actions (right) ── */}
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

					<div className="activity-form-view-header-end">
						<TabsBar<ActivityTab>
							items={visibleTabs}
							active={currentTab}
							onChange={setActiveTab}
							variant="soft"
							ariaLabel="Activity sections"
							className="activity-form-view-tabs"
						/>

						<div className="activity-form-view-header-actions">
							{tabEditAction()}
							{exportMenu}
						</div>
					</div>
				</header>

				{/* ── Body: tab card (left) · full-height audit trail (right) ── */}
				<div
					className={["activity-form-view-body", showAudit && "has-side-panels"]
						.filter(Boolean)
						.join(" ")}
				>
					<div className="activity-form-view-main min-w-0">{renderTab()}</div>

					{showAudit && (
						<aside className="activity-form-view-side" aria-label="Audit trail">
							<Card
								className="activity-form-view-panel activity-form-view-panel--audit"
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
							canApprove={workflowData.canActNow}
							canClarify={workflowData.canActNow}
							onApprove={(reason) => handleApproveWorkflow(reason)}
							onClarify={(reason) => handleClarifyWorkflow(reason)}
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
