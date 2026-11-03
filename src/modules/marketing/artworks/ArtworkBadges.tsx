// artworks/ArtworkBadges.tsx
// The two pills used by the listing, the detail header and the CRF panel:
//   ArtworkStatusBadge  how far along the links are
//   ArtworkDaysBadge    how soon the event is ("In 3 days", "Today", ...)

import { Badge } from "../../../components/common/Badge";
import {
	ARTWORK_STATUS_LABEL,
	ARTWORK_STATUS_TONE,
	type ArtworkTone,
} from "./artworks.constants";
import { describeDays } from "./artworks.format";
import type { ArtworkEventState, ArtworkRequestStatus } from "./artworks.types";

export function ArtworkStatusBadge({
	status,
}: {
	status: ArtworkRequestStatus;
}) {
	return (
		<Badge
			variant={ARTWORK_STATUS_TONE[status]}
			text={ARTWORK_STATUS_LABEL[status]}
		/>
	);
}

/** Marks an artwork the requester described themselves (custom size + brief). */
export function ArtworkCustomBadge() {
	return <Badge variant="info" text="Custom" />;
}

/** Pure, so the detail page can reuse the same wording in its banner. */
export function getEventTiming(
	eventState: ArtworkEventState,
	daysUntil: number | null,
): { text: string; tone: ArtworkTone } {
	switch (eventState) {
		case "UPCOMING": {
			const days = daysUntil ?? 0;
			const text = `Event ${describeDays(days)}`;
			if (days <= 1) return { text, tone: "danger" };
			if (days <= 3) return { text, tone: "warning" };
			if (days <= 7) return { text, tone: "info" };
			return { text, tone: "neutral" };
		}
		case "TODAY":
			return { text: "Event today", tone: "danger" };
		case "ONGOING":
			return { text: "Event ongoing", tone: "warning" };
		case "PASSED":
			return { text: "Event date passed", tone: "danger" };
		case "CANCELLED":
			return { text: "Event cancelled", tone: "neutral" };
		default:
			return { text: "Event closed", tone: "neutral" };
	}
}

export function ArtworkDaysBadge({
	eventState,
	daysUntil,
}: {
	eventState: ArtworkEventState;
	daysUntil: number | null;
}) {
	const { text, tone } = getEventTiming(eventState, daysUntil);
	return <Badge variant={tone} text={text} />;
}
