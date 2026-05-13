import type { EpcDetailEpf } from "./epc.types";

export type EpfDetailResponse = EpcDetailEpf;

export type EpfLineItemFormValue = {
	id?: string;
	productId: string;
	quantity: number | string;
	amount: number | string;
	total: number | string;
	description?: string;
};

export type EpfFormValues = {
	externalParticipants: number | string;
	internalParticipants: number | string;
	totalParticipants?: number | string;

	crfTotal: number | string;
	eventBudget: number | string;
	annualBudget: number | string;
	availableBudget: number | string;
	allotedBudget: number | string;

	dealerName: string;
	dealerPercent: number | string;
	dealerShare: number | string;

	tataHitachiPercent: number | string;
	tataHitachiShare: number | string;
	tataHitachiPoAmount: number | string;

	lineItems: EpfLineItemFormValue[];
};

export type EpfCreatePayload = {
	epcId: string;
	crfId?: string;
	status: "DRAFT" | "SUBMITTED";

	externalParticipants: number;
	internalParticipants: number;
	totalParticipants: number;

	crfTotal: number;
	eventBudget: number;
	annualBudget: number;
	availableBudget: number;
	allotedBudget: number;

	dealerName: string;
	dealerPercent: number;
	dealerShare: number;

	tataHitachiPercent: number;
	tataHitachiShare: number;
	tataHitachiPoAmount: number;

	lineItems: {
		productId: string;
		quantity: number;
		amount: number;
		total: number;
		description?: string;
		category: "EVENT_OVERHEAD";
	}[];
};

export type EpfUpdatePayload = EpfCreatePayload;

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

export type EpfBudgetCalculationInput = {
	eventBudget?: number | string | null;
	dealerPercent?: number | string | null;
};

export type EpfBudgetCalculationResult = {
	eventBudget: number;
	dealerPercent: number;
	tataHitachiPercent: number;
	dealerShare: number;
	tataHitachiShare: number;
	tataHitachiPoAmount: number;
};
