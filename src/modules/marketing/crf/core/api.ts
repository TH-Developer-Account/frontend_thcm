// crf/core/api.ts
// CRF HTTP calls, query keys and TanStack Query hooks.
// Merged from: activity-planner/api/crf.api.ts + activity-planner/queries/crf.queries.ts
//
// The mutations do NOT refresh any parent (EPC, ePRF …). The caller does that in
// the `onSuccess` it passes to <CrfForm />, so this module never imports another
// module's query keys.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CrfDetail, CrfPayload } from "./types";
import { ServerAxios } from "../../../../services/ServerAxios";
import type { Product } from "../../shared/lineItem.types";

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
	/**
	 * GET /crf/:crfId — the one shape that actually carries `permissions`/
	 * `order`/`souvenirTotalAtApproval` (computed in crf.service.ts's
	 * getCrfDetail). GET /epc/:id's embedded `crf` field does NOT carry
	 * these — its Prisma select (epcFullInfoSelect, shared/utils/contants.ts)
	 * only pulls { id, epcId, status, items } — so anything that needs
	 * permissions/order (e.g. CrfOrderSection) must fetch this detail query
	 * itself rather than trusting the EPC payload's embedded summary.
	 */
	detail: (crfId: string) => [...crfKeys.all, "detail", crfId] as const,
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

/**
 * Full CRF detail (status + items + order + permissions), for consumers
 * that need the permission flags — currently just CrfOrderSection. Not
 * cached long: the order step is mutated frequently (dispatch details,
 * swap, place/retry/cancel, stock-check retry) and each mutation's
 * onSuccess refetches this directly rather than waiting out a staleTime.
 */
export function useCrfDetailQuery(crfId: string | null, enabled = true) {
	return useQuery({
		queryKey: crfKeys.detail(crfId ?? ""),
		queryFn: () => crfApi.getById(crfId as string),
		enabled: enabled && Boolean(crfId),
	});
}

export function useCreateCrfMutation() {
	return useMutation({
		mutationFn: (payload: CrfPayload) => crfApi.create(payload),
	});
}

export function useUpdateCrfMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ crfId, payload }: { crfId: string; payload: CrfPayload }) =>
			crfApi.update(crfId, payload),
		// The CRF Order tab reads GET /crf/:id (status, items, permissions). After
		// the lines are edited that cached copy is out of date, and the caller's
		// EPC refresh doesn't touch it. Marking it stale here is what makes the
		// tab show the new data without a page reload: a mounted Order tab
		// refetches once, an unmounted one refetches the next time it opens.
		// (create needs nothing: a brand-new CRF id has no cached detail.)
		onSuccess: (_saved, { crfId }) =>
			queryClient.invalidateQueries({ queryKey: crfKeys.detail(crfId) }),
	});
}
