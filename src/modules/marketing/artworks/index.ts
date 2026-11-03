// artworks/index.ts
// Public API of the Artworks module. Routes lazy-load the pages directly;
// everything else imports only from here. The one component other modules
// use is <ArtworkLinksPanel /> (the proposer's read-only view of the links).

export { default as ArtworksPage } from "./ArtworksPage";
export { default as ArtworkDetailPage } from "./ArtworkDetailPage";
export { default as ArtworkLinksPanel } from "./ArtworkLinksPanel";

export { useArtworkPermissions } from "./useArtworkPermissions";
export {
	ARTWORK_APP,
	ARTWORK_MODULE,
	ARTWORKS_BASE_PATH,
} from "./artworks.constants";
export type {
	ArtworkDetail,
	ArtworkSummary,
	ArtworkRequestStatus,
	ArtworkView,
} from "./artworks.types";
