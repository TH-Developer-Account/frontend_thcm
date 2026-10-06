// utils/activity.ts
// Merged from: activityPlannerStatus.helper.ts, activityPermissions.helper.ts,
// eventOutcome.helper.ts (activityLogMessage.helper.ts was empty — deleted).

import type { WorkflowActivityEntry } from "../../../workflows/types/types";
import { normalizeWorkflowStatus } from "../../../workflows/utils/status";
import type { EpcDetailResponse, EpcListItem } from "../types/epc.types";
import type { EventReportDetail } from "../types/epc.types";
import { toTimestamp } from "./common";

export type WorkflowEntry = WorkflowActivityEntry;
export type WorkflowIssueType = "CLARIFICATION" | "DEVIATION";
export type ActivityEditSection = "epc" | "crf" | "epf" | "report";
export type EventOutcomeMode = "OUTCOME" | "DEVIATION_IN_PROGRESS";

// ─── Status sets ──────────────────────────────────────────────────────────────

const statusSet = (...statuses: string[]): ReadonlySet<string> =>
	new Set(statuses);

const CLOSED_STATUSES = statusSet("CLOSED", "EPC_CLOSED");

const LOCKED_FORM_STATUSES = statusSet(
	"APPROVED",
	"RECOMMENDED",
	"CONDUCTED",
	"REPORT_SUBMITTED",
	"REPORT_VALIDATED",
	"VALIDATED",
	"CLOSED",
	"EPC_CLOSED",
);

const FORM_EDIT_REOPEN_STATUSES = statusSet(
	"CLARIFY",
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
	"DEVIATION_IN_PROGRESS",
);

const REPORT_EDITABLE_STATUSES = statusSet(
	"REPORT_REJECTED",
	"REJECTED",
	"REPORT_CLARIFICATION_REQUESTED",
	"CLARIFY_REPORT",
);

const REPORT_SUBMITTED_STATUSES = statusSet(
	"REPORT_SUBMITTED",
	"SUBMITTED",
	"REPORT_RESUBMITTED",
	"RESUBMITTED",
);

const REPORT_VALIDATED_STATUSES = statusSet("REPORT_VALIDATED", "VALIDATED");

const REPORT_FLOW_STATUSES = [
	"CONDUCTED",
	"CLARIFY_REPORT",
	"REPORT_SUBMITTED",
];

export const REPORT_ELIGIBLE_STATUSES = statusSet(
	"CONDUCTED",
	"REPORT_SUBMITTED",
	"CLARIFY_REPORT",
	"VALIDATED",
	"DEVIATION_IN_PROGRESS",
	"CLOSED",
);

const ACTIVITY_FORM_UPDATE_ACTIONS = statusSet(
	"EPC_UPDATED",
	"EPF_UPDATED",
	"CRF_UPDATED",
);

const WORKFLOW_ISSUE_CONFIG: Record<
	WorkflowIssueType,
	{ trigger: ReadonlySet<string>; resolve: ReadonlySet<string> }
> = {
	CLARIFICATION: {
		trigger: statusSet("CLARIFY", "CLARIFIED"),
		resolve: statusSet(
			"CLARIFIED_RESUBMITTED",
			"RESUBMITTED",
			"EPC_RESUBMITTED",
		),
	},
	DEVIATION: {
		trigger: statusSet("DEVIATION_RAISED", "DEVIATION_IN_PROGRESS"),
		resolve: statusSet("EPC_RESUBMITTED"),
	},
};

// ─── Status checks ────────────────────────────────────────────────────────────

export const isStatus = (
	status: string | null | undefined,
	match: string | string[],
): boolean => {
	const current = normalizeWorkflowStatus(status);
	const values = Array.isArray(match) ? match : [match];
	return values.some((value) => normalizeWorkflowStatus(value) === current);
};

export const isPendingStatus = (s?: string | null) => isStatus(s, "PENDING");
export const isDeviationStatus = (s?: string | null) =>
	isStatus(s, "DEVIATION_IN_PROGRESS");
export const isReportFlowStatus = (s?: string | null) =>
	isStatus(s, REPORT_FLOW_STATUSES);

