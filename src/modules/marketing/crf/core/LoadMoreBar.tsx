// crf/core/LoadMoreBar.tsx
// Full-width "Load more" bar shown under a product grid.

import { ChevronDown } from "lucide-react";

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
