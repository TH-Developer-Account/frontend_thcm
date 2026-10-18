// crf/order/api.ts
// CRF order-step HTTP calls + TanStack Query hooks, against the backend
// routes (crf.routes.ts / crf-order.controller.ts):
//
//   GET  /crf/:crfId/delivery-estimate?pincode=   (NOT BUILT YET — mocked below)
//   PUT  /crf/:crfId/dispatch-details
//   PUT  /crf/:crfId/souvenirs
//   POST /crf/:crfId/order
//   POST /crf/:crfId/order/retry
//   POST /crf/:crfId/order/cancel
//   POST /crf/:crfId/stock-check/retry
//
// Every handler responds { success: true, data }. What `data` actually
// contains differs by route and isn't fully pinned down from the frontend
// side yet:
//   • placeOrder / retryOrder return the created/retried CrfOrder row,
//     which matches ApiCrfOrder (crf.types.ts) — confirmed against
//     crfOrder.service.ts's executeOrderPlacement.
//   • updateDispatchDetails returns the raw updated CRF row from
//     `tx.cRF.update(...)` — NOT the full CrfDetail shape (no items/
//     permissions/order on it).
//   • swapSouvenirLines and cancelOrder's exact return shapes weren't
//     re-confirmed this pass.
//   • retryStockCheck returns `{ id: crfId }` (crfOrder.service.ts's
//     retryStockCheck) — not a full CrfDetail either.
// Because of that uncertainty, nothing here trusts a mutation's own
// response for anything other than placeOrder/retryOrder. Every mutation's
// onSuccess instead calls the caller-supplied `onSaved`, whose job is to
// refetch the CRF's own detail query (GET /crf/:crfId) — the one shape this
// module is certain about — so the UI never depends on a guessed shape.

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

/* ========================================================================== */
/*                          Delivery estimate (mock switch)                   */
/* ========================================================================== */

/**
 * The delivery-estimate endpoint doesn't exist yet. While this is `true`,
 * `crfOrderApi.getDeliveryEstimate` answers from `mockDeliveryEstimate`
 * (below) so the whole PIN step — UI, validation, loading / error states,
 * pre-fill, summary — can be built and tested end to end.
 *
 * When the backend ships GET /crf/:crfId/delivery-estimate, set this to
 * `false`. Nothing else changes: the request, response mapping
 * (`normalizeDeliveryEstimate`) and every consumer already go through the
 * real path.
 */
export const DELIVERY_ESTIMATE_USE_MOCK = true;

const MOCK_LATENCY_MS = 600;

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

/** Stand-in for the real endpoint — deterministic from the PIN's first digit. */
const mockDeliveryEstimate = async (
	pincode: string,
): Promise<DeliveryEstimate> => {
	await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

	// Indian PINs start with 1–8; 0 and 9 aren't in use for delivery here.
	if (!/^[1-8]\d{5}$/.test(pincode)) {
		return {
			pincode,
			serviceable: false,
			message: "We can't deliver to this PIN code yet.",
		};
	}

	const first = Number(pincode[0]);
	const [minDays, maxDays] =
		first >= 7 ? [5, 8] : first === 5 ? [2, 4] : [3, 6];

	return {
		pincode,
		serviceable: true,
		minDays,
		maxDays,
		estimatedDeliveryDate: addBusinessDays(new Date(), maxDays).toISOString(),
		shippingCharge: null,
	};
};

/**
 * Maps whatever the endpoint returns onto DeliveryEstimate. Tolerant on
 * purpose (a couple of likely alternative names) so a small difference in
 * the backend's field naming doesn't break the step — tighten it once the
 * real response is final.
 */
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

/* ========================================================================== */
/*                                    API                                     */
/* ========================================================================== */

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

/* ========================================================================== */
/*                                    Keys                                    */
/* ========================================================================== */

export const crfOrderKeys = {
	deliveryEstimate: (crfId: string, pincode: string) =>
		["crf", "delivery-estimate", crfId, pincode] as const,
};

/* ========================================================================== */
/*                                   Hooks                                    */
/* ========================================================================== */

/**
 * Delivery estimate for one PIN. Only runs for a well-formed 6-digit PIN —
 * the caller passes the PIN the user asked to check (not every keystroke).
 */
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
		// A failed lookup is shown with a Retry button, not silently re-fired.
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
