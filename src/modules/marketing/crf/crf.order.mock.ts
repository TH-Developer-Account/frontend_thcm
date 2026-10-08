// crf/crf.order.mock.ts
// In-browser stand-in for the CRF order backend while it's being built.
// Serves the same contract as crf.order.api.ts expects:
//
//   GET  /crf-shop/delivery-estimate?pincode=   → DeliveryEstimate
//   POST /crf-shop/stock-check                  → (re-uses crf.shop.mock)
//   POST /crf/:crfId/order                      → CrfOrderRecord  (logs the payload)
//   GET  /crf/:crfId/order                      → CrfOrderRecord | null
//
// Orders are kept in localStorage so tracking survives a refresh. Dev-only
// helpers: simulate a stock shortfall, and advance an order's status.

import { mockStockCheck } from "./crf.shop.mock";
import type { ShopStockCheckResult } from "./crf.shop.types";
import type {
	CrfOrderPayload,
	CrfOrderRecord,
	DeliveryEstimate,
	ShopOrder,
} from "./crf.order.types";
import { getCrfOrderStatus } from "./crf.order.logic";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ========================================================================== */
/*                               PIN → estimate                               */
/* ========================================================================== */

/** Same PINs as the THCM mock (README), with the cities THCM accepts. */
const KNOWN_PINS: Record<string, { state: string; district: string; cities: string[] }> = {
	"440001": { state: "Maharashtra", district: "Nagpur", cities: ["Nagpur"] },
	"400001": { state: "Maharashtra", district: "Mumbai", cities: ["Mumbai"] },
	"560034": { state: "Karnataka", district: "Bengaluru", cities: ["Bengaluru", "Bangalore"] },
	"580030": { state: "Karnataka", district: "Dharwad", cities: ["Dharwad", "Hubli"] },
	"751001": { state: "Odisha", district: "Khordha", cities: ["Bhubaneswar"] },
};

/** First PIN digit → postal zone (fallback for PINs not in the table). */
const PIN_ZONES: Record<string, { state: string; district: string; cities: string[] }> = {
	"1": { state: "Delhi", district: "New Delhi", cities: ["New Delhi"] },
	"2": { state: "Uttar Pradesh", district: "Lucknow", cities: ["Lucknow"] },
	"3": { state: "Gujarat", district: "Ahmedabad", cities: ["Ahmedabad"] },
	"4": { state: "Maharashtra", district: "Pune", cities: ["Pune"] },
	"5": { state: "Karnataka", district: "Bengaluru", cities: ["Bengaluru"] },
	"6": { state: "Tamil Nadu", district: "Chennai", cities: ["Chennai"] },
	"7": { state: "West Bengal", district: "Kolkata", cities: ["Kolkata"] },
	"8": { state: "Bihar", district: "Patna", cities: ["Patna"] },
};

/** The store dispatches from Karnataka (confirmed). */
const DISPATCH_STATE = "Karnataka";