export const getEventOutcomeMode = (
	eventStatus?: string | null,
): EventOutcomeMode | null => {
	const status = normalizeWorkflowStatus(eventStatus);
	if (status === "APPROVED") return "OUTCOME";
	if (status === "RECOMMENDED" || status === "VALIDATED") {
		return "DEVIATION_IN_PROGRESS";
	}
	return null;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const getUserId = (authUser: unknown): string | null => {
	if (!authUser || typeof authUser !== "object") return null;
	const u = authUser as any;
	return (
		u.id ??
		u.userId ??
		u.user_id ??
		u.user?.id ??
		u.user?.userId ??
		u.data?.id ??
		u.profile?.id ??
		null
	);
};

// ─── Workflow issues (clarification / deviation) ──────────────────────────────

/** Normalized ACTIVITY_LOG actions, oldest first. */
const getActivityLogActions = (entries: WorkflowEntry[]): string[] =>
	entries
		.filter(
			(entry) => normalizeWorkflowStatus(entry.entryType) === "ACTIVITY_LOG",
		)
		.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt))
		.map((entry) => normalizeWorkflowStatus(entry.action));

/** Actions logged after the latest trigger of `issueType`; null if never raised. */
const getActionsAfterLatestIssue = (
	entries: WorkflowEntry[],
	issueType: WorkflowIssueType,
): string[] | null => {
	const actions = getActivityLogActions(entries);
	const { trigger } = WORKFLOW_ISSUE_CONFIG[issueType];

	let index = actions.length - 1;
	while (index >= 0 && !trigger.has(actions[index])) index -= 1;

	return index === -1 ? null : actions.slice(index + 1);
};

export const hasUnresolvedWorkflowIssue = (
	entries: WorkflowEntry[] = [],
	issueType: WorkflowIssueType,
): boolean => {
	const after = getActionsAfterLatestIssue(entries, issueType);
	const { resolve } = WORKFLOW_ISSUE_CONFIG[issueType];
	return after !== null && !after.some((action) => resolve.has(action));
};

export const hasFormUpdateAfterIssue = (
	entries: WorkflowEntry[] = [],
	issueType: WorkflowIssueType,
	formUpdateActions: Iterable<string> = ACTIVITY_FORM_UPDATE_ACTIONS,
): boolean => {
	const after = getActionsAfterLatestIssue(entries, issueType);
	if (!after) return false;

	const updates = new Set(
		Array.from(formUpdateActions, (action) => normalizeWorkflowStatus(action)),
	);
	return after.some((action) => updates.has(action));
};

export const hasUnresolvedClarificationInComments = (
	entries: WorkflowEntry[] = [],
) => hasUnresolvedWorkflowIssue(entries, "CLARIFICATION");

export const hasUnresolvedDeviationInComments = (
	entries: WorkflowEntry[] = [],
) => hasUnresolvedWorkflowIssue(entries, "DEVIATION");

// ─── Permissions ──────────────────────────────────────────────────────────────

const hasDeviationData = (epc?: EpcDetailResponse | null) =>
	Boolean(
		epc?.deviationAmount ||
		epc?.deviationReason ||
		epc?.deviationDocUrl ||
		epc?.deviationDocS3Key,
	);

type GetActivityPermissionsArgs = {
	epcData?: EpcDetailResponse | null;
	report?: EventReportDetail | null;
	userId?: string | null;
	workflowEntries?: WorkflowEntry[];
	hasValidatorPreviewed?: boolean;
};

