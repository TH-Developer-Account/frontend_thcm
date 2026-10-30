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
// MOCK-LAYER: the "Use mock data" checkbox (HandoutMockToggle) switches this
// whole file between the real API and the in-memory adapter at runtime. Lines
// tagged MOCK-LAYER are the only mock-related changes; delete them (and the
// mock files) when the backend is live.

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";

import { ServerAxios } from "../../../services/ServerAxios";
import { crfShopApi, crfShopKeys } from "../crf";
import { handoutMockApi } from "./handouts.mock"; // MOCK-LAYER
import {
	isHandoutMockEnabled, // MOCK-LAYER
	useHandoutMockMode, // MOCK-LAYER
} from "./handouts.mockMode";
import type {
	CreateHandoutPayload,
	DeliverHandoutPayload,
	HandoutDetail,
	HandoutItem,
	HandoutListParams,
	HandoutListResponse,
} from "./handouts.types";

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

// MOCK-LAYER: picked per call so the checkbox takes effect immediately.
// When removing the mock layer, replace this block with:
//   export const handoutApi = realApi;
const activeApi = () => (isHandoutMockEnabled() ? handoutMockApi : realApi);

export const handoutApi: typeof realApi = {
	list: (params) => activeApi().list(params),
	get: (id) => activeApi().get(id),
	create: (payload) => activeApi().create(payload),
	approve: (id) => activeApi().approve(id),
	reject: (id, reason) => activeApi().reject(id, reason),
	cancel: (id, reason) => activeApi().cancel(id, reason),
	deliver: (id, payload) => activeApi().deliver(id, payload),
};

/* ========================================================================== */
/*                                    Keys                                    */
/* ========================================================================== */

// MOCK-LAYER: mock and real data get separate cache entries so flipping the
// checkbox never shows one side's data under the other. `all` is unchanged, so
// `invalidateQueries({ queryKey: handoutKeys.all })` still refreshes both.
const modeTag = () => (isHandoutMockEnabled() ? "mock" : "live");

export const handoutKeys = {
	all: ["handouts"] as const,
	list: (params: HandoutListParams) =>
		[...handoutKeys.all, modeTag(), "list", params] as const,
	detail: (id: string) =>
		[...handoutKeys.all, modeTag(), "detail", id] as const,
	stock: (skuKey: string) =>
		[...handoutKeys.all, modeTag(), "stock", skuKey] as const,
};

/* ========================================================================== */
/*                                   Hooks                                    */
/* ========================================================================== */

export function useHandoutsQuery(params: HandoutListParams) {
	useHandoutMockMode(); // MOCK-LAYER: re-render (and re-key) when the checkbox flips
	return useQuery({
		queryKey: handoutKeys.list(params),
		queryFn: () => handoutApi.list(params),
		// Keep the old page on screen while the next one loads (no table flash).
		placeholderData: keepPreviousData,
	});
}

export function useHandoutQuery(id: string | undefined) {
	useHandoutMockMode(); // MOCK-LAYER
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
	useHandoutMockMode(); // MOCK-LAYER

	const bySku = new Map<string, number>();
	for (const item of items) {
		bySku.set(item.sku, (bySku.get(item.sku) ?? 0) + item.quantity);
	}
	const lines = [...bySku.entries()]
		.map(([sku, quantity]) => ({ sku, quantity }))
		.sort((a, b) => a.sku.localeCompare(b.sku));

	return useQuery({
		queryKey: [...crfShopKeys.all, "handout-stock", modeTag(), lines] as const, // MOCK-LAYER: modeTag()
		queryFn: () =>
			isHandoutMockEnabled() // MOCK-LAYER: mock stock when the checkbox is on
				? handoutMockApi.stockCheck(lines)
				: crfShopApi.stockCheck(lines),
		enabled: enabled && lines.length > 0,
		staleTime: 30 * 1000,
	});
}
