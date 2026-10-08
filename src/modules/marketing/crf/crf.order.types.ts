// crf/crf.order.types.ts
// Types for the CRF order step: after the EPC is APPROVED (and before it is
// CONDUCTED) the proposer places the store (Shopify) order for the CRF's
// souvenir lines, then tracks it.
//
//   delivery estimate (PIN)  →  shipping / recipient form  →  live stock check
//        ├─ all available     → order created → tracking
//        └─ shortfall         → (a) order something else  → order created
//                               (b) generate debit note   → order created
//
// Store shapes (ShopOrder*) follow the THCM Integration Document (Get Order
// Status / Get Employee Orders). MAP shapes (CrfOrder*) are what MAP's backend
// will store and return — the contract the backend revamp should implement.

import type { LinePricing } from "./crf.shop.mapper";
import type { ShopStockCheckStatus } from "./crf.shop.types";

/* ========================================================================== */
/*                          Delivery estimate (PIN)                           */
/* ========================================================================== */

/**
 * GET /crf-shop/delivery-estimate?pincode=560034
 * THCM has no ETA API yet → MAP computes it (PIN dataset + dispatch rules).
 */
export type DeliveryEstimate = {
	pincode: string;
	serviceable: boolean;
	district: string | null;
	stateName: string | null;
	/** City names the store accepts for this PIN (THCM rejects others). */
	cities: string[];
	minDays: number | null;
	maxDays: number | null;
	/** ISO dates (yyyy-mm-dd) of the delivery window. */
	fromDate: string | null;
	toDate: string | null;
	/** Why the PIN isn't serviceable, or a note about the estimate. */
	message: string | null;
	checkedAt: string;
};

/* ========================================================================== */
/*                                 Order form                                 */
/* ========================================================================== */

export type CrfOrderFormValues = {
	/* Shipping */
	pincode: string;
	city: string;
	state: string;
	address1: string;
	address2: string;
	landmark: string;
	company: string;

	/* Recipient (can differ from the requester) */
	recipientName: string;
	recipientPhone: string;
	recipientEmail: string;
	alternatePhone: string;
	deliveryInstructions: string;

	/* Billing */
	billingSameAsShipping: boolean;
	billingName: string;
	billingCompany: string;
	billingGstin: string;
	billingAddress1: string;
	billingCity: string;
	billingState: string;
	billingPincode: string;
};

export type CrfOrderFormField = keyof CrfOrderFormValues;
export type CrfOrderFormErrors = Partial<Record<CrfOrderFormField, string>>;

/* ========================================================================== */
/*                                 Order lines                                */
/* ========================================================================== */

/** One store line to order (snapshot taken from the approved CRF line). */
export type CrfOrderLine = {
	/** variantId — stable key across stock checks. */
	key: string;
	sku: string;
	variantId: string | null;
	shopifyProductId: string | null;
	title: string;
	variantTitle: string | null;
	imageUrl: string | null;
	/** Quantity approved in the CRF (or chosen as a replacement). */
	quantity: number;
	unitPrice: number;
	compareAtPrice: number | null;
	gstRate: number | null;
	/** true when the line was added in "order something else". */
	isReplacement?: boolean;
};

/** A line the store can't fully supply at order time. */
export type ShortfallLine = CrfOrderLine & {
	approvedQty: number;
	availableQty: number;
	shortQty: number;
	status: ShopStockCheckStatus;
	/** Pricing of the SHORT quantity only. */
	shortPricing: LinePricing;
};

export type StockCheckOutcome = {
	checkedAt: string;
	allAvailable: boolean;
	/** Every line with the live availability written on it. */
	lines: Array<CrfOrderLine & { availableQty: number; status: ShopStockCheckStatus }>;
	shortLines: ShortfallLine[];
	/** Sum of the short quantities' value. */
	shortfallTotals: LinePricing;
	/** Value of the approved lines (budget ceiling for replacements). */
	approvedTotals: LinePricing;
};

/* ========================================================================== */
/*                                 Debit note                                 */
/* ========================================================================== */

export type DebitNoteLine = {
	sku: string;
	title: string;
	variantTitle: string | null;
	approvedQty: number;
	availableQty: number;
	shortQty: number;
	unitPrice: number;
	gstRate: number | null;
	pricing: LinePricing;
};

export type DebitNoteParty = {
	name: string;
	lines: string[];
	gstin?: string | null;
};

