import type { EpcDetailResponse } from "../types/epc.types";

export type UpdatedSection = "epc" | "crf" | "epf";

export type WorkflowEntry = {
	entryType?: string | null;
	action?: string | null;
	reason?: string | null;
	message?: string | null;
	isActiveWorkflow?: boolean | null;
	workflowId?: string | null;
	createdAt?: string | null;
};

const normalize = (value: unknown) => String(value ?? "").toUpperCase();

export const hasClarificationInComments = (entries: WorkflowEntry[] = []) => {
	return entries.some((entry) => {
		return (
			entry.isActiveWorkflow !== false &&
			normalize(entry.entryType) === "AUDIT_LOG" &&
			normalize(entry.action) === "CLARIFY"
		);
	});
};

export const hasAnyUpdatedSection = (updatedSections: Set<UpdatedSection>) => {
	return updatedSections.size > 0;
};

export const getUpdatedSectionsLabel = (
	updatedSections: Set<UpdatedSection>,
) => {
	if (!updatedSections.size) return "No section updated yet";

	return `${updatedSections.size} section${
		updatedSections.size > 1 ? "s" : ""
	} updated`;
};

export const isPendingEpc = (epcData?: EpcDetailResponse | null) => {
	return normalize(epcData?.status) === "PENDING";
};
