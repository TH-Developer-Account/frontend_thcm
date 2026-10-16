// utils/formatters.ts
// Formatters, EPC display getters, guards, budget share mapping,
// status display helpers (used by the global Badge) and EPF validation.
import type { WorkflowStage } from "../../../workflows";
import type { EpcDetailResponse } from "../types/epc.types";
import type { BudgetItem, EpfFormValues, ShareInfo } from "../types/epf.types";
import {
	STATUS_CONFIG,
	type ApiStatus,
	type StatusLabel,
	type StatusVariant,
} from "./status";

// Previously re-exported from utils/approvalTable.mapper.
// NOTE: getApprovalStrategyLabel is NOT re-exported from workflows here —
// the local version below is the one this module has always exported.
export { mapWorkflowStagesToApprovalRows } from "../../../workflows";
export type {
	ApprovalStageLike,
	MapWorkflowStagesOptions,
} from "../../../workflows";
// add to the imports
import { toNumber } from "./common";

/* ========================================================================== */
/*                                  Internal                                  */
/* ========================================================================== */

const clampPercent = (value: number): number => {
	return Math.min(Math.max(value, 0), 100);
};

/* ========================================================================== */
/*                              Date & currency                               */
/* ========================================================================== */

export const formatDate = (value?: string | null) => {
	if (!value) return "--";

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return "--";

	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export const formatDateTime = (value?: string | null) => {
	if (!value) return "--";

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return "--";

	return date.toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export const formatCurrency = (value?: number | string | null) => {
	const amount = Number(value || 0);

	return amount.toLocaleString("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	});
};

/* ========================================================================== */
/*                             EPC display getters                            */
/* ========================================================================== */

export const getEpcCreatedByName = (
	epcData?: EpcDetailResponse | null,
): string => {
	if (!epcData?.created_by) return "";

	const name = [epcData.created_by.first_name, epcData.created_by.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();

	return name || epcData.created_by.email || "--";
};

export const getEpcDepartmentName = (
	epcData?: EpcDetailResponse | null,
): string => {
	return (
		epcData?.department?.department_name || epcData?.department?.title || "--"
	);
};

export const getEpcVerticalName = (
	epcData?: EpcDetailResponse | null,
): string => {
	return epcData?.vertical?.name || epcData?.vertical?.title || "--";
};

export const getEpcRegionName = (
	epcData?: EpcDetailResponse | null,
): string => {
	return epcData?.region?.region_name || epcData?.region?.title || "--";
};

export const getEpcBranchName = (
	epcData?: EpcDetailResponse | null,
): string => {
	return (
		epcData?.branch?.branch_name ||
		epcData?.branch?.description ||
		epcData?.branch?.title ||
		"--"
	);
};

export const getEpcBudgetValue = (
	epcData?: EpcDetailResponse | null,
): string => {
	return (
		epcData?.budget_master?.value ||
		epcData?.budget_master?.description ||
		epcData?.budget_master?.code ||
		"--"
	);
};

/* ========================================================================== */
/*                                   Guards                                   */
/* ========================================================================== */

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

/* ========================================================================== */
/*                                  Workflow                                  */
/* ========================================================================== */

export const getApprovalStrategyLabel = (stage: WorkflowStage) => {
	const approverCount = stage.approvals?.length ?? 0;
	const minApprovals = stage.minApprovals ?? null;

	if (approverCount <= 1) {
		return "Sequential";
	}

	if (approverCount > 1 && minApprovals === approverCount) {
		return "All Approvers Required";
	}

	if (approverCount > 1 && minApprovals !== approverCount) {
		return "Parallel";
	}

	return "--";
};

export const isCurrentWorkflowStage = (stage: WorkflowStage) => {
	return stage.status === "IN_PROGRESS" && stage.isCurrentIteration;
};

export const isUserStageApprover = (
	stage: WorkflowStage | undefined,
	userId?: string | null,
) => {
	if (!stage || !userId) return false;

	return stage.approvers.some(
		(approval) => approval.id === userId || approval?.id === userId,
	);
};

export const getApprovalIdForUser = (
	stage: WorkflowStage | undefined,
	userId?: string | null,
) => {
	if (!stage || !userId) return null;

	const approval = stage.approvers.find(
		(item) => item.id === userId || item?.id === userId,
	);

	return approval?.id ?? null;
};

/* ========================================================================== */
/*                            EPF budget & validation                         */
/* ========================================================================== */

type BudgetShareInput = {
	annualBudget?: number | string | null;
	availableBudget?: number | string | null;
	allotedBudget?: number | string | null;
	eventBudget?: number | string | null;
	dealerName?: string | null;
	tataHitachiPoAmount?: number | string | null;
	dealerPercent?: number | string | null;
};

export const mapBudgetShareInfo = (data: BudgetShareInput) => {
	const annualBudget = toNumber(data.annualBudget);
	const availableBudget = toNumber(data.availableBudget);
	const allotedBudget = toNumber(data.allotedBudget);
	const eventBudget = toNumber(data.eventBudget);
	const tataHitachiPoAmount = toNumber(data.tataHitachiPoAmount);
	const dealerPercent = clampPercent(toNumber(data.dealerPercent));
	const dealerShare = (eventBudget * dealerPercent) / 100;

	const tataHitachiPercent = 100 - dealerPercent;
	const tataHitachiShare = eventBudget - dealerShare;

	const items: BudgetItem[] = [
		{ label: "Annual Budget", value: annualBudget },
		{ label: "Available Budget", value: availableBudget },
		{ label: "Allotted Budget", value: allotedBudget },
		{ label: "Remaining Amount", value: tataHitachiPoAmount },
		{ label: "Tata Hitachi Po Amount", value: tataHitachiPoAmount },
	];

	const shareInfo: ShareInfo = {
		dealerName: data.dealerName || "-",
		tataHitachiPoAmount,
		dealerPercent,
		dealerShare,
		tataHitachiPercent,
		tataHitachiShare,
		eventBudget: toNumber(data.eventBudget),
	};

	return {
		items,
		shareInfo,
	};
};

export const validateEpfForm = (values: EpfFormValues) => {
	const n = (value: unknown) => Number(value) || 0;
	const errors: Partial<Record<keyof EpfFormValues, string>> = {};

	if (n(values.externalParticipants) < 0) {
		errors.externalParticipants = "External participants cannot be negative";
	}

	if (n(values.internalParticipants) < 0) {
		errors.internalParticipants = "Internal participants cannot be negative";
	}

	if (n(values.totalParticipants) <= 0) {
		errors.totalParticipants = "At least one participant is required";
	}

	if (n(values.eventBudget) <= 0) {
		errors.eventBudget = "Event budget is required";
	}

	if (!values.dealerName?.trim()) {
		errors.dealerName = "Dealer name is required";
	}

	if (n(values.dealerPercent) < 0 || n(values.dealerPercent) > 100) {
		errors.dealerPercent = "Dealer percentage must be between 0 and 100";
	}

	if (n(values.tataHitachiPoAmount) < 0) {
		errors.tataHitachiPoAmount = "PO amount cannot be negative";
	}

	const filledCount = Object.keys(values).filter((key) => {
		const value = values[key as keyof EpfFormValues];

		if (typeof value === "string") return value.trim().length > 0;
		if (typeof value === "number") return Number.isFinite(value);

		return Boolean(value);
	}).length;

	const totalCount = Object.keys(values).length;

	return {
		errors,
		isValid: Object.keys(errors).length === 0,
		progress: {
			filled: filledCount,
			total: totalCount,
			percentage: Math.round((filledCount / totalCount) * 100),
		},
	};
};

/* ========================================================================== */
/*                  Status display (used by the global <Badge />)             */
/* ========================================================================== */
// Intentionally kept separate from status.ts: defaults differ
// ("--" label / "warning" variant here vs "-" / "neutral" in status.ts).

export const normalizeApiStatus = (status?: string | null) =>
	String(status ?? "")
		.trim()
		.toUpperCase();

export const getStatusConfig = (status?: string | null) => {
	const normalized = normalizeApiStatus(status);

	return STATUS_CONFIG[normalized as ApiStatus];
};

export const getStatusLabel = (
	status?: string | null,
): StatusLabel | string => {
	const normalized = normalizeApiStatus(status);

	if (!normalized) return "--";

	return (
		getStatusConfig(normalized)?.label ??
		normalized
			.toLowerCase()
			.split("_")
			.filter(Boolean)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ")
	);
};

export const getStatusVariant = (status?: string | null): StatusVariant => {
	return getStatusConfig(status)?.variant ?? "warning";
};

export const getStatusOptions = () =>
	Object.entries(STATUS_CONFIG).map(([value, config]) => ({
		value,
		label: config.label,
	}));