const addWorkingDays = (from: Date, days: number) => {
	const date = new Date(from);
	let added = 0;
	while (added < days) {
		date.setDate(date.getDate() + 1);
		if (date.getDay() !== 0) added += 1; // skip Sundays
	}
	return date;
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const mockDeliveryEstimate = async (pincode: string): Promise<DeliveryEstimate> => {
	await delay(400);
	const pin = pincode.trim();
	const checkedAt = new Date().toISOString();
	const base: DeliveryEstimate = {
		pincode: pin,
		serviceable: false,
		district: null,
		stateName: null,
		cities: [],
		minDays: null,
		maxDays: null,
		fromDate: null,
		toDate: null,
		message: null,
		checkedAt,
	};

	if (!/^[1-9]\d{5}$/.test(pin)) {
		return { ...base, message: "Enter a valid 6-digit PIN code." };
	}

	// 9xxxxx = Army Postal Service — not served by the courier.
	if (pin.startsWith("9")) {
		return { ...base, message: "Army Postal Service PINs aren't served by the store's courier." };
	}

	const place = KNOWN_PINS[pin] ?? PIN_ZONES[pin[0]];
	if (!place) return { ...base, message: "This PIN code isn't in the PIN dataset." };

	// North-East (78xxxx / 79xxxx) takes longer.
	const [minDays, maxDays] =
		place.state === DISPATCH_STATE
			? [2, 4]
			: /^7[89]/.test(pin)
				? [7, 10]
				: ["4", "5", "6"].includes(pin[0])
					? [3, 6]
					: [5, 8];

	const today = new Date();
	return {
		...base,
		serviceable: true,
		district: place.district,
		stateName: place.state,
		cities: place.cities,
		minDays,
		maxDays,
		fromDate: isoDate(addWorkingDays(today, minDays)),
		toDate: isoDate(addWorkingDays(today, maxDays)),
		message: KNOWN_PINS[pin] ? null : "Estimated from the PIN zone (mock).",
	};
};

/* ========================================================================== */
/*                         Order-time stock (shortfall)                       */
/* ========================================================================== */

let simulateShortfall = false;
/** Fixed cap per SKU once a shortfall is simulated, so later checks agree. */
const simulatedCaps = new Map<string, number>();

/** Dev toggle: the next order-time stock check comes back short. */
export const setMockShortfall = (enabled: boolean) => {
	simulateShortfall = enabled;
	if (!enabled) simulatedCaps.clear();
};

export const isMockShortfallEnabled = () => simulateShortfall;

/**
 * Live stock check at ORDER time. With the shortfall simulation on, the
 * first SKU gets about half its requested quantity (stock "sold" while the
 * CRF was in approval).
 */
export const mockOrderStockCheck = async (
	items: { sku: string; quantity: number }[],
): Promise<ShopStockCheckResult> => {
	const result = await mockStockCheck(items);
	if (!simulateShortfall || items.length === 0) return result;

	// Only the FIRST check picks the short SKU; later checks reuse the same cap.
	if (simulatedCaps.size === 0) {
		simulatedCaps.set(items[0].sku.toLowerCase(), Math.floor(items[0].quantity / 2));
	}

	const lines = result.lines.map((line) => {
		const cap = simulatedCaps.get(line.sku.toLowerCase());
		if (cap === undefined) return line;
		const available = Math.min(line.available, cap);
		const status =
			line.status === "INACTIVE" || line.status === "UNKNOWN_SKU"
				? line.status
				: available <= 0
					? ("OUT_OF_STOCK" as const)
					: available < line.requested
						? ("PARTIAL" as const)
						: ("AVAILABLE" as const);
		return { ...line, available, status };
	});

	return { ...result, lines, allAvailable: lines.every((l) => l.status === "AVAILABLE") };
};

/* ========================================================================== */
/*                                   Orders                                   */
/* ========================================================================== */

const STORAGE_KEY = (crfId: string) => `crf-order-mock:${crfId}`;

const readRecord = (crfId: string): CrfOrderRecord | null => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY(crfId));
		return raw ? (JSON.parse(raw) as CrfOrderRecord) : null;
	} catch {
		return null;
	}
};

const writeRecord = (record: CrfOrderRecord) => {
	try {
		localStorage.setItem(STORAGE_KEY(record.crfId), JSON.stringify(record));
	} catch {
		/* storage unavailable — order lives for this page only */
	}
	memory.set(record.crfId, record);
};

const memory = new Map<string, CrfOrderRecord>();

export const mockGetOrder = async (crfId: string): Promise<CrfOrderRecord | null> => {
	await delay(250);
	return readRecord(crfId) ?? memory.get(crfId) ?? null;
};

/** Error shaped like MAP's proxy 409 (THCM_STOCK_CONFLICT). */
export class MockStockConflictError extends Error {
	response: {
		status: number;
		data: {
			success: false;
			statusCode: number;
			message: string;
			code: "THCM_STOCK_CONFLICT";
			details: { shortages: { sku: string; requested: number; available: number; unknownSku: boolean }[] };
		};
	};

