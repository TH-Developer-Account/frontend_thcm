// crf/crf.types.ts
// CRF types + constants.

import type { ApiLineItem } from "../shared/lineItem.types";

/* ========================================================================== */
/*                                  Constants                                 */
/* ========================================================================== */

export const CRF_CATEGORIES = [
	{ title: "Printed Materials", value: "PRINTED_MATERIAL" },
	{ title: "Souvenirs", value: "SOUVENIR" },
	{ title: "Artworks", value: "ARTWORK" },
] as const;

export type CrfCategory = (typeof CRF_CATEGORIES)[number]["value"];

/* ========================================================================== */
/*                                 Read model                                 */
/* ========================================================================== */

export type CrfDetail = {
	id: string;
	lineItems: ApiLineItem[];
};

/* ========================================================================== */
/*                                  Payloads                                  */
/* ========================================================================== */

export type CrfLineItemPayload = {
	productId: string;
	category: string;
	quantity: number;
	amount: number;
	total: number;
	description?: string;

	// artwork
	width?: number;
	height?: number;
	unit?: string;
};

export type CrfPayload = {
	epcId: string;
	lineItems: CrfLineItemPayload[];
};
