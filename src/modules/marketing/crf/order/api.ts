// crf/order/api.ts
//   GET  /crf/:crfId/delivery-estimate?pincode=   (NOT BUILT YET — mocked below)
//   PUT  /crf/:crfId/dispatch-details
//   PUT  /crf/:crfId/souvenirs
//   POST /crf/:crfId/order
//   POST /crf/:crfId/order/retry
//   POST /crf/:crfId/stock-check/retry
// Only placeOrder / retryOrder responses are trusted; every other mutation's
// caller refetches GET /crf/:crfId.

import { useMutation, useQuery } from "@tanstack/react-query";

import { ServerAxios } from "../../../../services/ServerAxios";
import type { ApiCrfOrder } from "../core/types";
import { PINCODE_PATTERN } from "./schema";
import type {
	CancelOrderInput,
	DeliveryEstimate,
	DispatchDetailsInput,
	PlaceOrderInput,
	SwapSouvenirsInput,
} from "./types";

/* ------------------------- Delivery estimate (mock) ------------------------ */

/** While true, getDeliveryEstimate answers from the mock below. */
export const DELIVERY_ESTIMATE_USE_MOCK = true;

const MOCK_LATENCY_MS = 600;

/** A few known PINs resolve to a place so the address pre-fill can be tried. */
const MOCK_PLACES: Record<
	string,
	{ city: string; district: string; state: string }
> = {
	"560001": {
		city: "Bengaluru",
		district: "Bengaluru Urban",
		state: "Karnataka",
	},
	"575001": {
		city: "Mangaluru",
		district: "Dakshina Kannada",
		state: "Karnataka",
	},
	"400001": { city: "Mumbai", district: "Mumbai", state: "Maharashtra" },
	"110001": { city: "New Delhi", district: "New Delhi", state: "Delhi" },
	"700001": { city: "Kolkata", district: "Kolkata", state: "West Bengal" },
};

const addBusinessDays = (from: Date, days: number) => {
	const date = new Date(from);
	let remaining = days;
	while (remaining > 0) {
		date.setDate(date.getDate() + 1);
		const day = date.getDay();
		if (day !== 0 && day !== 6) remaining -= 1;
	}
	return date;
};

/**
 * Deterministic per PIN, so the same PIN always gives the same result:
 *   ends in 000        → request fails (tests "Couldn't check" + Try again)
 *   starts 0 or 9      → not serviceable (generic message)
 *   starts 19          → not serviceable (custom message)
 *   56–59 (Karnataka)  → 1–3 days, free
 *   other 5 / 6        → 2–4 / 3–5 days, free
 *   1–4                → 3–6 days, free
 *   7 / 8 (east, NE)   → 5–8 days, ₹150 charge + note
 */
const mockDeliveryEstimate = async (
	pincode: string,
): Promise<DeliveryEstimate> => {
	await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

	if (pincode.endsWith("000")) {
		throw new Error("Mock delivery check failure");
	}

	if (pincode.startsWith("19")) {
		return {
			pincode,
			serviceable: false,
			message: "This area is outside our delivery network.",
		};
	}

	if (!/^[1-8]\d{5}$/.test(pincode)) {
		return {
			pincode,
			serviceable: false,
			message: "We can't deliver to this PIN code yet.",
		};
	}

	const first = Number(pincode[0]);
	const karnataka = /^5[6-9]/.test(pincode);

	const [minDays, maxDays] = karnataka
		? [1, 3]
		: first >= 7
			? [5, 8]
			: first === 6
				? [3, 5]
				: first === 5
					? [2, 4]
					: [3, 6];

	return {
		pincode,
		serviceable: true,
		...(MOCK_PLACES[pincode] ?? {}),
		minDays,
		maxDays,
		estimatedDeliveryDate: addBusinessDays(new Date(), maxDays).toISOString(),
		shippingCharge: first >= 7 ? 150 : null,
		message: first >= 7 ? "Remote region, delivery may take longer." : null,
	};
};

const normalizeDeliveryEstimate = (
	raw: Record<string, unknown> | null | undefined,
	pincode: string,
): DeliveryEstimate => {
	const data = raw ?? {};
	const text = (value: unknown) =>
		typeof value === "string" && value.trim() ? value.trim() : null;
	const num = (value: unknown) => {
		const parsed = Number(value);
		return value === null || value === undefined || !Number.isFinite(parsed)
			? null
			: parsed;
	};

	return {
		pincode: text(data.pincode) ?? pincode,
		serviceable: Boolean(data.serviceable ?? data.isServiceable ?? false),
		city: text(data.city),
		district: text(data.district),
		state: text(data.state),
		minDays: num(data.minDays),
		maxDays: num(data.maxDays),
		estimatedDeliveryDate: text(
			data.estimatedDeliveryDate ?? data.estimatedDelivery ?? data.eta,
		),
		shippingCharge: num(data.shippingCharge ?? data.deliveryCharge),
		message: text(data.message),
	};
};

