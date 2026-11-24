// pages/CppViewPage.tsx — CPP request detail ("view") page.
// Left tab nav · main tab card · right Decision + Audit Trail.
// The "CPP Document" tab shows the price approval sheet (CppPdfView), drawn from the saved request.
// The form tabs are the same components as the create wizard, rendered
// read-only: the saved request is loaded into a form (detailToForm) and the
// tabs run in view mode (CppReadOnlyProvider).
// Amortisation is listed only when the pricing condition is the amortised one.
import { useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
	ArrowLeft,
	ClipboardClock,
	FileCode,
	FileDown,
	FileSpreadsheet,
	FileText,
	History,
	Pencil,
} from "lucide-react";
import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import ApprovalActionsBar from "../../../components/ui/ApprovalActionsBar";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { AuditLogSection } from "../../../components/ui/audit";
import {
	CommentsSection,
	getWorkflowCommentContext,
	type MentionableUserInput,
} from "../../../components/ui/comments";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import {
	getWorkflowApproverData,
	type ActiveWorkflowLike,
	type ApprovalStageLike,
} from "../../workflows";
import {
	useApproveWorkflowStageMutation,
	useClarifyWorkflowStageMutation,
} from "../../workflows/context/useWorkflowMutations";

import CppPdfView, { type CppPdfStage } from "../components/CppPdfView";
import { CppReadOnlyProvider } from "../components/CppFields";
import CppWorkflowTable from "../components/CppWorkflowTable";
import { detailToForm } from "../helpers/cpp.mapper";
import { useCppDetail } from "../hooks/useCppMutations";
import type { CppDetail, CppFormValues } from "../types/cpp.types";
import { AMORTISED_CONDITION, getDefaultValues } from "../utils/cpp.utils";
import AmortisationTab from "../tabs/AmortisationTab";
import AttachmentsTab from "../tabs/AttachmentsTab";
import BasicDetailsTab from "../tabs/BasicDetailsTab";
import FinancialImpactTab from "../tabs/FinancialImpactTab";
import MasterDataTab from "../tabs/MasterDataTab";
import MaterialCostTrackerTab from "../tabs/MaterialCostTrackerTab";
import OtherDataTab from "../tabs/OtherDataTab";
import PurchasingDetailsTab from "../tabs/PurchasingDetailsTab";
import { useCppExport } from "../hooks/useCppExport";

const LISTING_URL = "/cpp/listing";
/** The proposer can edit a draft, or a request sent back for clarification. */
const EDITABLE_STATUSES = ["DRAFT", "CLARIFICATION_REQUESTED"];
/** Subject type the workflow, audit and comment APIs know CPP requests by. */
const CPP_SUBJECT_TYPE = "CPP_REQUEST";

/* -------------------------------- workflow ------------------------------- */

const PART_PREFIX = /^(WF[12])\s*·\s*/;
const PART_TITLES: Record<string, string> = {
	WF1: "WF1 · Plant / SCM approval",
	WF2: "WF2 · CPP committee approval",
};

type CppActiveWorkflow = ActiveWorkflowLike<ApprovalStageLike> | null;

/** One workflow, two labelled tables: stages are tagged "WF1 · …" / "WF2 · …". */
const splitStages = (stages: ApprovalStageLike[]) => {
	const parts = new Map<string, ApprovalStageLike[]>();
	for (const stage of stages) {
		const name = String((stage as { name?: string }).name ?? "");
		const match = PART_PREFIX.exec(name);
		const key = match?.[1] ?? "WF1";
		parts.set(key, [
			...(parts.get(key) ?? []),
			{
				...stage,
				name: match ? name.replace(PART_PREFIX, "") : name,
			} as ApprovalStageLike,
		]);
	}
	return [...parts.entries()].sort(([a], [b]) => a.localeCompare(b));
};

/* ------------------------- detail response shape ------------------------- */

type CppViewDetail = Omit<CppDetail, "initiatedBy"> & {
	initiatedBy?: {
		id: string;
		name: string | null;
		email: string | null;
	} | null;
	initiatedById?: string | null;
	activeWorkflow?: CppActiveWorkflow;
	createdBy?: MentionableUserInput | null;
};

/* --------------------------------- tabs ---------------------------------- */

type CppViewTab =
	| "document"
	| "basic"
	| "purchasing"
	| "financial"
	| "amortisation"
	| "tracker"
	| "master"
	| "other"
	| "attachments"
	| "workflow"
	| "comments";

