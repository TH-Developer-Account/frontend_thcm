// crf/order/types.ts
// Types for the CRF order step: the dispatch-details + order-placement flow
// a CRF goes through once its EPC is approved (CrfStatus moves off OPEN).
//
// Flow inside the "CRF Order" tab:
//   1. Delivery PIN  → GET /crf/:crfId/delivery-estimate?pincode=   (NEW — see below)
//   2. Recipient + shipping address → PUT /crf/:crfId/dispatch-details
//   3. Place order                  → POST /crf/:crfId/order
//
// Backend contract:
//
//   GET  /crf/:crfId/delivery-estimate?pincode=  → DeliveryEstimate      (NOT BUILT YET —
//                                                  api.ts serves a mock until
//                                                  DELIVERY_ESTIMATE_USE_MOCK is false)
//   PUT  /crf/:crfId/dispatch-details  body: DispatchDetailsInput
//   PUT  /crf/:crfId/souvenirs         body: { items: CrfShopifyItemInput[] }
//   POST /crf/:crfId/order             body: { acceptPartial?: boolean } → ApiCrfOrder
//   POST /crf/:crfId/order/retry       (no body)                        → ApiCrfOrder
//   POST /crf/:crfId/order/cancel      body: { reason?: string }
//
// CrfDetail (crf.types.ts) already carries everything this UI needs to
// read — status, permissions, items (souvenir lines) and order — so there's
// nothing extra to fetch or poll.

import type { CrfShopifyItemInput } from "../core/types";

/* ========================================================================== */
/*                               Dispatch details                             */
/* ========================================================================== */

export const RECIPIENT_TYPES = [
	"SELF",
	"EMPLOYEE",
	"DEALER_CONTACT",
	"OTHER",
] as const;
export type RecipientType = (typeof RECIPIENT_TYPES)[number];

export const RECIPIENT_TYPE_LABEL: Record<RecipientType, string> = {
	SELF: "Myself",
	EMPLOYEE: "An employee",
	DEALER_CONTACT: "A dealer contact",
	OTHER: "Someone else",
};

/**
 * Flat form state for the dispatch-details form. Kept flat (not nested
 * under an `address` object like the wire shape) so the form component can
 * address every field the same way as the rest of the CRF module's forms —
 * buildDispatchDetailsInput (crf.order.logic.ts) nests it back into the
 * real request body on submit.
 */
export type CrfDispatchFormValues = {
	recipientType: RecipientType;
	recipientName: string;
	recipientPhone: string;
	recipientEmail: string;
	recipientOrganisation: string;
	/** Required (and validated against the User table) when recipientType === "EMPLOYEE". */
	recipientUserId: string;
	/** Required (and validated against BusinessPartnerContact) when recipientType === "DEALER_CONTACT". */
	recipientContactId: string;
	deliveryInstructions: string;
	requiredByDate: string;

	line1: string;
	line2: string;
	landmark: string;
	city: string;
	district: string;
	state: string;
	pincode: string;
	country: string;
	company: string;
	gstin: string;
};

export type CrfDispatchFormField = keyof CrfDispatchFormValues;
export type CrfDispatchFormErrors = Partial<
	Record<CrfDispatchFormField, string>
>;

/** PUT /crf/:crfId/dispatch-details body — matches crfDispatchDetails.service.ts exactly. */
export type DispatchDetailsInput = {
	recipientType: RecipientType;
	recipientName: string;
	recipientPhone: string;
	recipientEmail: string;
	recipientOrganisation?: string;
	recipientUserId?: string;
	recipientContactId?: string;
	deliveryInstructions?: string;
	requiredByDate?: string;
	address: {
		line1: string;
		line2?: string;
		landmark?: string;
		city: string;
		district?: string;
		state: string;
		pincode: string;
		country?: string;
		company?: string;
		gstin?: string;
	};
};

/* ========================================================================== */
/*                              Delivery estimate                             */
/* ========================================================================== */

/**
 * GET /crf/:crfId/delivery-estimate?pincode=560001
 *
 * What the PIN-code step needs back. Every field except `pincode` and
 * `serviceable` is optional so the backend can return as much (or as little)
 * as the logistics provider gives — the UI shows whatever is present.
 */
export type DeliveryEstimate = {
	pincode: string;
	/** False → delivery isn't possible to this PIN; the user can't continue. */
	serviceable: boolean;
	/** Place the PIN resolves to — used to pre-fill the address, never overwrites typed values. */
	city?: string | null;
	district?: string | null;
	state?: string | null;
	/** Delivery window in days (business days). */
	minDays?: number | null;
	maxDays?: number | null;
	/** Latest expected delivery, ISO 8601 date or date-time. */
	estimatedDeliveryDate?: string | null;
	/** Delivery charge, when the store applies one. */
	shippingCharge?: number | null;
	/** Reason / note to show the user (e.g. why a PIN isn't serviceable). */
	message?: string | null;
};

/* ========================================================================== */
/*                               Souvenir swap                                 */
/* ========================================================================== */

/**
 * PUT /crf/:crfId/souvenirs body — full replace of the souvenir lines only.
 *
 * Must carry the FULL CrfShopifyItemInput shape (sku/requestedQty/amount/
 * rate/title/variantTitle/imageUrl), not just sku+requestedQty — the
 * backend's buildShopifyItemRows (crf.service.ts) requires amount and rate
 * on every line and throws a 400 if they're missing.
 */
export type SwapSouvenirsInput = {
	items: CrfShopifyItemInput[];
};

/* ========================================================================== */
/*                             Order placement                                */
/* ========================================================================== */

export type PlaceOrderInput = { acceptPartial?: boolean };
export type CancelOrderInput = { reason?: string };
