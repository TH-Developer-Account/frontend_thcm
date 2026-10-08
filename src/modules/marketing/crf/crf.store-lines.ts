// crf/crf.store-lines.ts
// TEMP bridge until the CRF backend accepts store (Shopify) lines.
//
// Today POST/PUT /crf only understands product-master lines ({ productId,
// quantity }) — a souvenir line has a SKU / variant instead, so its productId
// is undefined and Prisma throws ("Can not use `undefined` value within
// array"). Until the backend is reworked:
//   • the API payload carries ONLY product-master lines (printed materials,
//     artworks);
//   • souvenir lines are kept in this browser (localStorage, per EPC) and
//     merged back wherever CRF lines are read (CRF form, order section).
//
// Flip CRF_BACKEND_SUPPORTS_STORE_LINES to true once the backend stores
// sku / variantId lines — everything then goes to the API and this file is
// a no-op.

import type { CrfLineItemPayload, CrfPayload } from "./crf.types";

export const CRF_BACKEND_SUPPORTS_STORE_LINES = false;

const KEY = (epcId: string) => `crf-store-lines:${epcId}`;

const isStoreLine = (line: { category?: string; productId?: string | null }) =>
	line.category === "SOUVENIR" || !line.productId;

export const readLocalStoreLines = (
	epcId: string | null | undefined,
): CrfLineItemPayload[] => {
	if (CRF_BACKEND_SUPPORTS_STORE_LINES || !epcId) return [];
	try {
		const raw = localStorage.getItem(KEY(epcId));
		return raw ? (JSON.parse(raw) as CrfLineItemPayload[]) : [];
	} catch {
		return [];
	}
};

const writeLocalStoreLines = (epcId: string, lines: CrfLineItemPayload[]) => {
	try {
		if (lines.length) localStorage.setItem(KEY(epcId), JSON.stringify(lines));
		else localStorage.removeItem(KEY(epcId));
	} catch {
		/* storage unavailable — souvenirs won't survive a reload */
	}
};

/**
 * Splits the CRF payload: product-master lines go to the API, souvenir lines
 * are returned separately to be kept locally after a successful save.
 */
export const splitCrfPayload = (payload: CrfPayload) => {
	if (CRF_BACKEND_SUPPORTS_STORE_LINES) {
		return { apiPayload: payload, storeLines: [] as CrfLineItemPayload[] };
	}
	return {
		apiPayload: {
			...payload,
			lineItems: payload.lineItems.filter((line) => !isStoreLine(line)),
		},
		storeLines: payload.lineItems.filter(isStoreLine),
	};
};

/** Call after the API save succeeded. */
export const saveLocalStoreLines = (
	epcId: string,
	lines: CrfLineItemPayload[],
) => {
	if (!CRF_BACKEND_SUPPORTS_STORE_LINES) writeLocalStoreLines(epcId, lines);
};

/** Payload line → API-like line, so the existing mappers read it back. */
const toApiLike = (line: CrfLineItemPayload) => ({
	...line,
	id: `local-${line.variantId ?? line.sku}`,
	rate: line.amount,
	name: line.title,
	particulars: line.title,
});

/** API lines + this browser's souvenir lines (deduped by variant / SKU). */
export const withLocalStoreLines = <T>(
	epcId: string | null | undefined,
	lineItems: T[] = [],
): T[] => {
	const local = readLocalStoreLines(epcId);
	if (!local.length) return lineItems;

	const seen = new Set(
		(lineItems as Array<Record<string, unknown>>)
			.map((item) => (item?.variantId ?? item?.sku) as string | undefined)
			.filter(Boolean),
	);
	const extra = local.filter(
		(line) => !seen.has((line.variantId ?? line.sku) as string),
	);
	return [...lineItems, ...(extra.map(toApiLike) as unknown as T[])];
};
