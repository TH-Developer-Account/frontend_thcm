// crf/order/logic.ts
// Pure helpers for the CRF order step (no React, no HTTP).
//
// Deliberately small: the old version (invented contract) carried PIN/ETA
// math, a formal debit-note builder, a THCM payload builder and a 6-state
// tracking-step deriver. None of that survives — the real backend computes
// the THCM payload itself from the CRF's own stored fields, returns a plain
// debitNoteAmount number (not a document), and the only order statuses are
// ORDERED / CANCELLED (no courier/fulfillment data to render a timeline
// from). What's left is just: turn CRF souvenir items into display lines,
// total them, and build the dispatch-details request body.

import { mapCrfLineItemsToFormItems } from "../core/mapper";
import { getLinePricing, sumPricing, type LinePricing } from "../shop/mapper";
import type { CrfDetail, CrfLineItem, CrfStatus } from "../core/types";

/* ========================================================================== */
/*                                  Status                                    */
/* ========================================================================== */

/** Statuses where the order section has something to show/do (post-approval). */
export const CRF_ORDER_ACTIVE_STATUSES: readonly CrfStatus[] = [
	"APPROVED",
	"STOCK_SHORTFALL",
	"ORDER_FAILED",
	"ORDERED",
];

export const isCrfOrderActive = (status?: CrfStatus | null): boolean =>
	Boolean(status) && CRF_ORDER_ACTIVE_STATUSES.includes(status as CrfStatus);

export const CRF_STATUS_LABEL: Record<CrfStatus, string> = {
	OPEN: "Being drafted",
	APPROVED: "Approved — ready to order",
	STOCK_SHORTFALL: "Stock shortfall",
	ORDER_FAILED: "Order failed",
	ORDERED: "Order placed",
	CLOSED: "Closed",
};

/* ========================================================================== */
/*                           CRF items → souvenir lines                       */
/* ========================================================================== */

/** The CRF's souvenir lines, mapped to the form/display shape (not yet backfilled with store data). */
export const getSouvenirFormLines = (crf: CrfDetail | null): CrfLineItem[] =>
	mapCrfLineItemsToFormItems(crf?.items ?? []).filter((item) => item.category === "SOUVENIR");

export const getLineTotals = (lines: CrfLineItem[]): LinePricing =>
	sumPricing(lines.map((line) => getLinePricing(line)));

// NOTE: CrfDetail (crf.types.ts) doesn't currently expose the CRF's saved
// dispatch fields (recipientName, addressLine1, …) in its read model — only
// status/items/order/permissions. So once dispatch details have been saved,
// there's no confirmed way for this form to show what was actually saved;
// it starts blank on every load rather than guessing a field layout that
// might not match what getCrfDetail returns. Worth raising with the backend
// if the form should prefill on reopen.
