// crf/order/types.ts
// Types for the CRF order step: the dispatch-details + order-placement flow
// a CRF goes through once its EPC is approved (CrfStatus moves off OPEN).
//
// Replaces an earlier version built against an invented contract (a PIN
// delivery-estimate endpoint, a separate billing address, a formal GST
// debit note document, a 6-state shop-order lifecycle with courier
// tracking). None of that exists on the real backend — see
// crfDispatchDetails.service.ts / crfOrder.service.ts. The real contract:
//
//   PUT  /crf/:crfId/dispatch-details  body: DispatchDetailsInput
//   PUT  /crf/:crfId/souvenirs         body: { items: CrfShopifyItemInput[] }
//   POST /crf/:crfId/order             body: { acceptPartial?: boolean } → ApiCrfOrder
//   POST /crf/:crfId/order/retry       (no body)                        → ApiCrfOrder
//   POST /crf/:crfId/order/cancel      body: { reason?: string }
//
// CrfDetail (crf.types.ts) already carries everything this UI needs to
// read — status, permissions, items (souvenir lines) and order — so there's
// nothing extra to fetch or poll.

/* ========================================================================== */
/*                               Dispatch details                             */
/* ========================================================================== */

export const RECIPIENT_TYPES = ["SELF", "EMPLOYEE", "DEALER_CONTACT", "OTHER"] as const;
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
export type CrfDispatchFormErrors = Partial<Record<CrfDispatchFormField, string>>;

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
/*                               Souvenir swap                                 */
/* ========================================================================== */

/** PUT /crf/:crfId/souvenirs body — full replace of the souvenir lines only. */
export type SwapSouvenirsInput = {
	items: { sku: string; requestedQty: number }[];
};

/* ========================================================================== */
/*                             Order placement                                */
/* ========================================================================== */

export type PlaceOrderInput = { acceptPartial?: boolean };
export type CancelOrderInput = { reason?: string };
