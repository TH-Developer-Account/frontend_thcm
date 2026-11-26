// artworks/useArtworkPermissions.ts
// Page-level gates. Row-level actions (can I share links on THIS request
// right now?) come from the `permissions` flags on GET /artworks/:id — the
// backend is the real gate, this only decides which pages/buttons exist.
//
//   ARTWORK read  → the Artworks listing and detail pages
//   ARTWORK write → the link inputs and the "Save links" button

import { usePermission } from "../../../hooks/usePermission";
import { ARTWORK_APP, ARTWORK_MODULE } from "./artworks.constants";
import { useArtworkMockMode } from "./artworks.mock"; // MOCK-LAYER

export function useArtworkPermissions() {
	const { canRead, canWrite } = usePermission(ARTWORK_APP, ARTWORK_MODULE);
	const [isMock] = useArtworkMockMode(); // MOCK-LAYER: demo data = see every screen

	return {
		/** Sees the Artworks pages at all. */
		canOpenArtworks: canRead || canWrite || isMock, // MOCK-LAYER: `|| isMock`
		/** Sees the link inputs (marketing team). */
		canShareLinks: canWrite || isMock, // MOCK-LAYER: `|| isMock`
	};
}