const CppViewPage = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { showToast } = useToast();
	const { id = "" } = useParams<{ id: string }>();
	const { data, isLoading, isError, error, refetch } = useCppDetail(id);
	const cpp = data as unknown as CppViewDetail | undefined;

	const { exportAs, exportBusy } = useCppExport(id, cpp?.referenceNumber);

	const approveStage = useApproveWorkflowStageMutation();
	const clarifyStage = useClarifyWorkflowStageMutation();
	const [activeTab, setActiveTab] = useState<CppViewTab>("document");
	const [actionBusy, setActionBusy] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	/* The saved request, as the form values the wizard tabs read. */
	const formValues = useMemo(
		() => (cpp ? detailToForm(cpp as unknown as CppDetail) : undefined),
		[cpp],
	);

	// TEMP DEBUG — remove after checking
	console.log(
		"[CPP debug]",
		JSON.stringify(
			{
				rawBasicData: cpp?.sections?.find((s) => s.key === "basic")?.data,
				initiationDate: formValues?.initiationDate,
				suppliers: formValues?.suppliers,
				approvalValues: formValues?.approvalValues,
			},
			null,
			2,
		),
	);

	const viewForm = useForm<CppFormValues>({
		defaultValues: getDefaultValues(),
		values: formValues,
	});

	const activeWorkflow = cpp?.activeWorkflow ?? null;
	const attachments = useMemo(() => cpp?.attachments ?? [], [cpp]);
	const showAmortisation =
		formValues?.workflow.pricingCondition === AMORTISED_CONDITION;

	const workflowData = useMemo(
		() => getWorkflowApproverData(activeWorkflow, user),
		[activeWorkflow, user],
	);
	const workflowParts = useMemo(
		() => splitStages(workflowData.stages as ApprovalStageLike[]),
		[workflowData.stages],
	);
	/* Every stage, with the "WF1 · " / "WF2 · " tag removed, for the sheet's approver blocks. */
	const pdfStages = useMemo(
		() =>
			workflowParts.flatMap(([, stages]) => stages) as unknown as CppPdfStage[],
		[workflowParts],
	);

	const creator = cpp?.initiatedBy?.id
		? (cpp.initiatedBy as MentionableUserInput)
		: (cpp?.createdBy ?? null);
	const commentContext = useMemo(
		() =>
			getWorkflowCommentContext({
				activeWorkflow,
				currentUser: user,
				creator,
			}),
		[activeWorkflow, creator, user],
	);

	const ownerId = cpp?.initiatedById ?? cpp?.initiatedBy?.id;
	const canEdit =
		Boolean(user?.id) &&
		ownerId === user?.id &&
		EDITABLE_STATUSES.includes(String(cpp?.status));
	const showComments = Boolean(activeWorkflow) && commentContext.canComment;
	const showDecisionCard =
		cpp?.status !== "DRAFT" && Boolean(workflowData.canActNow);

	const tabs = useMemo(() => {
		const list: { value: CppViewTab; label: string }[] = [
			{ value: "document", label: "CPP Document" },
			{ value: "basic", label: "Basic Details" },
			{ value: "purchasing", label: "Purchasing Details" },
			{ value: "financial", label: "Financial Impact" },
		];
		if (showAmortisation)
			list.push({ value: "amortisation", label: "Amortisation" });
		list.push(
			{ value: "tracker", label: "Material Cost Tracker" },
			{ value: "master", label: "Master Data" },
			{ value: "other", label: "Other Data" },
			{ value: "attachments", label: `Attachments (${attachments.length})` },
		);
		if (activeWorkflow) list.push({ value: "workflow", label: "Workflow" });
		if (showComments) list.push({ value: "comments", label: "Comments" });
		return list;
	}, [activeWorkflow, attachments.length, showAmortisation, showComments]);
	const currentTab = tabs.some((t) => t.value === activeTab)
		? activeTab
		: tabs[0].value;

	const exportActions: ActionMenuItem<string>[] = [
		{
			id: "export-pdf",
			label: exportBusy === "pdf" ? "Exporting…" : "PDF",
			Icon: FileDown,
			onClick: () => void exportAs("pdf"),
			disabled: exportBusy !== null,
		},
		{
			id: "export-excel",
			label: exportBusy === "excel" ? "Exporting…" : "Excel",
			Icon: FileSpreadsheet,
			onClick: () => void exportAs("excel"),
			disabled: exportBusy !== null,
		},
		{
			id: "export-text",
			label: exportBusy === "text" ? "Exporting…" : "ZINFOUPDATE_ME11",
			Icon: FileText,
			onClick: () => void exportAs("text"),
			disabled: exportBusy !== null,
		},
		{
			id: "export-changeinfo",
			label: exportBusy === "changeinfo" ? "Exporting…" : "ZCHANGEINFO",
			Icon: FileCode,
			onClick: () => void exportAs("changeinfo"),
			disabled: exportBusy !== null,
		},
	];

	/* ------------------------- approve / clarify -------------------------- */

	const runStageAction = async (
		kind: "approve" | "clarify",
		reason: string,
	) => {
		const stageId = workflowData.currentStage?.id;
		if (!stageId) return;
		setActionBusy(true);
		try {
			const mutate = (kind === "approve" ? approveStage : clarifyStage)
				.mutateAsync as unknown as (
				stageId: string,
				comment?: string,
			) => Promise<{ message?: string } | undefined>;
			const response = await mutate(stageId, reason);
			showToast({
				type: "success",
				title:
					kind === "approve" ? "Stage approved" : "Clarification requested",
				description: response?.message ?? "Your decision has been recorded.",
			});
			await refetch();
			setRefreshKey((key) => key + 1);
		} catch (err) {
			showToast({
				type: "error",
				title:
					kind === "approve"
						? "Unable to approve"
						: "Unable to request clarification",
				description: getApiErrorMessage(err, "Please try again."),
			});
		} finally {
			setActionBusy(false);
		}
	};

	/* -------------------------------- header ------------------------------ */

	const header = (
		<PageHeader
			headerText={cpp ? `CPP Request ${cpp.referenceNumber}` : "CPP Request"}
			navigation={{
				variant: "breadcrumbs",
				ariaLabel: "CPP request location",
				breadcrumbs: [
					{ label: "Home Screen", href: "/" },
					{ label: "Contract & Price Panel Committe", href: LISTING_URL },
					{ label: cpp?.referenceNumber ?? "CPP Request" },
				],
				separator: "›",
			}}
			headerChildren={
				<>
					<Button
						type="button"
						text="Back to listing"
						Icon={ArrowLeft}
						iconPosition="left"
						iconSize={16}
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={() => navigate(LISTING_URL)}
					/>
					{cpp && canEdit ? (
						<Button
							type="button"
							text={
								cpp.status === "CLARIFICATION_REQUESTED"
									? "Edit for clarification"
									: "Continue editing"
							}
							Icon={Pencil}
							iconPosition="left"
							iconSize={16}
							size="sm"
							onClick={() => navigate(`/cpp/${cpp.id}/edit`)}
						/>
					) : null}
					{cpp ? (
						<ActionMenu
							size="sm"
							row={cpp.id}
							actions={exportActions}
							ariaLabel="CPP export actions"
							triggerLabel="Export"
							triggerVariant="brand"
						/>
					) : null}
				</>
			}
		/>
	);

	/* -------------------------------- states ------------------------------ */

	if (isLoading) {
		return (
			<PageSectionLayout>
				<Card padding="spacious">
					<p role="status">Loading CPP request…</p>
				</Card>
			</PageSectionLayout>
		);
	}

	if (isError || !cpp) {
		return (
			<PageSectionLayout>
				{header}
				<Card padding="spacious">
					<div className="flex flex-col items-start gap-3">
						<p className="text-sm text-rejected" role="alert">
							{getApiErrorMessage(error, "Unable to load this CPP request.")}
						</p>
						<Button
							type="button"
							text="Retry"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={() => void refetch()}
						/>
					</div>
				</Card>
			</PageSectionLayout>
		);
	}

	/* ------------------------------ tab content --------------------------- */

	const renderTab = (): ReactNode => {
		switch (currentTab) {
			case "document":
				return formValues ? (
					<CppPdfView
						values={formValues}
						referenceNumber={cpp.referenceNumber}
						stages={pdfStages}
						initiatedBy={
							cpp.initiatedBy?.name ?? cpp.initiatedBy?.email ?? null
						}
					/>
				) : null;

			case "basic":
				return <BasicDetailsTab />;

			case "purchasing":
				return <PurchasingDetailsTab />;

			case "financial":
				return <FinancialImpactTab />;

			case "amortisation":
				return <AmortisationTab />;

			case "tracker":
				return <MaterialCostTrackerTab />;

			case "master":
				return <MasterDataTab />;

			case "other":
				return <OtherDataTab />;

			case "attachments":
				return <AttachmentsTab />;

			case "workflow":
				return workflowParts.length > 0 ? (
					<div className="flex flex-col gap-6">
						{workflowParts.map(([key, stages]) => (
							<section key={key} aria-label={PART_TITLES[key] ?? key}>
								<h3 className="mb-2 text-sm font-semibold text-slate-700">
									{PART_TITLES[key] ?? key}
								</h3>
								<CppWorkflowTable stages={stages} />
							</section>
						))}
					</div>
				) : (
					<CardEmpty
						title="No applicable workflow found"
						description="No workflow stages are available for this request."
						Icon={ClipboardClock}
					/>
				);

			case "comments":
				return (
					<CommentsSection
						subjectType={CPP_SUBJECT_TYPE}
						subjectId={cpp.id}
						approvalId={commentContext.approvalId}
						canComment={commentContext.canComment}
						mentionableUsers={commentContext.mentionableUsers}
						ccEmails={commentContext.ccEmails}
						currentUserId={user?.id}
						refreshKey={refreshKey}
						emptyTitle="No comments yet"
						emptyDescription="Comments about this CPP request will appear here."
					/>
				);

			default:
				return null;
		}
	};

	/* -------------------------------- render ------------------------------ */

	const isSubmitted = cpp.status !== "DRAFT";
	// const showSideColumn = isSubmitted;

	const isDocumentTab = currentTab === "document";
	const showSideColumn = isSubmitted && !isDocumentTab;

	return (
		<PageSectionLayout>
			{header}
			<div className="cpp-view">
				{/* ── Body: left tab nav · tab card (main) · decision + audit (right) ── */}
				<div
					className={["cpp-view-body", showSideColumn && "has-side-panels"]
						.filter(Boolean)
						.join(" ")}
				>
					<Card
						as="nav"
						aria-label="CPP request sections"
						title="Request Details"
						padding="compact"
					>
						<ul className="cpp-view-nav-list">
							{tabs.map((tab) => {
								const active = tab.value === currentTab;
								return (
									<li key={tab.value}>
										<button
											type="button"
											className={`cpp-view-nav-item${active ? " is-active" : ""}`}
											aria-current={active ? "page" : undefined}
											onClick={() => setActiveTab(tab.value)}
										>
											{tab.label}
										</button>
									</li>
								);
							})}
						</ul>
					</Card>

					<div className="cpp-view-main min-w-0">
						<Card padding="default">
							<FormProvider {...viewForm}>
								<CppReadOnlyProvider value>{renderTab()}</CppReadOnlyProvider>
							</FormProvider>
						</Card>
					</div>

					{showSideColumn ? (
						<aside
							className="cpp-view-side"
							aria-label="Decision and audit trail"
						>
							{/* Approver only, and only while they can act on this stage. */}
							{showDecisionCard ? (
								<>
									<span className="cpp-view-awaiting">
										Awaiting your approval
									</span>
									{/* // In the main column, above the tab card: */}
									{isDocumentTab && showDecisionCard ? (
										<ApprovalActionsBar
											variant="approver"
											layout="card"
											showBack={false}
											canApprove={workflowData.canActNow}
											canClarify={workflowData.canActNow}
											onApprove={(reason) => runStageAction("approve", reason)}
											onClarify={(reason) => runStageAction("clarify", reason)}
											loading={actionBusy}
										/>
									) : null}
								</>
							) : null}

							<Card
								className="cpp-view-panel"
								accordion
								defaultExpanded
								title={
									<span className="cpp-view-panel-title">
										<History size={15} aria-hidden="true" />
										Audit Trail
									</span>
								}
								padding="none"
								bodyClassName="cpp-view-panel-body"
							>
								<AuditLogSection
									subjectType={CPP_SUBJECT_TYPE}
									subjectId={cpp.id}
									entityName="CPP request"
									refreshKey={refreshKey}
									emptyTitle="No CPP activity yet"
									emptyDescription="CPP request activity will appear here."
								/>
							</Card>
						</aside>
					) : null}
				</div>
			</div>
		</PageSectionLayout>
	);
};

export default CppViewPage;
