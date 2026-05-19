import type { EpcDetailCrf, EpcLineItem } from "./epc.types";

export type CrfDetailResponse = EpcDetailCrf;

export type CrfLineItemFormValue = {
	id?: string;
	productId: string;
	category: string;
	quantity: number | string;
	amount: number | string;
	total: number | string;
	description?: string;
};

export type CrfFormValues = {
	lineItems: CrfLineItemFormValue[];
};

export type CrfCreatePayload = {
	epcId: string;
	lineItems: {
		productId: string;
		category: string;
		quantity: number;
		amount: number;
		total: number;
		description?: string;
	}[];
};

export type CrfUpdatePayload = CrfCreatePayload;

export type CrfProduct = {
	id: string;
	partNumber?: string;
	name: string;
	description?: string;
	category?: string;
	unitRate?: string | number;
};

export type CrfMappedLineItem = EpcLineItem;
