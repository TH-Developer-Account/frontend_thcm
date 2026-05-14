import { buildLineItemPayload } from "../../../constant";

import type { LineItemOption } from "../../../types";
import type {
	EpfCreatePayload,
	EpfFormValues,
	EpfStatus,
	EpfUpdatePayload,
} from "../../types/epf.types";

import {
	calculateBudgetShares,
	// calculateParticipantsTotal,
	toNumberOrNull,
} from "./epf.calculations";

type BuildEpfPayloadArgs = {
	values: EpfFormValues;
	status: EpfStatus;
	epcId: string;
	crfId?: string | null;
	eventCost: number;
	costItems: LineItemOption[];
};

export const prepareEpfBasePayload = ({
	values,
	status,
	epcId,
	eventCost,
}: Omit<BuildEpfPayloadArgs, "costItems">): Omit<
	EpfCreatePayload,
	"lineItems"
> => {
	const budgetValues = calculateBudgetShares(values, eventCost);

	return {
		epcId,
		status,

		externalParticipants: toNumberOrNull(values.externalParticipants),
		internalParticipants: toNumberOrNull(values.internalParticipants),
		// totalParticipants: calculateParticipantsTotal(
		// 	values.externalParticipants,
		// 	values.internalParticipants,
		// ),

		// crfTotal: toNumberOrNull(values.crfTotal),
		eventBudget: toNumberOrNull(budgetValues.eventBudget),
		annualBudget: toNumberOrNull(values.annualBudget),
		availableBudget: toNumberOrNull(values.availableBudget),
		allotedBudget: toNumberOrNull(values.allotedBudget),

		dealerName: values.dealerName || "",
		dealerPercent: toNumberOrNull(budgetValues.dealerPercent),
		dealerShare: toNumberOrNull(budgetValues.dealerShare),

		// tataHitachiPercent: toNumberOrNull(budgetValues.tataHitachiPercent),
		// tataHitachiShare: toNumberOrNull(budgetValues.tataHitachiShare),
		// tataHitachiPoAmount: toNumberOrNull(budgetValues.tataHitachiPoAmount),
	};
};

export const buildEpfCreatePayload = (
	args: BuildEpfPayloadArgs,
): EpfCreatePayload => {
	const basePayload = prepareEpfBasePayload(args);
	const lineItemPayload = buildLineItemPayload(args.costItems, {
		epcId: args.epcId,
	});

	return {
		...basePayload,
		lineItems: lineItemPayload.lineItems,
	};
};

export const buildEpfUpdatePayload = (
	args: BuildEpfPayloadArgs,
): EpfUpdatePayload => {
	const createPayload = buildEpfCreatePayload(args);

	const { epcId, crfId, ...updatePayload } = createPayload;

	void epcId;
	void crfId;

	return updatePayload;
};
