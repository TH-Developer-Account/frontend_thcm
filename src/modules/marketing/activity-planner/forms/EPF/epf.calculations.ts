import type { LineItemOption } from "../../types/lineItem.types";
import type { EpfFormValues } from "../../types/epf.types";

const toNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

export const toNumberOrNull = (value: unknown) => {
	if (value === "" || value === null || value === undefined) return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

export const calculateParticipantsTotal = (
	externalParticipants: unknown,
	internalParticipants: unknown,
) => {
	return toNumber(externalParticipants) + toNumber(internalParticipants);
};

export const calculateLineItemsTotal = (items: LineItemOption[] = []) => {
	return items.reduce((sum, item) => {
		const quantity = toNumber(item.quantity);
		const rate = toNumber(item.rate);
		const total = toNumber((item as any).total);

		return sum + (total || quantity * rate);
	}, 0);
};

export const getTotalLineItemAmount = calculateLineItemsTotal;

export const calculateBudgetShares = (
	values: EpfFormValues,
	eventCost: number,
) => {
	const eventBudget = toNumber(eventCost);

	const dealerPercent = Math.min(
		100,
		Math.max(0, toNumber(values.dealerPercent)),
	);

	const tataHitachiPercent = 100 - dealerPercent;

	const dealerShare = Number(((eventBudget * dealerPercent) / 100).toFixed(2));

	const tataHitachiShare = Number(
		((eventBudget * tataHitachiPercent) / 100).toFixed(2),
	);

	return {
		eventBudget,
		dealerPercent,
		tataHitachiPercent,
		dealerShare,
		tataHitachiShare,
		tataHitachiPoAmount: tataHitachiShare,
	};
};

export const EPF_QUOTATION_THRESHOLD = 25_000;
export const EPF_OVERHEAD_CATEGORY = "EVENT_OVERHEAD";

const hasLineItemQuotation = (item: LineItemOption): boolean => {
	return Boolean(
		item.quotationFile || item.quotationFileUrl || item.quotationFileName,
	);
};

export const getOverheadItemsMissingQuotation = (
	items: LineItemOption[],
): LineItemOption[] => {
	return items.filter((item) => {
		const category = item.category ?? EPF_OVERHEAD_CATEGORY;

		if (category !== EPF_OVERHEAD_CATEGORY) {
			return false;
		}

		const lineItemTotal = Number(item.rate || 0) * Number(item.quantity || 0);

		return (
			lineItemTotal > EPF_QUOTATION_THRESHOLD && !hasLineItemQuotation(item)
		);
	});
};
