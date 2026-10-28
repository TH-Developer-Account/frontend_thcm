// handouts/handouts.types.ts
// Contract for the Handouts API (POST/GET /handouts ...). The backend does not
// exist yet; these shapes are the proposal the frontend is built against, so a
// contract change only touches this file + handouts.api.ts.
//
// Souvenir lines come from the CRF shop (identified by `sku`), exactly like a
// CRF souvenir line: title / variantTitle / imageUrl / rate are a display
// snapshot taken at request time, never used for stock decisions.

export type HandoutStatus =
	| "PENDING_APPROVAL"
	| "APPROVED"
	| "REJECTED"
	| "CANCELLED"
	| "CLOSED";

/** Which queue the list shows. The backend filters by the caller's role. */
export type HandoutView = "mine" | "approve" | "deliver";

/* ========================================================================== */
/*                                 Read model                                 */
/* ========================================================================== */

export type HandoutItem = {
	id: string;
	sku: string;
	title: string;
	variantTitle: string | null;
	imageUrl: string | null;
	quantity: number;
	/** Unit price snapshot (GST inclusive, like the rest of the CRF shop). */
	rate: number;
	amount: number;
};

export type HandoutSummary = {
	id: string;
	requestNumber: string;
	purpose: string;
	status: HandoutStatus;
	requiredBy: string; // ISO date
	createdAt: string; // ISO datetime
	requestedByName: string;
	itemCount: number;
	totalQuantity: number;
};

export type HandoutTimelineEntry = {
	id: string;
	action:
		| "SUBMITTED"
		| "APPROVED"
		| "REJECTED"
		| "CANCELLED"
		| "DELIVERED";
	byName: string;
	at: string; // ISO datetime
	comment: string | null;
};

/** Server-computed flags — the single source of truth for what the UI shows. */
export type HandoutPermissions = {
	canView: boolean;
	canCancel: boolean; // requester, PENDING_APPROVAL
	canApprove: boolean; // approver, PENDING_APPROVAL
	canReject: boolean; // approver, PENDING_APPROVAL
	canDeliver: boolean; // delivery team, APPROVED
};

export type HandoutDetail = HandoutSummary & {
	requestedByDesignation: string | null;
	requestedByDepartment: string | null;
	deliverTo: string;
	contactPhone: string;
	remarks: string | null;
	items: HandoutItem[];
	totalAmount: number;
	timeline: HandoutTimelineEntry[];
	/** Set once the request is CLOSED. */
	delivery: {
		handedToName: string;
		deliveredOn: string; // ISO datetime
		note: string | null;
		deliveredByName: string;
	} | null;
	rejectionReason: string | null;
	permissions: HandoutPermissions;
};

/* ========================================================================== */
/*                                 Write model                                */
/* ========================================================================== */

export type HandoutItemInput = {
	sku: string;
	quantity: number;
	title?: string;
	variantTitle?: string;
	imageUrl?: string;
	rate: number;
};

/** POST /handouts */
export type CreateHandoutPayload = {
	purpose: string;
	requiredBy: string; // yyyy-mm-dd
	deliverTo: string;
	contactPhone: string;
	remarks?: string;
	items: HandoutItemInput[];
};

/** POST /handouts/:id/deliver — only sent after every item is ticked. */
export type DeliverHandoutPayload = {
	handedToName: string;
	deliveredOn: string; // ISO datetime
	note?: string;
	/** SKUs the delivery team verified (all of the request's SKUs). */
	checkedSkus: string[];
};

/* ========================================================================== */
/*                                 List query                                 */
/* ========================================================================== */

export type HandoutListParams = {
	view: HandoutView;
	status?: HandoutStatus;
	search?: string;
	page: number; // 1-based on the wire
	pageSize: number;
};

export type HandoutListResponse = {
	items: HandoutSummary[];
	total: number;
};
