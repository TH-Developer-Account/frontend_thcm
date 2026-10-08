// crf/crf.order.api.ts
// CRF order calls + TanStack Query hooks. Uses the mock until MAP's backend
// exposes these routes (same switch as the catalog: CRF_SHOP_USE_MOCK).
//
//   GET  /crf-shop/delivery-estimate?pincode=   PIN → serviceability + ETA
//   POST /crf-shop/stock-check                   live stock at order time
//   GET  /crf/:crfId/order                       the CRF's order (404 → null)
//   POST /crf/:crfId/order                       place the order (→ Shopify)
//
// Every create logs the full payload to the console (requested: "for now
// console it"), mock or real.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ServerAxios } from "../../../services/ServerAxios";
import { CRF_SHOP_USE_MOCK, crfShopApi } from "./crf.shop.api";
import type { ShopStockCheckResult } from "./crf.shop.types";
import {
	mockAdvanceOrder,
	mockCreateOrder,
	mockDeliveryEstimate,
	mockGetOrder,
	mockOrderStockCheck,
	mockResetOrder,
} from "./crf.order.mock";
import type { CrfOrderPayload, CrfOrderRecord, DeliveryEstimate } from "./crf.order.types";

/* ========================================================================== */
/*                                    API                                     */
/* ========================================================================== */

export const crfOrderApi = {
	getDeliveryEstimate: async (pincode: string): Promise<DeliveryEstimate> => {
		if (CRF_SHOP_USE_MOCK) return mockDeliveryEstimate(pincode);

		const {
			data: { data },
		} = await ServerAxios.get("/crf-shop/delivery-estimate", { params: { pincode } });
		return data;
	},

	/** Order-time stock check (authoritative — runs right before ordering). */
	stockCheck: async (items: { sku: string; quantity: number }[]): Promise<ShopStockCheckResult> =>
		CRF_SHOP_USE_MOCK ? mockOrderStockCheck(items) : crfShopApi.stockCheck(items),

	getOrder: async (crfId: string): Promise<CrfOrderRecord | null> => {
		if (CRF_SHOP_USE_MOCK) return mockGetOrder(crfId);

		try {
			const {
				data: { data },
			} = await ServerAxios.get(`/crf/${crfId}/order`);
			return data ?? null;
		} catch (error: any) {
			if (error?.response?.status === 404) return null;
			throw error;
		}
	},

	createOrder: async (
		payload: CrfOrderPayload,
		placedBy: { name: string; email: string },
	): Promise<CrfOrderRecord> => {
		// TODO(backend): remove once the order route is live and logged server-side.
		console.groupCollapsed(`[CRF order] → Shopify · ${payload.channel}`);
		console.log("CRF + shipment payload", payload);
		console.log("THCM Create Order body", {
			items: payload.items,
			name: payload.name,
			email: payload.email,
			phone: payload.phone,
			channel: payload.channel,
			shippingAddress: payload.shippingAddress,
		});
		console.groupEnd();

		if (CRF_SHOP_USE_MOCK) return mockCreateOrder(payload, placedBy);

		const {
			data: { data },
		} = await ServerAxios.post(`/crf/${payload.crfId}/order`, payload);
		return data;
	},
};

/** Dev-only helpers (mock). */
export const crfOrderDevApi = {
	advance: mockAdvanceOrder,
	reset: mockResetOrder,
};

/* ========================================================================== */
/*                                    Keys                                    */
/* ========================================================================== */

export const crfOrderKeys = {
	all: ["crf-order"] as const,
	order: (crfId: string) => [...crfOrderKeys.all, "order", crfId] as const,
};

/* ========================================================================== */
/*                                   Hooks                                    */
/* ========================================================================== */

export function useCrfOrderQuery(crfId: string | null | undefined) {
	return useQuery({
		queryKey: crfOrderKeys.order(crfId ?? ""),
		queryFn: () => crfOrderApi.getOrder(crfId as string),
		enabled: Boolean(crfId),
		// Tracking changes slowly; refresh on focus and every 2 min while open.
		staleTime: 30 * 1000,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			return status && status !== "DELIVERED" && status !== "CANCELLED" ? 2 * 60 * 1000 : false;
		},
	});
}

export function useDeliveryEstimateMutation() {
	return useMutation({ mutationFn: (pincode: string) => crfOrderApi.getDeliveryEstimate(pincode) });
}

export function useOrderStockCheckMutation() {
	return useMutation({
		mutationFn: (items: { sku: string; quantity: number }[]) => crfOrderApi.stockCheck(items),
	});
}

export function useCreateCrfOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			payload,
			placedBy,
		}: {
			payload: CrfOrderPayload;
			placedBy: { name: string; email: string };
		}) => crfOrderApi.createOrder(payload, placedBy),
		onSuccess: (record) => {
			queryClient.setQueryData(crfOrderKeys.order(record.crfId), record);
		},
	});
}
