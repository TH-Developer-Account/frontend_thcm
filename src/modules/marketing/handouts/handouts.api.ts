// handouts/handouts.api.ts
// Handouts API + query keys + hooks. Same layering as crf/core/api.ts:
// ServerAxios, a `*Keys` factory, thin useQuery / useMutation hooks. Mutations
// do NOT refresh anything — the calling page invalidates `handoutKeys.all`.
//
//   POST /handouts                  create + submit for approval
//   GET  /handouts?view=mine|approve|deliver&status&search&page&pageSize
//   GET  /handouts/:id              detail + server-computed `permissions`
//   POST /handouts/:id/approve
//   POST /handouts/:id/reject   { reason }
//   POST /handouts/:id/cancel   { reason }
//   POST /handouts/:id/deliver  { handedToName, deliveredOn, note?, checkedSkus }
//
// Souvenir availability is NOT a handouts endpoint: it reuses the CRF shop's
// display-only POST /crf-shop/stock-check (never a reservation).
//
// Set VITE_HANDOUTS_MOCK=true to run the whole flow against an in-memory
// adapter until the backend routes exist.

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";

import { ServerAxios } from "../../../services/ServerAxios";
import { crfShopApi, crfShopKeys } from "../crf";
import { handoutMockApi } from "./handouts.mock";
import type {
	CreateHandoutPayload,
	DeliverHandoutPayload,
	HandoutDetail,
	HandoutItem,
	HandoutListParams,
	HandoutListResponse,
} from "./handouts.types";

const USE_MOCK = import.meta.env.VITE_HANDOUTS_MOCK === "true";

/* ========================================================================== */
/*                                    API                                     */
/* ========================================================================== */

const realApi = {
	list: async (params: HandoutListParams): Promise<HandoutListResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get("/handouts", { params });
		return data;
	},

	get: async (id: string): Promise<HandoutDetail> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/handouts/${id}`);
		return data;
	},

	create: async (
		payload: CreateHandoutPayload,
	): Promise<{ id: string; requestNumber: string }> => {
		const {
			data: { data },
		} = await ServerAxios.post("/handouts", payload);
		return data;
	},

	approve: async (id: string): Promise<void> => {
		await ServerAxios.post(`/handouts/${id}/approve`);
	},

	reject: async (id: string, reason: string): Promise<void> => {
		await ServerAxios.post(`/handouts/${id}/reject`, { reason });
	},

	cancel: async (id: string, reason: string): Promise<void> => {
		await ServerAxios.post(`/handouts/${id}/cancel`, { reason });
	},

	deliver: async (
		id: string,
		payload: DeliverHandoutPayload,
	): Promise<void> => {
		await ServerAxios.post(`/handouts/${id}/deliver`, payload);
	},
};

export const handoutApi: typeof realApi = USE_MOCK ? handoutMockApi : realApi;

/* ========================================================================== */
/*                                    Keys                                    */
/* ========================================================================== */

export const handoutKeys = {
	all: ["handouts"] as const,
	list: (params: HandoutListParams) =>
		[...handoutKeys.all, "list", params] as const,
	detail: (id: string) => [...handoutKeys.all, "detail", id] as const,
	stock: (skuKey: string) => [...handoutKeys.all, "stock", skuKey] as const,
};

/* ========================================================================== */
/*                                   Hooks                                    */
/* ========================================================================== */

export function useHandoutsQuery(params: HandoutListParams) {
	return useQuery({
		queryKey: handoutKeys.list(params),
		queryFn: () => handoutApi.list(params),
		// Keep the old page on screen while the next one loads (no table flash).
		placeholderData: keepPreviousData,
	});
}

export function useHandoutQuery(id: string | undefined) {
	return useQuery({
		queryKey: handoutKeys.detail(id ?? ""),
		queryFn: () => handoutApi.get(id as string),
		enabled: Boolean(id),
	});
}

export function useCreateHandoutMutation() {
	return useMutation({ mutationFn: handoutApi.create });
}

export function useApproveHandoutMutation() {
	return useMutation({ mutationFn: (id: string) => handoutApi.approve(id) });
}

export function useRejectHandoutMutation() {
	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) =>
			handoutApi.reject(id, reason),
	});
}

export function useCancelHandoutMutation() {
	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) =>
			handoutApi.cancel(id, reason),
	});
}

export function useDeliverHandoutMutation() {
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: DeliverHandoutPayload;
		}) => handoutApi.deliver(id, payload),
	});
}

/**
 * Live availability of a request's SKUs, for the approver and delivery team.
 * Display only — the CRF shop never reserves stock. Summed per SKU so two
 * lines of the same SKU are compared with the stock once.
 */
export function useHandoutStockQuery(items: HandoutItem[], enabled = true) {
	const bySku = new Map<string, number>();
	for (const item of items) {
		bySku.set(item.sku, (bySku.get(item.sku) ?? 0) + item.quantity);
	}
	const lines = [...bySku.entries()]
		.map(([sku, quantity]) => ({ sku, quantity }))
		.sort((a, b) => a.sku.localeCompare(b.sku));

	return useQuery({
		queryKey: [...crfShopKeys.all, "handout-stock", lines] as const,
		queryFn: () => crfShopApi.stockCheck(lines),
		enabled: enabled && lines.length > 0,
		staleTime: 30 * 1000,
	});
}
