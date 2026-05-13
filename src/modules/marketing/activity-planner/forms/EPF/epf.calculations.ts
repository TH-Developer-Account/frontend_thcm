import type { EpfFormValues, LineItemOption } from "../../../types";

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
		const rate = toNumber(item.rate ?? item.amount);
		const total = toNumber(item.total);

		return sum + (total || quantity * rate);
	}, 0);
};

export const getTotalLineItemAmount = calculateLineItemsTotal;

export const calculateBudgetShares = (
	values: EpfFormValues,
	eventCost?: number,
): EpfFormValues => {
	const eventBudget =
		typeof eventCost === "number" ? eventCost : toNumber(values.eventBudget);

	const dealerPercent = Math.min(
		100,
		Math.max(0, toNumber(values.dealerPercent)),
	);

	const tataHitachiPercent = 100 - dealerPercent;

	const dealerShare = (eventBudget * dealerPercent) / 100;
	const tataHitachiShare = (eventBudget * tataHitachiPercent) / 100;

	return {
		...values,
		eventBudget,
		dealerPercent,
		tataHitachiPercent,
		dealerShare,
		tataHitachiShare,
		tataHitachiPoAmount: tataHitachiShare,
	};
};
