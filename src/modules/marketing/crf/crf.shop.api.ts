// crf/crf.shop.api.ts
// Store (Shopify) calls for the CRF Souvenirs tab — via MAP's proxy only;
// the browser never talks to THCM directly (API key stays server-side).
//
//   GET  /crf-shop/catalog       → souvenir catalog (cursor-paged)
//   GET  /crf-shop/catalog/:key  → one product: all images + every variant
//   POST /crf-shop/stock-check   → live stock re-check before saving the CRF
//
// While the backend proxy is not ready, CRF_SHOP_USE_MOCK serves the same
// contract from crf.shop.mock.ts. Flip it to false when the proxy is live —
// nothing else changes.

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { ServerAxios } from "../../../services/ServerAxios";
import { mockGetCatalog, mockGetProduct, mockStockCheck } from "./crf.shop.mock";
import type {
	ShopCatalogParams,
	ShopCatalogResponse,
	ShopProductDetail,
	ShopStockCheckResult,
} from "./crf.shop.types";

/** TODO(backend): set to false once /crf-shop/* is deployed. */
export const CRF_SHOP_USE_MOCK = true;

const CATALOG_PAGE_SIZE = 50;

/* ========================================================================== */
/*                                    API                                     */
/* ========================================================================== */

export const crfShopApi = {
	getCatalog: async (
		params: ShopCatalogParams = {},
	): Promise<ShopCatalogResponse> => {
		if (CRF_SHOP_USE_MOCK) return mockGetCatalog(params);

		// Proxy returns { data, pageInfo } at the top level of the body.
		const { data } = await ServerAxios.get("/crf-shop/catalog", { params });
		const body = data as ShopCatalogResponse;
		return { data: body.data ?? [], pageInfo: body.pageInfo };
	},

	/** key = product id, variant id, SKU or handle. */
	getProduct: async (key: string): Promise<ShopProductDetail> => {
		if (CRF_SHOP_USE_MOCK) return mockGetProduct(key);

		const {
			data: { data },
		} = await ServerAxios.get(`/crf-shop/catalog/${encodeURIComponent(key)}`);
		return data;
	},

	stockCheck: async (
		items: { sku: string; quantity: number }[],
	): Promise<ShopStockCheckResult> => {
		if (CRF_SHOP_USE_MOCK) return mockStockCheck(items);

		const {
			data: { data },
		} = await ServerAxios.post("/crf-shop/stock-check", { items });
		return data;
	},
};

/* ========================================================================== */
/*                                    Keys                                    */
/* ========================================================================== */

export const crfShopKeys = {
	all: ["crf-shop"] as const,
	catalog: (params: Omit<ShopCatalogParams, "after">) =>
		[...crfShopKeys.all, "catalog", params] as const,
	product: (key: string) => [...crfShopKeys.all, "product", key] as const,
};

/* ========================================================================== */
/*                                   Hooks                                    */
/* ========================================================================== */

/**
 * Souvenir catalog, cursor-paged. Same filters are re-sent with every cursor
 * (contract rule: a cursor is a position inside the filtered list).
 */
export function useSouvenirCatalogQuery(
	params: Omit<ShopCatalogParams, "after" | "limit">,
	enabled = true,
) {
	const baseParams = { ...params, limit: CATALOG_PAGE_SIZE };

	return useInfiniteQuery({
		queryKey: crfShopKeys.catalog(baseParams),
		queryFn: ({ pageParam }) =>
			crfShopApi.getCatalog({ ...baseParams, after: pageParam ?? undefined }),
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) =>
			lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.nextCursor : null,
		enabled,
		// Contract: the store list is cached ~30 s server-side.
		staleTime: 30 * 1000,
	});
}

/** One store product for the product view (all images, every variant). */
export function useSouvenirProductQuery(key: string | null | undefined) {
	return useQuery({
		queryKey: crfShopKeys.product(key ?? ""),
		queryFn: () => crfShopApi.getProduct(key as string),
		enabled: Boolean(key),
		staleTime: 30 * 1000,
	});
}

export function useStockCheckMutation() {
	return useMutation({
		mutationFn: (items: { sku: string; quantity: number }[]) =>
			crfShopApi.stockCheck(items),
	});
}
