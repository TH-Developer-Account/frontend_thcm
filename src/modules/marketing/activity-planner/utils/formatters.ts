import type { EpcDetailResponse, EpcWorkflowStage } from "../types/epc.types";
import type { BudgetItem, ShareInfo } from "../types/epf.types";

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

export const getApprovalStrategyLabel = (stage: EpcWorkflowStage) => {
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

const toNumber = (value: unknown): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const clampPercent = (value: number): number => {
	return Math.min(Math.max(value, 0), 100);
};

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
		{
			label: "Annual Budget",
			value: annualBudget,
		},
		{
			label: "Available Budget",
			value: availableBudget,
		},
		{
			label: "Allotted Budget",
			value: allotedBudget,
		},
		{
			label: "Remaining Amount",
			value: tataHitachiPoAmount,
		},
		{
			label: "Tata Hitachi Po Amount",
			value: tataHitachiPoAmount,
		},
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