export const getActivityPermissions = ({
	epcData,
	report,
	userId,
	workflowEntries = [],
	hasValidatorPreviewed = false,
}: GetActivityPermissionsArgs) => {
	const status = normalizeWorkflowStatus(epcData?.status);
	const reportStatus = normalizeWorkflowStatus(report?.status);

	// identity
	const isProposer = Boolean(userId && epcData?.created_by_id === userId);
	const isValidator = Boolean(userId && report?.validatorId === userId);

	// state
	const isExistingEpc = Boolean(epcData?.id);
	const isReportCreated = Boolean(report?.id);
	const isClosed = CLOSED_STATUSES.has(status);
	const isFormLocked = LOCKED_FORM_STATUSES.has(status);
	const isFormReopened = FORM_EDIT_REOPEN_STATUSES.has(status);
	const isReportSubmitted = REPORT_SUBMITTED_STATUSES.has(reportStatus);
	const isReportValidated = REPORT_VALIDATED_STATUSES.has(reportStatus);
	const isReportEditable = REPORT_EDITABLE_STATUSES.has(reportStatus);
	const wasDeviated = hasDeviationData(epcData);

	// shared guards
	const proposerCanAct = isProposer && !isClosed;
	const canManageEpc = proposerCanAct && isExistingEpc;
	const canEditAnyForm = canManageEpc && (!isFormLocked || isFormReopened);

	const isClarifiedPending =
		proposerCanAct && hasUnresolvedClarificationInComments(workflowEntries);

	const isDeviationPending =
		proposerCanAct &&
		status === "DEVIATION_IN_PROGRESS" &&
		hasUnresolvedDeviationInComments(workflowEntries);

	const canCreateReport =
		proposerCanAct &&
		isReportFlowStatus(status) &&
		!isReportCreated &&
		!wasDeviated;

	const canReviewReport =
		isValidator &&
		!isClosed &&
		isReportSubmitted &&
		hasValidatorPreviewed &&
		isReportCreated;

	const canShowCloseEpcAction =
		proposerCanAct && (wasDeviated || status === "VALIDATED");

	const canShowEventOutcomeAt = (target: string) =>
		proposerCanAct && !wasDeviated && status === target;

	return {
		// identity
		isProposer,
		isValidator,

		// state
		status,
		reportStatus,
		isClosed,
		isFormLocked,
		isFormReopened,
		wasDeviated,
		isReportCreated,
		isReportSubmitted,
		isReportValidated,
		isReportEditable,

		// EPC / CRF / EPF
		canEditAnyForm,
		canEditEpc: canEditAnyForm,
		canEditCrf: canEditAnyForm && Boolean(epcData?.crf),
		canEditEpf: canEditAnyForm && Boolean(epcData?.epf),
		canCreateCrf: canManageEpc && !epcData?.crf,
		canCreateEpf: canManageEpc && !epcData?.epf,

		// report
		canCreateReport,
		canShowReportSection: isReportCreated || canCreateReport,
		canProposerEditReport:
			proposerCanAct && isReportCreated && isReportEditable,
		canPreview: isReportCreated,
		canPreviewReport: isReportCreated,
		canValidateReport: canReviewReport,
		canClarifyReport: canReviewReport,

		// event outcome
		canShowInitialEventOutcome: canShowEventOutcomeAt("APPROVED"),
		canShowPostReportEventOutcome: canShowEventOutcomeAt("VALIDATED"),

		// close EPC
		canShowCloseEpcAction,
		canCloseEpc: canShowCloseEpcAction,

		// resubmission
		isClarifiedPending,
		isDeviationPending,
		canSubmitClarifiedUpdate:
			isClarifiedPending &&
			hasFormUpdateAfterIssue(workflowEntries, "CLARIFICATION"),
		canSubmitDeviationUpdate:
			isDeviationPending &&
			hasFormUpdateAfterIssue(workflowEntries, "DEVIATION"),
	};
};
// ─── Listing row actions ──────────────────────────────────────────────────────

/**
 * Statuses where the proposer can still edit the EPC from the listing:
 * awaiting approval, or sent back for clarification.
 * Adjust here if backend status names differ.
 */
const ROW_EDITABLE_STATUSES = statusSet(
	"PENDING",
	"SUBMITTED",
	"IN_PROGRESS",
	"CLARIFY",
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
);

export type EpcRowActionRules = {
	isProposer: boolean;
	canEdit: boolean;
	canAddCrf: boolean;
	canAddEpf: boolean;
};

/**
 * Visibility rules for the EPC listing action menu.
 * Mirrors getActivityPermissions (proposer-only, not closed) so the listing
 * and the detail page never disagree.
 */
export const getEpcRowActionRules = (
	row: Pick<EpcListItem, "status" | "created_by_id" | "crf_id" | "epf_id">,
	userId?: string | null,
): EpcRowActionRules => {
	const status = normalizeWorkflowStatus(row.status);
	const isProposer = Boolean(userId && row.created_by_id === userId);
	const canManage = isProposer && !CLOSED_STATUSES.has(status);

	return {
		isProposer,
		canEdit: canManage && ROW_EDITABLE_STATUSES.has(status),
		canAddCrf: canManage && !row.crf_id,
		canAddEpf: canManage && !row.epf_id,
	};
};

export type ActivityPermissions = ReturnType<typeof getActivityPermissions>;
