// crf/crf.order.logic.ts
// Pure helpers for the CRF order step (no React, no HTTP) — easy to test and
// to move to the backend later.
//
//   getStoreOrderLines      CRF lines → store lines to order (souvenirs only)
//   buildStockOutcome       live stock check → shortfall lines + totals
//   buildDebitNote          shortfall → debit note (amounts, words, number)
//   buildCrfOrderPayload    form + lines → payload (MAP backend → Shopify)
//   getTrackingSteps        store order → timeline for the tracking view

import { mapCrfLineItemsToFormItems } from "./crf.mapper";
import { getLinePricing, sumPricing, type LinePricing } from "./crf.shop.mapper";
import type { ShopStockCheckResult } from "./crf.shop.types";
import type {
	CrfOrderContext,
	CrfOrderFormValues,
	CrfOrderLine,
	CrfOrderPayload,
	CrfOrderStatus,
	DebitNote,
	DeliveryEstimate,
	ShopOrder,
	ShortfallLine,
	ShortfallResolution,
	StockCheckOutcome,
} from "./crf.order.types";

/* ========================================================================== */
/*                                  Status                                    */
/* ========================================================================== */

/**
 * The order can be placed only while the EPC is APPROVED — after final
 * approval and before the event is marked CONDUCTED / CANCELLED.
 */
export const CRF_ORDER_OPEN_STATUSES: readonly string[] = ["APPROVED"];

/** Statuses that come before approval (order not possible yet). */
const PRE_APPROVAL_STATUSES = new Set([
	"PENDING",
	"SUBMITTED",
	"IN_PROGRESS",
	"CLARIFY",
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
	"REJECTED",
]);