/* ---------------------------------- API ----------------------------------- */

export const crfOrderApi = {
	getDeliveryEstimate: async (
		crfId: string,
		pincode: string,
	): Promise<DeliveryEstimate> => {
		if (DELIVERY_ESTIMATE_USE_MOCK) return mockDeliveryEstimate(pincode);

		const {
			data: { data },
		} = await ServerAxios.get(`/crf/${crfId}/delivery-estimate`, {
			params: { pincode },
		});
		return normalizeDeliveryEstimate(data, pincode);
	},

	updateDispatchDetails: async (
		crfId: string,
		input: DispatchDetailsInput,
	): Promise<unknown> => {
		const {
			data: { data },
		} = await ServerAxios.put(`/crf/${crfId}/dispatch-details`, input);
		return data;
	},

	swapSouvenirLines: async (
		crfId: string,
		input: SwapSouvenirsInput,
	): Promise<unknown> => {
		const {
			data: { data },
		} = await ServerAxios.put(`/crf/${crfId}/souvenirs`, input);
		return data;
	},

	placeOrder: async (
		crfId: string,
		input: PlaceOrderInput = {},
	): Promise<ApiCrfOrder> => {
		const {
			data: { data },
		} = await ServerAxios.post(`/crf/${crfId}/order`, input);
		return data;
	},

	retryOrder: async (crfId: string): Promise<ApiCrfOrder> => {
		const {
			data: { data },
		} = await ServerAxios.post(`/crf/${crfId}/order/retry`);
		return data;
	},

	cancelOrder: async (
		crfId: string,
		input: CancelOrderInput = {},
	): Promise<unknown> => {
		const {
			data: { data },
		} = await ServerAxios.post(`/crf/${crfId}/order/cancel`, input);
		return data;
	},

	retryStockCheck: async (crfId: string): Promise<unknown> => {
		const {
			data: { data },
		} = await ServerAxios.post(`/crf/${crfId}/stock-check/retry`);
		return data;
	},
};

/* ---------------------------------- Keys ---------------------------------- */

export const crfOrderKeys = {
	deliveryEstimate: (crfId: string, pincode: string) =>
		["crf", "delivery-estimate", crfId, pincode] as const,
};

/* ---------------------------------- Hooks --------------------------------- */

/** Runs only for a well-formed 6-digit PIN the user asked to check. */
export function useDeliveryEstimateQuery(
	crfId: string | null,
	pincode: string | null,
) {
	const valid = Boolean(crfId) && PINCODE_PATTERN.test(pincode ?? "");

	return useQuery({
		queryKey: crfOrderKeys.deliveryEstimate(crfId ?? "", pincode ?? ""),
		queryFn: () =>
			crfOrderApi.getDeliveryEstimate(crfId as string, pincode as string),
		enabled: valid,
		staleTime: 5 * 60 * 1000,
		retry: false,
	});
}

export function useUpdateDispatchDetailsMutation() {
	return useMutation({
		mutationFn: ({
			crfId,
			input,
		}: {
			crfId: string;
			input: DispatchDetailsInput;
		}) => crfOrderApi.updateDispatchDetails(crfId, input),
	});
}

export function useSwapSouvenirLinesMutation() {
	return useMutation({
		mutationFn: ({
			crfId,
			input,
		}: {
			crfId: string;
			input: SwapSouvenirsInput;
		}) => crfOrderApi.swapSouvenirLines(crfId, input),
	});
}

export function usePlaceCrfOrderMutation() {
	return useMutation({
		mutationFn: ({
			crfId,
			input,
		}: {
			crfId: string;
			input?: PlaceOrderInput;
		}) => crfOrderApi.placeOrder(crfId, input),
	});
}

export function useRetryCrfOrderMutation() {
	return useMutation({
		mutationFn: ({ crfId }: { crfId: string }) => crfOrderApi.retryOrder(crfId),
	});
}

export function useCancelCrfOrderMutation() {
	return useMutation({
		mutationFn: ({
			crfId,
			input,
		}: {
			crfId: string;
			input?: CancelOrderInput;
		}) => crfOrderApi.cancelOrder(crfId, input),
	});
}

export function useRetryStockCheckMutation() {
	return useMutation({
		mutationFn: ({ crfId }: { crfId: string }) =>
			crfOrderApi.retryStockCheck(crfId),
	});
}
