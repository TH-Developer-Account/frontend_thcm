// crf/crf.api.ts
// CRF HTTP calls, query keys and TanStack Query hooks.
// Merged from: activity-planner/api/crf.api.ts + activity-planner/queries/crf.queries.ts
//
// The mutations do NOT refresh any parent (EPC, ePRF …). The caller does that in
// the `onSuccess` it passes to <CrfForm />, so this module never imports another
// module's query keys.

import { useMutation, useQuery } from "@tanstack/react-query";

import type { CrfDetail, CrfPayload } from "./crf.types";
import { ServerAxios } from "../../../services/ServerAxios";
import type { Product } from "../shared/lineItem.types";

/* ========================================================================== */
/*                                    API                                     */
/* ========================================================================== */

export const crfApi = {
	getById: async (crfId: string): Promise<CrfDetail> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/crf/${crfId}`);

		return data;
	},

	create: async (payload: CrfPayload) => {
		const {
			data: { data },
		} = await ServerAxios.post("/crf", payload);

		return data;
	},

	update: async (crfId: string, payload: CrfPayload) => {
		const {
			data: { data },
		} = await ServerAxios.put(`/crf/${crfId}`, payload);

		return data;
	},

	getProducts: async (): Promise<Product[]> => {
		const {
			data: { data },
		} = await ServerAxios.get("/master-data/products", {
			params: { productType: "CRF" },
		});

		return data ?? [];
	},
};

/* ========================================================================== */
/*                                    Keys                                    */
/* ========================================================================== */

export const crfKeys = {
	all: ["crf"] as const,
	products: () => ["products", "CRF"] as const,
};

/* ========================================================================== */
/*                                   Hooks                                    */
/* ========================================================================== */

const PRODUCTS_STALE_TIME = 10 * 60 * 1000;

export function useCrfProductsQuery(enabled = true) {
	return useQuery({
		queryKey: crfKeys.products(),
		queryFn: crfApi.getProducts,
		enabled,
		staleTime: PRODUCTS_STALE_TIME,
	});
}

export function useCreateCrfMutation() {
	return useMutation({
		mutationFn: (payload: CrfPayload) => crfApi.create(payload),
	});
}

export function useUpdateCrfMutation() {
	return useMutation({
		mutationFn: ({ crfId, payload }: { crfId: string; payload: CrfPayload }) =>
			crfApi.update(crfId, payload),
	});
}