export type DebitNote = {
	number: string;
	issuedAt: string;
	reason: string;
	crfId: string;
	proposalNumber: string;
	eventName: string;
	raisedBy: { name: string; email: string };
	from: DebitNoteParty;
	to: DebitNoteParty;
	lines: DebitNoteLine[];
	totals: LinePricing;
	amountInWords: string;
};

export type ShortfallResolution =
	| { type: "NONE" }
	| { type: "REPLACED"; shortLines: ShortfallLine[] }
	| { type: "DEBIT_NOTE"; shortLines: ShortfallLine[]; debitNote: DebitNote };

/* ========================================================================== */
/*                        Payload MAP → backend → Shopify                     */
/* ========================================================================== */

export type ShopAddress = {
	first_name: string;
	last_name: string;
	company?: string;
	address1: string;
	address2?: string;
	city: string;
	province: string;
	zip: string;
	country: "India";
	phone: string;
};

/**
 * POST /crf/:crfId/order — MAP's backend forwards the store part (items,
 * name, email, phone, channel, shippingAddress) to THCM Create Order and
 * keeps the rest (CRF details, billing, recipient, debit note) in MAP.
 */
export type CrfOrderPayload = {
	crfId: string;
	epcId: string;
	proposalNumber: string;
	/** Duplicate-order guard until THCM adds an idempotency key. */
	channel: string;
	attempt: number;

	/* ---- THCM Create Order ---- */
	items: { sku: string; quantity: number }[];
	/** Requester (MAP user) — THCM lists orders by this email. */
	name: string;
	email: string;
	phone: string;
	shippingAddress: ShopAddress;

	/* ---- MAP-only ---- */
	billingAddress: (Omit<ShopAddress, "phone"> & { gstin?: string; phone?: string }) | null;
	recipient: {
		name: string;
		phone: string;
		email: string | null;
		alternatePhone: string | null;
		landmark: string | null;
		deliveryInstructions: string | null;
	};
	deliveryEstimate: Pick<DeliveryEstimate, "pincode" | "minDays" | "maxDays" | "fromDate" | "toDate">;
	lines: Array<CrfOrderLine & { pricing: LinePricing }>;
	totals: LinePricing;
	/** Printed materials / artworks — not fulfilled by the store, for reference. */
	nonStoreLines: { category: string; title: string; quantity: number }[];
	shortfall: ShortfallResolution;
};

/* ========================================================================== */
/*                         Store order (THCM response)                        */
/* ========================================================================== */

export type ShopOrderLine = {
	id: number;
	orderId: number;
	sku: string;
	title: string;
	quantity: number;
	price: string;
};

export type ShopOrder = {
	id: number;
	shopifyOrderId: string;
	name: string;
	email: string;
	phone: string | null;
	/** open, cancelled, closed, fulfilled or refunded. */
	status: string;
	financialStatus: string | null;
	/** null (nothing shipped), partial or fulfilled. */
	fulfillmentStatus: "partial" | "fulfilled" | null;
	/** null until shipped, then in_transit, out_for_delivery, delivered, attempted_delivery, failure … */
	deliveryStatus: string | null;
	closedAt: string | null;
	totalPrice: string;
	trackingNumber: string | null;
	trackingUrl: string | null;
	carrier: string | null;
	channel: string;
	createdAt: string;
	updatedAt: string;
	lineItems: ShopOrderLine[];
};

/* ========================================================================== */
/*                          MAP order record (stored)                         */
/* ========================================================================== */

export type CrfOrderStatus =
	| "ORDER_CREATED"
	| "PARTIALLY_FULFILLED"
	| "SHIPPED"
	| "DELIVERED"
	| "DELIVERY_FAILED"
	| "CANCELLED";

/** GET /crf/:crfId/order → data (null until an order exists). */
export type CrfOrderRecord = {
	crfId: string;
	status: CrfOrderStatus;
	placedAt: string;
	placedBy: { name: string; email: string };
	payload: CrfOrderPayload;
	shopOrder: ShopOrder;
	debitNote: DebitNote | null;
};

/* ========================================================================== */
/*                              Section inputs                                */
/* ========================================================================== */

/** What the order section needs from the EPC detail. */
export type CrfOrderContext = {
	epcId: string;
	epcStatus: string;
	proposalNumber: string;
	eventName: string;
	eventDate?: string | null;
	/** EPC location PIN — pre-fills the delivery PIN. */
	defaultPincode?: string | null;
	requester: { name: string; email: string; phone?: string | null };
	/** Dealer on the EPF — issues the debit note to THCM on a shortfall. */
	dealer?: { name: string; lines?: string[]; gstin?: string | null } | null;
	crf: { id: string; lineItems: unknown[] } | null;
};
