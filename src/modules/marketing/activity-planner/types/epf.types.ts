import type { EpcDetailCrf, EpcDetailEpf } from "./epc.types";

export type EpfStatus = "DRAFT" | "SUBMITTED";

export type EpfDetailResponse = EpcDetailEpf;
export type EpfCrfData = EpcDetailCrf | null | undefined;

export type EpfProduct = {
	id: string;
	productType?: "EPF" | "CRF";
	category?: string;
	partNumber?: string;
	name: string;
	description?: string | null;
	unitRate?: string | number;
	isActive?: boolean;
};

export type EpfFormValues = {
	externalParticipants: number | string;
	internalParticipants: number | string;
	totalParticipants: number | string;

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
};

export type EpfLineItemPayload = {
	productId: string;
	quantity: number;
	amount?: number;
	total?: number;
	description?: string;
	category?: "EVENT_OVERHEAD";
};

export type EpfCreatePayload = {
	epcId: string;
	crfId?: string;
	status: EpfStatus;

	externalParticipants: number | null;
	internalParticipants: number | null;
	totalParticipants?: number;

	crfTotal?: number | null;
	eventBudget: number | null;
	annualBudget: number | null;
	availableBudget: number | null;
	allotedBudget: number | null;

	dealerName: string;
	dealerPercent: number | null;
	dealerShare: number | null;

	tataHitachiPercent?: number | null;
	tataHitachiShare?: number | null;
	tataHitachiPoAmount?: number | null;

	lineItems: EpfLineItemPayload[];
};

export type EpfUpdatePayload = Omit<EpfCreatePayload, "epcId" | "crfId">;

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
