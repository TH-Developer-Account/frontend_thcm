// artworks/artworks.api.ts
// Artworks API + query keys + hooks. Same layering as handouts.api.ts:
// ServerAxios, an `artworkKeys` factory, thin useQuery / useMutation hooks.
// Mutations do NOT refresh anything — the calling page invalidates
// `artworkKeys.all`.
//
//   GET /artworks?view=pending|shared|all&search&page&pageSize   (marketing)
//   GET /artworks/:id                                            (marketing / proposer)
//   GET /artworks/by-epc/:epcId        data: null when the EPC has none
//   PUT /artworks/:id/links  { links: [{ itemId, link, note? }] } (marketing)
//
// MOCK-LAYER: the "Use mock data" checkbox (ArtworkMockToggle) switches this
// whole file between the real API and the in-memory adapter at runtime. Lines
// tagged MOCK-LAYER are the only mock-related changes; delete them (and
// artworks.mock.tsx) when the backend is live.

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";

import type { AuditApiAdapter } from "../../../components/ui/audit/audit.types";
import { ServerAxios } from "../../../services/ServerAxios";
import {
	artworkMockApi, // MOCK-LAYER
	isArtworkMockEnabled, // MOCK-LAYER
	useArtworkMockMode, // MOCK-LAYER
} from "./artworks.mock";
import type {
	ArtworkDetail,
	ArtworkListParams,
	ArtworkListResponse,
	ShareLinkInput,
} from "./artworks.types";

/* ========================================================================== */
/*                                    API                                     */
/* ========================================================================== */

const realApi = {
	list: async (params: ArtworkListParams): Promise<ArtworkListResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get("/artworks", { params });
		return data;
	},

	get: async (id: string): Promise<ArtworkDetail> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/artworks/${id}`);
		return data;
	},

	/** Null when the EPC has no artwork request (nothing was asked for). */
	getByEpc: async (epcId: string): Promise<ArtworkDetail | null> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/artworks/by-epc/${epcId}`);
		return data ?? null;
	},

	shareLinks: async (
		id: string,
		links: ShareLinkInput[],
	): Promise<{ id: string; status: string }> => {
		const {
			data: { data },
		} = await ServerAxios.put(`/artworks/${id}/links`, { links });
		return data;
	},
};

// MOCK-LAYER: picked per call so the checkbox takes effect immediately.
// When removing the mock layer, replace this block with:
//   export const artworkApi = realApi;
const activeApi = () => (isArtworkMockEnabled() ? artworkMockApi : realApi);

export const artworkApi: typeof realApi = {
	list: (params) => activeApi().list(params),
	get: (id) => activeApi().get(id),
	getByEpc: (epcId) => activeApi().getByEpc(epcId),
	shareLinks: (id, links) => activeApi().shareLinks(id, links),
};

/* ========================================================================== */
/*                                    Keys                                    */
/* ========================================================================== */

// MOCK-LAYER: mock and real data get separate cache entries so flipping the
// checkbox never shows one side's data under the other. `all` is unchanged, so
// `invalidateQueries({ queryKey: artworkKeys.all })` still refreshes both.
const modeTag = () => (isArtworkMockEnabled() ? "mock" : "live");

export const artworkKeys = {
	all: ["artworks"] as const,
	list: (params: ArtworkListParams) =>
		[...artworkKeys.all, modeTag(), "list", params] as const,
	detail: (id: string) =>
		[...artworkKeys.all, modeTag(), "detail", id] as const,
	byEpc: (epcId: string) =>
		[...artworkKeys.all, modeTag(), "by-epc", epcId] as const,
};

/* ========================================================================== */
/*                                   Hooks                                    */
/* ========================================================================== */

export function useArtworksQuery(params: ArtworkListParams, enabled = true) {
	useArtworkMockMode(); // MOCK-LAYER: re-render (and re-key) when the checkbox flips
	return useQuery({
		queryKey: artworkKeys.list(params),
		queryFn: () => artworkApi.list(params),
		enabled,
		// Keep the old page on screen while the next one loads (no table flash).
		placeholderData: keepPreviousData,
	});
}

export function useArtworkQuery(id: string | undefined) {
	useArtworkMockMode(); // MOCK-LAYER
	return useQuery({
		queryKey: artworkKeys.detail(id ?? ""),
		queryFn: () => artworkApi.get(id as string),
		enabled: Boolean(id),
	});
}

/**
 * For the CRF / EPC form view. A 403 (not the proposer / approver / team) or
 * any other failure simply yields no data — the panel renders nothing rather
 * than an error on someone else's EPC.
 */
export function useArtworkByEpcQuery(
	epcId: string | undefined,
	enabled = true,
) {
	useArtworkMockMode(); // MOCK-LAYER
	return useQuery({
		queryKey: artworkKeys.byEpc(epcId ?? ""),
		queryFn: () => artworkApi.getByEpc(epcId as string),
		enabled: enabled && Boolean(epcId),
		retry: false,
		staleTime: 30 * 1000,
	});
}

export function useShareArtworkLinksMutation() {
	return useMutation({
		mutationFn: ({ id, links }: { id: string; links: ShareLinkInput[] }) =>
			artworkApi.shareLinks(id, links),
	});
}

/* ========================================================================== */
/*                                 Audit trail                                */
/* ========================================================================== */

// Feeds the shared AuditLogSection from the request's own timeline, so the
// artwork page shows the same audit UI as the EPC and Handouts pages. When the
// backend adds /comment/ARTWORK_REQUEST/:id/activity-log, delete this and drop
// the `api` prop.
export const ARTWORK_AUDIT_SUBJECT = "ARTWORK_REQUEST";

export const artworkAuditApi: AuditApiAdapter = {
	getAuditLog: async ({ subjectId }) => {
		const request = await artworkApi.get(subjectId);

		return request.timeline.map((entry) => {
			const [first = "", ...rest] = entry.byName.trim().split(/\s+/);
			const items = entry.metadata?.items;
			return {
				id: entry.id,
				action: entry.action,
				// The artwork names show as the entry's detail line.
				metadata:
					Array.isArray(items) && items.length > 0
						? { reason: items.join(", ") }
						: null,
				actor: { id: entry.id, first_name: first, last_name: rest.join(" ") },
				createdAt: entry.at,
			};
		});
	},
};

/** Wording for the actions the shared audit messages don't know. */
export const ARTWORK_AUDIT_MESSAGES = {
	REQUEST_CREATED: "received the artwork request from the approved CRF",
	REQUEST_UPDATED:
		"updated the artwork list after the event was approved again",
	LINKS_SHARED: "shared artwork links",
	LINKS_CLEARED: "removed artwork links",
	COMPLETED: "shared every artwork link",
	REMINDER_SENT: "sent a reminder to the marketing team",
} as const;
