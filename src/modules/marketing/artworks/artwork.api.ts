// artwork.api.ts
// STUB — the CRF-scoped artwork queue (ArtworkQueuePage.tsx /
// ArtworkRequestsPanel.tsx) has no backend behind it: there is no
// GET /crf/:crfId/artworks route, and no remind / request-edit / submit-link
// routes scoped by a bare crfId. The real, live artwork system is
// request/EPC-scoped instead (see artworks.api.ts + artworks.types.ts) and
// uses a different shape — keyed by the artwork request's own id plus
// itemId, not by crfId — so it can't be wired in here directly without a
// rework of these two pages.
//
// This file exists only to satisfy the imports in ArtworkQueuePage.tsx and
// ArtworkRequestsPanel.tsx so the app builds while that decision is pending.
// Every hook below is inert: the query always resolves to an empty/zeroed
// result, and every mutation rejects with a clear message instead of
// silently pretending to succeed. Replace this file with a real
// implementation (or repoint the two pages at artworks.api.ts) once the
// future of this screen is decided.

import { useMutation, useQuery } from "@tanstack/react-query";

import type { ArtworkListResponse, ArtworkQueueGroup } from "./artwork.types";

const NOT_WIRED = "Artwork queue is not connected to a backend yet.";

const EMPTY_LIST: ArtworkListResponse = {
  items: [],
  summary: { total: 0, withLink: 0, pending: 0 },
  permissions: {
    canAddRequests: false,
    canRequestEdit: false,
    canSubmitLink: false,
    maxEditRounds: 0,
  },
};

export function useArtworkQueueQuery() {
  return useQuery({
    queryKey: ["artwork-queue-stub"],
    queryFn: async (): Promise<ArtworkQueueGroup[]> => [],
  });
}

export function useArtworksQuery(crfId: string) {
  return useQuery({
    queryKey: ["artwork-queue-stub", crfId],
    queryFn: async (): Promise<ArtworkListResponse> => EMPTY_LIST,
  });
}

export function useSubmitLink(_crfId: string) {
  return useMutation({
    mutationFn: async (_input: { artworkId: string; url: string }) => {
      throw new Error(NOT_WIRED);
    },
  });
}

export function useRequestEdit(_crfId: string) {
  return useMutation({
    mutationFn: async (_input: { artworkId: string; note: string }) => {
      throw new Error(NOT_WIRED);
    },
  });
}

export function useRemind(_crfId: string) {
  return useMutation({
    mutationFn: async (_artworkId: string) => {
      throw new Error(NOT_WIRED);
    },
  });
}