	constructor(shortages: { sku: string; requested: number; available: number; unknownSku: boolean }[]) {
		const message = `Insufficient stock - ${shortages
			.map((s) => `${s.sku}: requested ${s.requested}, only ${s.available} available`)
			.join("; ")}`;
		super(message);
		this.response = {
			status: 409,
			data: { success: false, statusCode: 409, message, code: "THCM_STOCK_CONFLICT", details: { shortages } },
		};
	}
}

let nextOrderNo = 1070;

export const mockCreateOrder = async (
	payload: CrfOrderPayload,
	placedBy: { name: string; email: string },
): Promise<CrfOrderRecord> => {
	// Same duplicate guard as the backend: one order per CRF.
	const existing = readRecord(payload.crfId) ?? memory.get(payload.crfId);
	if (existing) return existing;

	// THCM Create Order re-checks live stock and fails the whole order on any shortage.
	const stock = await mockOrderStockCheck(payload.items);
	const shortages = stock.lines
		.filter((line) => line.status !== "AVAILABLE")
		.map((line) => ({
			sku: line.sku,
			requested: line.requested,
			available: line.available,
			unknownSku: line.status === "UNKNOWN_SKU",
		}));
	if (shortages.length) throw new MockStockConflictError(shortages);

	await delay(500);
	const now = new Date().toISOString();
	const id = nextOrderNo++;
	const shopOrder: ShopOrder = {
		id,
		shopifyOrderId: `71000000${String(id).padStart(5, "0")}`,
		name: payload.name,
		email: payload.email,
		phone: payload.phone,
		status: "open",
		financialStatus: "pending",
		fulfillmentStatus: null,
		deliveryStatus: null,
		closedAt: null,
		totalPrice: payload.totals.total.toFixed(2),
		trackingNumber: null,
		trackingUrl: null,
		carrier: null,
		channel: payload.channel,
		createdAt: now,
		updatedAt: now,
		lineItems: payload.lines.map((line, index) => ({
			id: id * 100 + index,
			orderId: id,
			sku: line.sku,
			title: line.variantTitle ? `${line.title} - ${line.variantTitle}` : line.title,
			quantity: line.quantity,
			price: line.unitPrice.toFixed(2),
		})),
	};

	const record: CrfOrderRecord = {
		crfId: payload.crfId,
		status: "ORDER_CREATED",
		placedAt: now,
		placedBy,
		payload,
		shopOrder,
		debitNote: payload.shortfall.type === "DEBIT_NOTE" ? payload.shortfall.debitNote : null,
	};
	writeRecord(record);
	setMockShortfall(false);
	return record;
};

/** Dev: move the order one step along Placed → Packed → Shipped → Out → Delivered. */
export const mockAdvanceOrder = async (crfId: string): Promise<CrfOrderRecord | null> => {
	const record = readRecord(crfId) ?? memory.get(crfId);
	if (!record) return null;

	const order = { ...record.shopOrder };
	const now = new Date().toISOString();

	if (!order.fulfillmentStatus && !order.deliveryStatus) {
		order.fulfillmentStatus = "fulfilled";
		order.deliveryStatus = "in_transit";
		order.carrier = "Blue Dart";
		order.trackingNumber = `BD${order.shopifyOrderId.slice(-8)}`;
		order.trackingUrl = `https://www.bluedart.com/tracking?awb=${order.trackingNumber}`;
	} else if (order.deliveryStatus === "in_transit") {
		order.deliveryStatus = "out_for_delivery";
	} else if (order.deliveryStatus === "out_for_delivery") {
		order.deliveryStatus = "delivered";
		order.status = "closed";
		order.closedAt = now;
	}
	order.updatedAt = now;

	const next: CrfOrderRecord = { ...record, shopOrder: order, status: getCrfOrderStatus(order) };
	writeRecord(next);
	return next;
};

/** Dev: forget the mock order for this CRF (start the flow again). */
export const mockResetOrder = (crfId: string) => {
	try {
		localStorage.removeItem(STORAGE_KEY(crfId));
	} catch {
		/* ignore */
	}
	memory.delete(crfId);
	setMockShortfall(false);
};
