import { useState, type ComponentProps, type ReactNode } from "react";
import {
	CalendarCheck,
	ClipboardCheck,
	FileDown,
	FileSpreadsheet,
	FileText,
	GitBranch,
	History,
	MessageSquareText,
	Pencil,
	Plus,
	ReceiptIndianRupee,
	TriangleAlert,
	Truck,
} from "lucide-react";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../../../components/common/ActionMenu";
import { Badge } from "../../../../../components/common/Badge";
import Button from "../../../../../components/common/Button";
import Card, { type CardSection } from "../../../../../components/common/Card";
import NavigateButton from "../../../../../components/common/NavigateButton";
import { TabsBar } from "../../../../../components/common/TabsBar";
import type { TabItem } from "../../../../../components/common/common.types";
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
import ActivityDetailsSection from "./ActivityDetailsSection";
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
	| "epf"
	| "crf"
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
	epf: "EPF Information",
	crf: "CRF Details",
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

	/** Comments + audit need a workflow context (approvalId), same rule as before. */
	const showSidePanels = hasEpf && editingSection !== "epf";

	/** Event outcome / report / deviation tabs only exist when their section applies. */
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

	/* ------------------------------------------------------------------------ */
	/*                              EPC tab                                     */
	/* ------------------------------------------------------------------------ */

	const buildEpcSections = (): CardSection[] => [
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
						onClick={() => editSection("epc")}
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
	];

	/* ------------------------------------------------------------------------ */
	/*               Event outcome / report / deviation tabs                    */
	/* ------------------------------------------------------------------------ */

	const buildOutcomeSections = (): CardSection[] => [
		{
			id: "initial-event-outcome",
			title: "Event Outcome",
			Icon: CalendarCheck,
			defaultExpanded: true,
			children: <EventOutcome eventStatus={eventStatus} epcID={epcData.id} />,
		},
	];

	const buildReportSections = (): CardSection[] => [
		{
			id: "event-report",
			title: "Event Report",
			Icon: ClipboardCheck,
			defaultExpanded: true,
			children: (
				<EventReportSection
					report={eventReport.report}
					isProposer={permissions.isProposer}
					isValidator={permissions.isValidator}
					canCreateReport={permissions.canCreateReport}
					isValidating={eventReport.isValidating}
					onOpenReportBuilder={eventReport.onOpenReportBuilder}
					onDownload={eventReport.onDownload}
					onValidateReport={eventReport.onValidateReport}
				/>
			),
		},
	];

	const buildDeviationSections = (): CardSection[] => {
		const sections: CardSection[] = [
			{
				id: "post-report-event-outcome",
				title: "Post-report Event Outcome",
				Icon: TriangleAlert,
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
			},
		];

		// Show the deviation approval flow right where it was generated.
		if (deviationPreviewStages.length) {
			sections.push({
				id: "deviation-approval-flow",
				title: "Deviation Approval Flow",
				Icon: GitBranch,
				defaultExpanded: true,
				children: (
					<ApprovalWorkflowSection
						stages={deviationPreviewStages}
						additionalFlows={[]}
					/>
				),
			});
		}

		return sections;
	};

	/* ------------------------------------------------------------------------ */
	/*                              EPF tab: budget                             */
	/* ------------------------------------------------------------------------ */

	const buildEpfSections = (): CardSection[] => [
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
						onClick={() => editSection("epf")}
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

	/* ------------------------------------------------------------------------ */
	/*                               CRF tab                                    */
	/* ------------------------------------------------------------------------ */

	const buildCrfSections = (): CardSection[] => [
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
						onClick={() => editSection("crf")}
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
	];

	/* ------------------------------------------------------------------------ */
	/*                            Tab → content                                 */
	/* ------------------------------------------------------------------------ */

	const renderTabContent = (): {
		sections?: CardSection[];
		body?: ReactNode;
	} => {
		switch (currentTab) {
			case "epc":
				return { sections: buildEpcSections() };

			case "outcome":
				return { sections: buildOutcomeSections() };

			case "report":
				return { sections: buildReportSections() };

			case "deviation":
				return { sections: buildDeviationSections() };

			case "epf":
				return { sections: buildEpfSections() };

			case "crf":
				return { sections: buildCrfSections() };

			case "tracking":
				return {
					body: (
						<TabEmptyState
							Icon={Truck}
							title="No shipment updates yet"
							description="Order and shipment tracking will appear here once the CRF is approved and the Shopify order is created."
						/>
					),
				};

			case "approval":
				return {
					body:
						hasEpf && editingSection !== "epf" ? (
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
								title="Workflow not available"
								description={
									editingSection === "epf"
										? "Finish editing the EPF to view the approval workflow."
										: "The approval workflow starts once the EPF is created."
								}
							/>
						),
				};
		}
	};

	const tabContent = renderTabContent();

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

				{/* ── Body: form (left) · comments + audit (right) ── */}
				<div
					className={[
						"activity-form-view-body",
						showSidePanels && "has-side-panels",
					]
						.filter(Boolean)
						.join(" ")}
				>
					<Card
						key={currentTab}
						className="activity-form-view-main"
						title={TAB_TITLES[currentTab]}
						actions={
							<ActionMenu
								size="xs"
								row={epcData.id}
								actions={exportActions}
								ariaLabel="Activity planner export actions"
								triggerLabel="Export"
								triggerVariant="brand"
							/>
						}
						sections={tabContent.sections}
						padding="none"
					>
						{tabContent.body}
					</Card>

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
