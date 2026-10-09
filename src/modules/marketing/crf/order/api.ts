// crf/order/api.ts
// CRF order-step HTTP calls + TanStack Query hooks, against the real
// backend routes (crf.routes.ts / crf-order.controller.ts):
//
//   PUT  /crf/:crfId/dispatch-details
//   PUT  /crf/:crfId/souvenirs
//   POST /crf/:crfId/order
//   POST /crf/:crfId/order/retry
//   POST /crf/:crfId/order/cancel
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
// Because of that uncertainty, nothing here trusts a mutation's own
// response for anything other than placeOrder/retryOrder. Every mutation's
// onSuccess instead calls the caller-supplied `onSaved`, whose job is to
// refetch the CRF's own detail query (GET /crf/:crfId) — the one shape this
// module is certain about — so the UI never depends on a guessed shape.

import { useMutation } from "@tanstack/react-query";

import { ServerAxios } from "../../../../services/ServerAxios";
import type { ApiCrfOrder } from "../core/types";
import type {
	CancelOrderInput,
	DispatchDetailsInput,
	PlaceOrderInput,
	SwapSouvenirsInput,
} from "./types";

/* ========================================================================== */
/*                                    API                                     */
/* ========================================================================== */

export const crfOrderApi = {
	updateDispatchDetails: async (crfId: string, input: DispatchDetailsInput): Promise<unknown> => {
		const {
			data: { data },
		} = await ServerAxios.put(`/crf/${crfId}/dispatch-details`, input);
		return data;
	},

	swapSouvenirLines: async (crfId: string, input: SwapSouvenirsInput): Promise<unknown> => {
		const {
			data: { data },
		} = await ServerAxios.put(`/crf/${crfId}/souvenirs`, input);
		return data;
	},

	placeOrder: async (crfId: string, input: PlaceOrderInput = {}): Promise<ApiCrfOrder> => {
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

	cancelOrder: async (crfId: string, input: CancelOrderInput = {}): Promise<unknown> => {
		const {
			data: { data },
		} = await ServerAxios.post(`/crf/${crfId}/order/cancel`, input);
		return data;
	},
};

/* ========================================================================== */
/*                                   Hooks                                    */
/* ========================================================================== */

export function useUpdateDispatchDetailsMutation() {
	return useMutation({
		mutationFn: ({ crfId, input }: { crfId: string; input: DispatchDetailsInput }) =>
			crfOrderApi.updateDispatchDetails(crfId, input),
	});
}

export function useSwapSouvenirLinesMutation() {
	return useMutation({
		mutationFn: ({ crfId, input }: { crfId: string; input: SwapSouvenirsInput }) =>
			crfOrderApi.swapSouvenirLines(crfId, input),
	});
}

export function usePlaceCrfOrderMutation() {
	return useMutation({
		mutationFn: ({ crfId, input }: { crfId: string; input?: PlaceOrderInput }) =>
			crfOrderApi.placeOrder(crfId, input),
	});
}

export function useRetryCrfOrderMutation() {
	return useMutation({
		mutationFn: ({ crfId }: { crfId: string }) => crfOrderApi.retryOrder(crfId),
	});
}

export function useCancelCrfOrderMutation() {
	return useMutation({
		mutationFn: ({ crfId, input }: { crfId: string; input?: CancelOrderInput }) =>
			crfOrderApi.cancelOrder(crfId, input),
	});
}
