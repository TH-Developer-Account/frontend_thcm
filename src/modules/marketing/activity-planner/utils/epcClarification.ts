// utils/epcClarification.ts
// "Clarified" = an approver sent a submitted EPC back to its proposer.
//
// Backend facts this relies on:
//   • createEPF sets the EPC to SUBMITTED BEFORE any workflow is attached, so an
//     EPC that has a workflow AND is PENDING can only come from clarifyStage
//     (clarifyResetStatus.EVENT_PROPOSAL = "PENDING").
//   • clarifyStage opens iteration N+1 with every stage PENDING, so no
//     current-iteration stage is IN_PROGRESS until the proposer resubmits.
//   • Resubmit (activate-first-stage) sets the status to "Resubmitted".
import type { EpcDetailResponse, EpcListItem } from "../types/epc.types";
import type { EpcWizardLocationState } from "../pages/EpcFormsWizardPage";
import { normalizeWorkflowStatus } from "../../../workflows/utils/status";
import { isEpcSubmitted } from "../forms/EPC/epc.utils";
import { EPC_DETAIL_PATH, EPC_FORMS_WIZARD_PATH } from "./constant";

const CLARIFIED_EPC_STATUSES: ReadonlySet<string> = new Set([
	"PENDING",
	"CLARIFY",
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
]);

const isClarifiedStatus = (status?: string | null) =>
	CLARIFIED_EPC_STATUSES.has(normalizeWorkflowStatus(status));

type WorkflowShape = {
	isActive?: boolean;
	iteration?: number;
	workflowType?: string;
	stages?: { status?: string; isCurrentIteration?: boolean | null }[];
};

/** Detail level (wizard): ready for the proposer to edit and resubmit. */
export const isEpcClarified = (epc?: EpcDetailResponse | null): boolean => {
	const wf = epc?.activeWorkflow as unknown as WorkflowShape | null | undefined;

	if (!wf || wf.isActive === false) return false;
	if (wf.workflowType === "DEVIATION") return false; // own resubmit flow
	if (!(Number(wf.iteration) > 1)) return false;
	if (!isClarifiedStatus(epc?.status)) return false;

	const current = (wf.stages ?? []).filter(
		(s) => s.isCurrentIteration !== false,
	);
	return current.length > 0 && !current.some((s) => s.status === "IN_PROGRESS");
};

/** Listing level: rows carry no workflow stages, so status + workflow_id. */
export const isEpcClarifiedRow = (
	row: EpcListItem,
	currentUserId?: string | null,
): boolean =>
	Boolean(currentUserId) &&
	row.created_by_id === currentUserId &&
	isEpcSubmitted(row) &&
	isClarifiedStatus(row.status);

export type EpcOpenRoute = { to: string; state?: EpcWizardLocationState };

/** One decision for the EPC No link and the menu's View. */
export const getEpcOpenRoute = (
	row: EpcListItem,
	currentUserId?: string | null,
): EpcOpenRoute => {
	if (!isEpcSubmitted(row)) {
		return { to: EPC_FORMS_WIZARD_PATH(row.id, "epc") };
	}
	if (isEpcClarifiedRow(row, currentUserId)) {
		return {
			to: EPC_FORMS_WIZARD_PATH(row.id, "epc"),
			state: { mode: "edit" },
		};
	}
	return { to: EPC_DETAIL_PATH(row.id) };
};