const normalize = (status?: string | null) =>
	String(status ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");

export const isCrfOrderOpen = (epcStatus?: string | null) =>
	CRF_ORDER_OPEN_STATUSES.includes(normalize(epcStatus));

export type CrfOrderPhase = "BEFORE_APPROVAL" | "OPEN" | "CLOSED";

export const getCrfOrderPhase = (epcStatus?: string | null): CrfOrderPhase => {
	const status = normalize(epcStatus);
	if (CRF_ORDER_OPEN_STATUSES.includes(status)) return "OPEN";
	if (!status || PRE_APPROVAL_STATUSES.has(status)) return "BEFORE_APPROVAL";
	return "CLOSED";
};

/* ========================================================================== */
/*                                 CRF → lines                                */
/* ========================================================================== */

const toNumber = (value: unknown) => {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
};

/**
 * Souvenir lines with a SKU are ordered from the store. Same variant twice
 * (shouldn't happen, but legacy data) is merged. Printed materials and
 * artworks are returned separately for reference only.
 */
export const getStoreOrderLines = (lineItems: unknown[] = []) => {
	const items = mapCrfLineItemsToFormItems(lineItems as any[]);
	const byKey = new Map<string, CrfOrderLine>();
	const nonStoreLines: CrfOrderPayload["nonStoreLines"] = [];
	const missingSku: string[] = [];

	for (const item of items) {
		if (item.category !== "SOUVENIR") {
			nonStoreLines.push({
				category: item.category ?? "",
				title: item.label ?? "",
				quantity: toNumber(item.quantity),
			});
			continue;
		}

		if (!item.sku) {
			missingSku.push(item.label ?? "Souvenir");
			continue;
		}

		const key = item.variantId ?? item.sku;
		const existing = byKey.get(key);
		if (existing) {
			existing.quantity += toNumber(item.quantity);
			continue;
		}

		byKey.set(key, {
			key,
			sku: item.sku,
			variantId: item.variantId ?? null,
			shopifyProductId: item.shopifyProductId ?? null,
			title: item.label ?? item.sku,
			variantTitle: item.variantTitle ?? null,
			imageUrl: item.imageUrl ?? null,
			quantity: toNumber(item.quantity),
			unitPrice: toNumber(item.rate),
			compareAtPrice: item.compareAtPrice ?? null,
			gstRate: item.gstRate ?? null,
		});
	}

	return { lines: [...byKey.values()], nonStoreLines, missingSku };
};

export const getOrderLinePricing = (line: CrfOrderLine, quantity = line.quantity) =>
	getLinePricing({
		rate: line.unitPrice,
		quantity,
		compareAtPrice: line.compareAtPrice,
		gstRate: line.gstRate,
	});

export const getOrderLinesTotals = (lines: CrfOrderLine[]): LinePricing =>
	sumPricing(lines.map((line) => getOrderLinePricing(line)));

/* ========================================================================== */
/*                               Stock outcome                                */
/* ========================================================================== */

export const buildStockOutcome = (
	lines: CrfOrderLine[],
	result: ShopStockCheckResult,
	/** Approved lines (budget ceiling). Defaults to `lines`. */
	approvedLines: CrfOrderLine[] = lines,
): StockCheckOutcome => {
	const bySku = new Map(result.lines.map((l) => [l.sku.toLowerCase(), l]));

	const checked = lines.map((line) => {
		const live = bySku.get(line.sku.toLowerCase());
		return {
			...line,
			availableQty: live ? Math.max(0, live.available) : 0,
			status: live?.status ?? ("UNKNOWN_SKU" as const),
		};
	});

	const shortLines: ShortfallLine[] = checked
		.filter((line) => line.status !== "AVAILABLE" || line.availableQty < line.quantity)
		.map((line) => {
			// INACTIVE / UNKNOWN_SKU can't be ordered at all.
			const usable =
				line.status === "INACTIVE" || line.status === "UNKNOWN_SKU"
					? 0
					: Math.min(line.availableQty, line.quantity);
			const shortQty = line.quantity - usable;
			return {
				...line,
				approvedQty: line.quantity,
				availableQty: usable,
				shortQty,
				shortPricing: getOrderLinePricing(line, shortQty),
			};
		})
		.filter((line) => line.shortQty > 0);

	return {
		checkedAt: result.checkedAt,
		allAvailable: shortLines.length === 0,
		lines: checked,
		shortLines,
		shortfallTotals: sumPricing(shortLines.map((l) => l.shortPricing)),
		approvedTotals: getOrderLinesTotals(approvedLines),
	};
};

/** Lines reduced to what the store can supply (0-qty lines dropped). */
export const getAvailableLines = (outcome: StockCheckOutcome): CrfOrderLine[] => {
	const short = new Map(outcome.shortLines.map((l) => [l.key, l]));
	return outcome.lines
		.map(({ availableQty: _a, status: _s, ...line }) => {
			const s = short.get(line.key);
			return s ? { ...line, quantity: s.availableQty } : line;
		})
		.filter((line) => line.quantity > 0);
};

/* ========================================================================== */
/*                               Amount in words                              */
/* ========================================================================== */

const ONES = [
	"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
	"Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
	"Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigits = (n: number) =>
	n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;

const threeDigits = (n: number) => {
	const hundred = Math.floor(n / 100);
	const rest = n % 100;
	return [hundred ? `${ONES[hundred]} Hundred` : "", rest ? twoDigits(rest) : ""]
		.filter(Boolean)
		.join(" ");
};

/** Indian numbering: crore, lakh, thousand. */
const integerToWords = (value: number): string => {
	if (value === 0) return "Zero";
	const parts: string[] = [];
	const crore = Math.floor(value / 10_000_000);
	const lakh = Math.floor((value % 10_000_000) / 100_000);
	const thousand = Math.floor((value % 100_000) / 1000);
	const rest = value % 1000;
	if (crore) parts.push(`${integerToWords(crore)} Crore`);
	if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
	if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
	if (rest) parts.push(threeDigits(rest));
	return parts.join(" ");
};

/** 1234.5 → "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only". */
export const amountInWords = (amount: number) => {
	const safe = Math.max(0, Math.round(amount * 100));
	const rupees = Math.floor(safe / 100);
	const paise = safe % 100;
	if (!rupees && paise) return `${twoDigits(paise)} Paise Only`;
	return `Rupees ${integerToWords(rupees)}${paise ? ` and ${twoDigits(paise)} Paise` : ""} Only`;
};

/* ========================================================================== */
/*                                 Debit note                                 */
/* ========================================================================== */

/**
 * The debit note is raised BY the dealer ON THCM for the value the store
 * couldn't supply. The dealer comes from the EPF (context.dealer); THCM is
 * fixed. Addresses / GSTINs print only when known — never invented.
 */
export const DEBIT_NOTE_ISSUED_TO = {
	name: "Tata Hitachi Construction Machinery Company Private Limited",
	lines: ["Marketing — Activity Planning (MAP)"],
	gstin: null,
} as const;

const getDealerParty = (context: CrfOrderContext) => ({
	name: context.dealer?.name?.trim() || "Dealer",
	lines: context.dealer?.lines?.filter(Boolean) ?? [],
	gstin: context.dealer?.gstin ?? null,
});

const pad = (n: number, size = 2) => String(n).padStart(size, "0");

/** Provisional number; the backend assigns the final one when it stores the note. */
export const buildDebitNoteNumber = (proposalNumber: string, date = new Date()) => {
	const ref = proposalNumber.replace(/[^A-Za-z0-9]/g, "").slice(-8) || "CRF";
	const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
	const seq = pad(date.getHours() * 60 + date.getMinutes(), 4);
	return `DN-${ref}-${stamp}-${seq}`;
};

export const buildDebitNote = ({
	context,
	outcome,
	issuedAt = new Date(),
}: {
	context: CrfOrderContext;
	outcome: StockCheckOutcome;
	issuedAt?: Date;
}): DebitNote => {
	const lines = outcome.shortLines.map((line) => ({
		sku: line.sku,
		title: line.title,
		variantTitle: line.variantTitle,
		approvedQty: line.approvedQty,
		availableQty: line.availableQty,
		shortQty: line.shortQty,
		unitPrice: line.unitPrice,
		gstRate: line.gstRate,
		pricing: line.shortPricing,
	}));
	const totals = sumPricing(lines.map((l) => l.pricing));

	return {
		number: buildDebitNoteNumber(context.proposalNumber, issuedAt),
		issuedAt: issuedAt.toISOString(),
		reason:
			"Stock shortfall at order time: the store could not supply the full approved quantity. The dealer debits THCM for the value of the quantity not supplied against this CRF.",
		crfId: context.crf?.id ?? "",
		proposalNumber: context.proposalNumber,
		eventName: context.eventName,
		raisedBy: { name: context.requester.name, email: context.requester.email },
		from: getDealerParty(context),
		to: { ...DEBIT_NOTE_ISSUED_TO, lines: [...DEBIT_NOTE_ISSUED_TO.lines] },
		lines,
		totals,
		amountInWords: amountInWords(totals.total),
	};
};

/* ========================================================================== */
/*                                   Payload                                  */
/* ========================================================================== */

/** THCM `channel` (1–50 chars): MAP-CRF-<ref>-A<attempt>. */
export const buildCrfChannel = (proposalNumber: string, attempt: number) => {
	const suffix = `-A${attempt}`;
	const ref = proposalNumber.replace(/[^A-Za-z0-9-]/g, "") || "CRF";
	return `MAP-CRF-${ref}`.slice(0, 50 - suffix.length) + suffix;
};

export const splitName = (fullName: string) => {
	const parts = fullName.trim().split(/\s+/);
	return {
		first_name: parts[0] ?? "",
		last_name: parts.slice(1).join(" ") || parts[0] || "",
	};
};

const orNull = (value: string) => value.trim() || null;
const orUndefined = (value: string) => value.trim() || undefined;

export const buildCrfOrderPayload = ({
	context,
	values,
	estimate,
	lines,
	nonStoreLines,
	shortfall,
	attempt,
}: {
	context: CrfOrderContext;
	values: CrfOrderFormValues;
	estimate: DeliveryEstimate;
	lines: CrfOrderLine[];
	nonStoreLines: CrfOrderPayload["nonStoreLines"];
	shortfall: ShortfallResolution;
	attempt: number;
}): CrfOrderPayload => {
	const pricedLines = lines.map((line) => ({ ...line, pricing: getOrderLinePricing(line) }));
	const address2 = [values.address2, values.landmark && `Landmark: ${values.landmark}`]
		.map((part) => (part || "").trim())
		.filter(Boolean)
		.join(", ");

	return {
		crfId: context.crf?.id ?? "",
		epcId: context.epcId,
		proposalNumber: context.proposalNumber,
		channel: buildCrfChannel(context.proposalNumber, attempt),
		attempt,

		items: lines.map((line) => ({ sku: line.sku, quantity: line.quantity })),
		name: context.requester.name,
		email: context.requester.email.toLowerCase(),
		phone: values.recipientPhone.trim(),
		shippingAddress: {
			...splitName(values.recipientName),
			company: orUndefined(values.company),
			address1: values.address1.trim(),
			address2: address2 || undefined,
			city: values.city.trim(),
			province: values.state.trim(),
			zip: values.pincode.trim(),
			country: "India",
			phone: values.recipientPhone.trim(),
		},

		billingAddress: values.billingSameAsShipping
			? null
			: {
					...splitName(values.billingName),
					company: orUndefined(values.billingCompany),
					address1: values.billingAddress1.trim(),
					city: values.billingCity.trim(),
					province: values.billingState.trim(),
					zip: values.billingPincode.trim(),
					country: "India",
					gstin: orUndefined(values.billingGstin.toUpperCase()),
				},
		recipient: {
			name: values.recipientName.trim(),
			phone: values.recipientPhone.trim(),
			email: orNull(values.recipientEmail),
			alternatePhone: orNull(values.alternatePhone),
			landmark: orNull(values.landmark),
			deliveryInstructions: orNull(values.deliveryInstructions),
		},
		deliveryEstimate: {
			pincode: estimate.pincode,
			minDays: estimate.minDays,
			maxDays: estimate.maxDays,
			fromDate: estimate.fromDate,
			toDate: estimate.toDate,
		},
		lines: pricedLines,
		totals: sumPricing(pricedLines.map((l) => l.pricing)),
		nonStoreLines,
		shortfall,
	};
};

/* ========================================================================== */
/*                                  Tracking                                  */
/* ========================================================================== */

export type TrackingStepState = "done" | "current" | "upcoming" | "error";

export type TrackingStep = {
	key: "placed" | "packed" | "shipped" | "out_for_delivery" | "delivered";
	label: string;
	state: TrackingStepState;
	hint?: string;
};

const DELIVERY_FAILURES = new Set(["failure", "attempted_delivery", "failed"]);

export const getCrfOrderStatus = (order: ShopOrder): CrfOrderStatus => {
	const delivery = (order.deliveryStatus ?? "").toLowerCase();
	if (order.status === "cancelled" || order.status === "refunded") return "CANCELLED";
	if (delivery === "delivered") return "DELIVERED";
	if (DELIVERY_FAILURES.has(delivery)) return "DELIVERY_FAILED";
	if (order.fulfillmentStatus === "partial") return "PARTIALLY_FULFILLED";
	if (order.fulfillmentStatus === "fulfilled" || delivery) return "SHIPPED";
	return "ORDER_CREATED";
};

export const CRF_ORDER_STATUS_LABEL: Record<CrfOrderStatus, string> = {
	ORDER_CREATED: "Order placed",
	PARTIALLY_FULFILLED: "Partially shipped",
	SHIPPED: "Shipped",
	DELIVERED: "Delivered",
	DELIVERY_FAILED: "Delivery issue",
	CANCELLED: "Cancelled",
};

/** Placed → Packed → Shipped → Out for delivery → Delivered. */
export const getTrackingSteps = (order: ShopOrder): TrackingStep[] => {
	const delivery = (order.deliveryStatus ?? "").toLowerCase();

	// Index of the last COMPLETED step (the order exists → "placed" is done).
	let done = 0;
	if (order.fulfillmentStatus === "partial") done = 1;
	if (order.fulfillmentStatus === "fulfilled" || delivery) done = 2;
	if (delivery === "out_for_delivery") done = 3;
	if (delivery === "delivered") done = 4;

	const failed = DELIVERY_FAILURES.has(delivery);
	const cancelled = order.status === "cancelled" || order.status === "refunded";

	const steps: Omit<TrackingStep, "state">[] = [
		{ key: "placed", label: "Order placed" },
		{ key: "packed", label: order.fulfillmentStatus === "partial" ? "Partially shipped" : "Packed" },
		{ key: "shipped", label: "Shipped" },
		{ key: "out_for_delivery", label: "Out for delivery" },
		{ key: "delivered", label: "Delivered" },
	];

	return steps.map((step, index) => {
		if (cancelled) {
			return { ...step, state: index === 0 ? "done" : index === 1 ? "error" : "upcoming", hint: index === 1 ? "Order cancelled" : undefined };
		}
		if (failed && index === 3) {
			return { ...step, state: "error", hint: delivery === "attempted_delivery" ? "Delivery attempted" : "Delivery failed" };
		}
		const state: TrackingStepState =
			index <= done ? "done" : index === done + 1 ? "current" : "upcoming";
		return { ...step, state };
	});
};
