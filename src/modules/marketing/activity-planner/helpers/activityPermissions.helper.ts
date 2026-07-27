// helpers/activityPermissions.helper.ts

import type { EpcDetailResponse } from "../types/epc.types";
import type { EventReportDetail } from "../types/event.report.types";
import {
	hasFormUpdateAfterIssue,
	hasUnresolvedClarificationInComments,
	hasUnresolvedDeviationInComments,
	isReportFlowStatus,
	isStatus,
	type WorkflowEntry,
} from "./activityPlannerStatus.helper";

export type ActivityEditSection = "epc" | "crf" | "epf" | "report";

const normalizeStatus = (status?: string | null) =>
	String(status ?? "")
		.trim()
		.toUpperCase();

const CLOSED_STATUSES = ["CLOSED", "EPC_CLOSED"];

const LOCKED_FORM_STATUSES = [
	"APPROVED",
	"RECOMMENDED",
	"CONDUCTED",
	"REPORT_SUBMITTED",
	"REPORT_VALIDATED",
	"VALIDATED",
	"CLOSED",
	"EPC_CLOSED",
];

const FORM_EDIT_REOPEN_STATUSES = [
	"CLARIFY",
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
	"DEVIATION_IN_PROGRESS",
];

const REPORT_EDITABLE_STATUSES = [
	"REPORT_REJECTED",
	"REJECTED",
	"REPORT_CLARIFICATION_REQUESTED",
	"CLARIFY_REPORT",
];
export const REPORT_ELIGIBLE_STATUSES = new Set([
	"CONDUCTED",
	"REPORT_SUBMITTED",
	"CLARIFY_REPORT",
	"VALIDATED",
	"DEVIATION_IN_PROGRESS",
	"CLOSED",
]);
const hasDeviationData = (epcData?: EpcDetailResponse | null) => {
	return Boolean(
		epcData?.deviationAmount ||
		epcData?.deviationReason ||
		epcData?.deviationDocUrl ||
		epcData?.deviationDocS3Key,
	);
};

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
	const status = normalizeStatus(epcData?.status);
	const reportStatus = normalizeStatus(report?.status);

	const isExistingEpc = Boolean(epcData?.id);
	const reportValidatorId = report?.validatorId;
	const isProposer = Boolean(userId && epcData?.created_by_id === userId);
	const isValidator = Boolean(reportValidatorId === userId);

	const isClosed = CLOSED_STATUSES.includes(status);
	const isFormLocked = LOCKED_FORM_STATUSES.includes(status);
	const isFormReopened = FORM_EDIT_REOPEN_STATUSES.includes(status);

	const isReportCreated = Boolean(report?.id);
	const isReportSubmitted = [
		"REPORT_SUBMITTED",
		"SUBMITTED",
		"REPORT_RESUBMITTED",
		"RESUBMITTED",
	].includes(reportStatus);
	const isReportValidated = ["REPORT_VALIDATED", "VALIDATED"].includes(
		reportStatus,
	);
	const isReportEditable = REPORT_EDITABLE_STATUSES.includes(reportStatus);

	const wasDeviated = hasDeviationData(epcData);

	const hasUnresolvedClarification =
		hasUnresolvedClarificationInComments(workflowEntries);

	const hasUnresolvedDeviation =
		hasUnresolvedDeviationInComments(workflowEntries);

	const hasClarificationFormUpdate = hasFormUpdateAfterIssue(
		workflowEntries,
		"CLARIFICATION",
	);

	const hasDeviationFormUpdate = hasFormUpdateAfterIssue(
		workflowEntries,
		"DEVIATION",
	);

	const canEditNormalForm =
		isProposer && isExistingEpc && !isClosed && !isFormLocked;

	const canEditReopenedForm =
		isProposer && isExistingEpc && !isClosed && isFormReopened;

	const canEditAnyForm = canEditNormalForm || canEditReopenedForm;

	const isClarifiedPending =
		isProposer && !isClosed && hasUnresolvedClarification;

	const isDeviationPending =
		isProposer &&
		!isClosed &&
		isStatus(epcData?.status, "DEVIATION_IN_PROGRESS") &&
		hasUnresolvedDeviation;

	const canCreateReport =
		isProposer &&
		!isClosed &&
		isReportFlowStatus(epcData?.status) &&
		!isReportCreated &&
		!wasDeviated;

	const canShowReportSection = isReportCreated || canCreateReport;

	const canProposerEditReport =
		isProposer && !isClosed && isReportCreated && isReportEditable;

	const canPreviewReport = isReportCreated;
	const canPreview = isReportCreated;
	const canValidateReport =
		isValidator &&
		!isClosed &&
		isReportSubmitted &&
		Boolean(hasValidatorPreviewed) &&
		Boolean(report?.id);

	const canClarifyReport =
		isValidator &&
		!isClosed &&
		isReportSubmitted &&
		Boolean(hasValidatorPreviewed) &&
		Boolean(report?.id);

	const canShowInitialEventOutcome =
		isProposer && !isClosed && status === "APPROVED" && !wasDeviated;

	const canShowPostReportEventOutcome =
		isProposer && !isClosed && status === "VALIDATED" && !wasDeviated;

	const canShowCloseEpcAction =
		isProposer && !isClosed && (wasDeviated || status === "VALIDATED");

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

		// EPC / CRF / EPF permissions
		canEditAnyForm,
		canEditEpc: canEditAnyForm,
		canEditCrf: canEditAnyForm && Boolean(epcData?.crf),
		canEditEpf: canEditAnyForm && Boolean(epcData?.epf),

		canCreateCrf: isProposer && isExistingEpc && !isClosed && !epcData?.crf,

		canCreateEpf: isProposer && isExistingEpc && !isClosed && !epcData?.epf,

		// report permissions
		canCreateReport,
		canShowReportSection,
		canProposerEditReport,
		canPreviewReport,
		canValidateReport,
		canClarifyReport,

		// event outcome permissions
		canShowInitialEventOutcome,
		canShowPostReportEventOutcome,

		// close EPC
		canShowCloseEpcAction,
		canCloseEpc: canShowCloseEpcAction,

		// resubmission permissions
		isClarifiedPending,
		isDeviationPending,
		canSubmitClarifiedUpdate: isClarifiedPending && hasClarificationFormUpdate,

		canSubmitDeviationUpdate: isDeviationPending && hasDeviationFormUpdate,
		canPreview,
	};
};

export type ActivityPermissions = ReturnType<typeof getActivityPermissions>;
