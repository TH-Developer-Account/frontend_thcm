import {
	BASE_STEPS,
	INTERRUPT_STEPS,
	SUCCESS_STEPS,
	type ApprovalApiStatus,
} from "../../../types";

export const getApprovalSteps = (status: ApprovalApiStatus) => {
	if (["PENDING", "SUBMITTED"].includes(status)) {
		return [...BASE_STEPS, ...SUCCESS_STEPS];
	}

	if (
		[
			"RECOMMENDED",
			"CHECKED",
			"APPROVED",
			"COMPLETED",
			"REPORT_SUBMITTED",
		].includes(status)
	) {
		return [...BASE_STEPS, ...SUCCESS_STEPS];
	}

	if (["SENT_BACK", "CANCELLED"].includes(status)) {
		return [...BASE_STEPS, INTERRUPT_STEPS.find((s) => s.api === status)!];
	}

	return BASE_STEPS;
};
export const formatCurrency = (value: number) =>
	new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 2,
	}).format(value || 0);

export type BudgetItem = {
	label: string;
	value: number | string;
};

export type ShareInfo = {
	dealerName: string;
	tataHitachiPoAmount: number;
	dealerPercent: number;
	dealerShare: number;
	tataHitachiPercent: number;
	tataHitachiShare: number;
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

const toNumber = (value: unknown): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const clampPercent = (value: number): number => {
	return Math.min(Math.max(value, 0), 100);
};

export const mapBudgetShareInfo = (data: BudgetShareInput) => {
	const annualBudget = toNumber(data.annualBudget);
	const availableBudget = toNumber(data.availableBudget);
	const allotedBudget = toNumber(data.allotedBudget);

	const eventBudget = toNumber(data.eventBudget);
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
	];

	const shareInfo: ShareInfo = {
		dealerName: data.dealerName || "-",
		tataHitachiPoAmount: toNumber(data.tataHitachiPoAmount),

		dealerPercent,
		dealerShare,

		tataHitachiPercent,
		tataHitachiShare,
	};

	return {
		items,
		shareInfo,
	};
};
