// crf/shop/api.ts
// Store (Shopify) calls for the CRF Souvenirs tab — via MAP's proxy only;
// the browser never talks to THCM directly (API key stays server-side).
//
//   GET  /crf-shop/catalog       → souvenir catalog (cursor-paged)
//   GET  /crf-shop/catalog/:key  → one product: all images + every variant
//   POST /crf-shop/stock-check   → live stock re-check before saving the CRF

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { ServerAxios } from "../../../../services/ServerAxios";
import type {
	ShopCatalogParams,
	ShopCatalogResponse,
	ShopProductDetail,
	ShopStockCheckResult,
} from "./types";

const CATALOG_PAGE_SIZE = 50;

/* ========================================================================== */
/*                                    API                                     */
/* ========================================================================== */

export const crfShopApi = {
	getCatalog: async (
		params: ShopCatalogParams = {},
	): Promise<ShopCatalogResponse> => {
		// Proxy returns { data, pageInfo } at the top level of the body.
		const { data } = await ServerAxios.get("/crf-shop/catalog", { params });
		const body = data as ShopCatalogResponse;
		return { data: body.data ?? [], pageInfo: body.pageInfo };
	},

	/** key = product id, variant id, SKU or handle. */
	getProduct: async (key: string): Promise<ShopProductDetail> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/crf-shop/catalog/${encodeURIComponent(key)}`);
		return data;
	},

	stockCheck: async (
		items: { sku: string; quantity: number }[],
	): Promise<ShopStockCheckResult> => {
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
	bySkus: (skus: string[]) => [...crfShopKeys.all, "by-skus", skus] as const,
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

/**
 * One-off, non-paged lookup for an exact set of SKUs — used to backfill a
 * saved CRF's souvenir lines (title, image, price, GST) on edit-load, since
 * the backend only kept { sku, requestedQty, status } for them. Not the
 * browse/search catalog: `limit` is sized to the SKU list itself, so every
 * requested SKU comes back in one page rather than needing pagination.
 */
export function useSouvenirStockBySkusQuery(
	skus: string[],
	enabled = true,
) {
	const sortedSkus = [...skus].sort();

	return useQuery({
		queryKey: crfShopKeys.bySkus(sortedSkus),
		queryFn: () =>
			crfShopApi.getCatalog({
				sku: sortedSkus.join(","),
				limit: Math.min(sortedSkus.length, 100),
			}),
		enabled: enabled && sortedSkus.length > 0,
		staleTime: 30 * 1000,
	});
}
