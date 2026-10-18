// crf/core/LoadMoreBar.tsx
// Full-width "Load more" bar shown under a product grid.

import { ChevronDown } from "lucide-react";

/**
 * Product cards shown per category tab (Printed Materials, Souvenirs,
 * Artworks) before "Load more" — and how many more each click adds.
 * Deliberately NOT the store's fetch size (CATALOG_PAGE_SIZE): that is how
 * many rows are pulled per request, this is how many cards are put on screen.
 */
export const CRF_GRID_PAGE_SIZE = 5;

type LoadMoreBarProps = {
	/** Cards currently on screen. */
	shown: number;
	/** Total known cards (omit when the list is still being paged from the store). */
	total?: number;
	hasMore: boolean;
	loading?: boolean;
	onClick: () => void;
};

export default function LoadMoreBar({
	shown,
	total,
	hasMore,
	loading = false,
	onClick,
}: LoadMoreBarProps) {
	if (!hasMore) return null;

	return (
		<button
			type="button"
			className="crf-load-more"
			onClick={onClick}
			disabled={loading}
		>
			<ChevronDown aria-hidden="true" />
			<span>{loading ? "Loading…" : "Load more"}</span>
			<span className="crf-load-more-count">
				Showing {shown}
				{total !== undefined ? ` of ${total}` : ""}
			</span>
		</button>
	);
}
