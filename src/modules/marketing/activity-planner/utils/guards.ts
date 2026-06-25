import type { EpcDetailResponse, EpcWorkflowStage } from "../types/epc.types";

export const isNonEmptyString = (value: unknown): value is string => {
	return typeof value === "string" && value.trim().length > 0;
};

export const isValidId = (value: unknown): value is string => {
	return isNonEmptyString(value);
};

export const hasCrf = (
	epcData?: EpcDetailResponse | null,
): epcData is EpcDetailResponse & {
	crf: NonNullable<EpcDetailResponse["crf"]>;
} => {
	return Boolean(epcData?.crf?.id);
};

export const hasEpf = (
	epcData?: EpcDetailResponse | null,
): epcData is EpcDetailResponse & {
	epf: NonNullable<EpcDetailResponse["epf"]>;
} => {
	return Boolean(epcData?.epf?.id);
};

export const isCurrentWorkflowStage = (stage: EpcWorkflowStage) => {
	return stage.status === "IN_PROGRESS" && stage.isCurrentIteration;
};

export const isUserStageApprover = (
	stage: EpcWorkflowStage | undefined,
	userId?: string | null,
) => {
	if (!stage || !userId) return false;

	return stage.approvals.some(
		(approval) =>
			approval.approverId === userId || approval.approver?.id === userId,
	);
};

export const getApprovalIdForUser = (
	stage: EpcWorkflowStage | undefined,
	userId?: string | null,
) => {
	if (!stage || !userId) return null;

	const approval = stage.approvals.find(
		(item) => item.approverId === userId || item.approver?.id === userId,
	);

	return approval?.id ?? null;
};
