import { buildLineItemPayload } from "../../../constant";
import type { EpfFormValues, LineItemOption } from "../../../types";
import { calculateBudgetShares, toNumberOrNull } from "./epfCalculations";

export const prepareEpfBasePayload = (
	values: EpfFormValues,
	status: "DRAFT" | "SUBMITTED",
	epcId: string,
	eventCost: number,
) => {
	const budgetValues = calculateBudgetShares(values, eventCost);

	return {
		epcId,
		status,
		externalParticipants: toNumberOrNull(values.externalParticipants),
		internalParticipants: toNumberOrNull(values.internalParticipants),
		eventBudget: toNumberOrNull(budgetValues.eventBudget),
		annualBudget: toNumberOrNull(values.annualBudget),
		availableBudget: toNumberOrNull(values.availableBudget),
		dealerName: values.dealerName || "",
		dealerPercent: toNumberOrNull(budgetValues.dealerPercent),
		dealerShare: toNumberOrNull(budgetValues.dealerShare),
		// tata_hitachi_percent: toNumberOrNull(budgetValues.tataHitachiPercent),
		// tata_hitachi_share: toNumberOrNull(budgetValues.tataHitachiShare),
		// tata_hitachi_po_amount: toNumberOrNull(values.tataHitachiPoAmount),
	};
};

export const buildEpfCreatePayload = ({
	values,
	status,
	epcId,
	eventCost,
	costItems,
}: {
	values: EpfFormValues;
	status: "DRAFT" | "SUBMITTED";
	epcId: string;
	eventCost: number;
	costItems: LineItemOption[];
}) => {
	const epfPayload = prepareEpfBasePayload(values, status, epcId, eventCost);
	const lineItemPayload = buildLineItemPayload(costItems, { epcId });

	return {
		...epfPayload,
		lineItems: lineItemPayload.lineItems,
	};
};

export const buildEpfUpdatePayload = ({
	values,
	status,
	epcId,
	eventCost,
	costItems,
}: {
	values: EpfFormValues;
	status: "DRAFT" | "SUBMITTED";
	epcId: string;
	eventCost: number;
	costItems: LineItemOption[];
}) => {
	const payload = buildEpfCreatePayload({
		values,
		status,
		epcId,
		eventCost,
		costItems,
	});

	const { epcId: _removed, ...updatePayload } = payload;

	void _removed;

	return updatePayload;
};
