// artworks/artworks.constants.ts
// Labels, tones and permission module keys for Artworks.

import type { ArtworkRequestStatus, ArtworkView } from "./artworks.types";

export type ArtworkTone = "success" | "neutral" | "warning" | "danger" | "info";

export const ARTWORK_STATUS_LABEL: Record<ArtworkRequestStatus, string> = {
	PENDING: "Links pending",
	IN_PROGRESS: "Partly shared",
	COMPLETED: "All links shared",
};

export const ARTWORK_STATUS_TONE: Record<ArtworkRequestStatus, ArtworkTone> = {
	PENDING: "warning",
	IN_PROGRESS: "info",
	COMPLETED: "success",
};

export const ARTWORK_VIEW_LABEL: Record<ArtworkView, string> = {
	pending: "To do",
	shared: "Links shared",
	all: "All",
};

/**
 * RBAC (app "MAP"). ASSUMPTION — create one module in the profile editor and
 * grant it to the marketing team's profile:
 *
 *   ARTWORK  read  = open the Artworks listing and detail pages
 *            write = share / change / clear artwork links
 *
 * The proposer needs no ARTWORK permission to see the links on their own CRF.
 * Row-level actions still come from the server's `permissions` flags.
 */
export const ARTWORK_APP = "MAP";
export const ARTWORK_MODULE = "ARTWORK";

export const ARTWORK_LIMITS = {
	LINK: 2048,
} as const;

export const ARTWORKS_BASE_PATH = "/marketing/activity-planner/artworks";
