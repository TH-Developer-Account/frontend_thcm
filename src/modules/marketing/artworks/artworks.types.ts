// artworks/artworks.types.ts
// Contract for the Artworks API (GET /artworks, GET /artworks/:id,
// GET /artworks/by-epc/:epcId, PUT /artworks/:id/links). Mirrors
// artworks.services.ts on the backend; a contract change only touches this
// file + artworks.api.ts.

/** How far along the links are. */
export type ArtworkRequestStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

/** What the event looks like right now — derived live from the EPC. */
export type ArtworkEventState =
	| "UPCOMING"
	| "TODAY"
	| "ONGOING"
	| "PASSED" // approved, date gone, not yet marked conducted
	| "CLOSED" // conducted / validated / closed ...
	| "CANCELLED";

/** Which queue the listing shows. */
export type ArtworkView = "pending" | "shared" | "all";

/* ========================================================================== */
/*                                 Read model                                 */
/* ========================================================================== */

export type ArtworkSummary = {
	id: string;
	epcId: string;
	epcNumber: string | null;
	eventName: string | null;
	eventFromDate: string | null; // ISO
	eventToDate: string | null; // ISO
	status: ArtworkRequestStatus;
	itemCount: number;
	sharedCount: number;
	requestedByName: string | null;
	createdAt: string; // ISO
	eventState: ArtworkEventState;
	/** Whole days to the event (IST). Null once the event is not APPROVED. */
	daysUntil: number | null;
	/** True while links may still be shared (EPC approved, not conducted). */
	canShare: boolean;
};

export type ArtworkItem = {
	id: string;
	title: string;
	/** For a custom artwork this is the requester's brief. */
	description: string | null;
	/** Custom size / brief rather than a standard catalog artwork. */
	isCustom?: boolean;
	quantity: number;
	width: string | null;
	height: string | null;
	unit: string | null;
	link: string | null;
	linkNote: string | null;
	sharedAt: string | null; // ISO
	sharedByName: string | null;
};

export type ArtworkTimelineAction =
	| "REQUEST_CREATED"
	| "REQUEST_UPDATED"
	| "LINKS_SHARED"
	| "LINKS_CLEARED"
	| "COMPLETED"
	| "REMINDER_SENT";

export type ArtworkTimelineEntry = {
	id: string;
	action: ArtworkTimelineAction;
	byName: string;
	at: string; // ISO
	metadata: { items?: string[]; [key: string]: unknown } | null;
};

/** Server-computed flags — the single source of truth for what the UI shows. */
export type ArtworkPermissions = {
	canView: boolean;
	/** Marketing team, and the event is still approved-not-conducted. */
	canShareLinks: boolean;
};

export type ArtworkDetail = ArtworkSummary & {
	proposer: {
		name: string;
		email: string | null;
		phone: string | null;
	} | null;
	items: ArtworkItem[];
	timeline: ArtworkTimelineEntry[];
	permissions: ArtworkPermissions;
};

/* ========================================================================== */
/*                                 Write model                                */
/* ========================================================================== */

/** One row of PUT /artworks/:id/links. Empty / null `link` clears it. */
export type ShareLinkInput = {
	itemId: string;
	link: string | null;
	note?: string | null;
};

/* ========================================================================== */
/*                                 List query                                 */
/* ========================================================================== */

export type ArtworkListParams = {
	view: ArtworkView;
	search?: string;
	page: number; // 1-based on the wire
	pageSize: number;
};

export type ArtworkListResponse = {
	items: ArtworkSummary[];
	total: number;
};
