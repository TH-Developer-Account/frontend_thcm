import { buildLineItemPayload } from "../../../constant";
import type { EpfFormValues, LineItemOption } from "../../../types";
import { calculateBudgetShares, toNumberOrNull } from "./epf.calculations";

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
		totalParticipants:
			Number(values.externalParticipants || 0) +
			Number(values.internalParticipants || 0),

		crfTotal: toNumberOrNull(values.crfTotal),
		eventBudget: toNumberOrNull(budgetValues.eventBudget),
		annualBudget: toNumberOrNull(values.annualBudget),
		availableBudget: toNumberOrNull(values.availableBudget),
		allotedBudget: toNumberOrNull(values.allotedBudget),

		dealerName: values.dealerName || "",
		dealerPercent: toNumberOrNull(budgetValues.dealerPercent),
		dealerShare: toNumberOrNull(budgetValues.dealerShare),

		tataHitachiPercent: toNumberOrNull(budgetValues.tataHitachiPercent),
		tataHitachiShare: toNumberOrNull(budgetValues.tataHitachiShare),
		tataHitachiPoAmount: toNumberOrNull(budgetValues.tataHitachiShare),
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
