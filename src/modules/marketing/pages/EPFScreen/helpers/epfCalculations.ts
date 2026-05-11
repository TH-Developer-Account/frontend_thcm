import type { EpfFormValues, LineItemOption } from "../../../types";

export const getTotalLineItemAmount = (items: LineItemOption[]) => {
	return items.reduce((total, item) => {
		return total + Number(item.rate || 0) * Number(item.quantity || 0);
	}, 0);
};

export const calculateBudgetShares = (
	values: EpfFormValues,
	eventCost: number,
) => {
	const budget = Number(eventCost) || 0;

	const dealerPercent = Math.min(
		100,
		Math.max(0, Number(values.dealerPercent) || 0),
	);

	const tataHitachiPercent = 100 - dealerPercent;

	return {
		eventBudget: budget,
		dealerPercent,
		tataHitachiPercent,
		dealerShare: Number(((budget * dealerPercent) / 100).toFixed(2)),
		tataHitachiShare: Number(((budget * tataHitachiPercent) / 100).toFixed(2)),
	};
};

export const toNumberOrNull = (val: number | string | null | undefined) => {
	if (val === "" || val === null || val === undefined) return null;
	return Number(val);
};
