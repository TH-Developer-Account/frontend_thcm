// handouts/handouts.types.ts
// Contract for the Handouts API (POST/GET /handouts ...).
//
// Souvenir lines come from the CRF shop (identified by `sku`), exactly like a
// CRF souvenir line: title / variantTitle / imageUrl / rate are a display
// snapshot taken at request time, never used for stock decisions.

export type HandoutStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "CLOSED"
  | "CLARIFICATION_REQUESTED"
  | "CANNOT_FULFIL";

/** Which queue the list shows. The backend filters by the caller's role. */
export type HandoutView = "mine" | "approve" | "deliver";

/** How the souvenirs reach the requester. */
export type HandoutFulfillmentType = "HAND_DELIVERY" | "SHIPPED";

/** Same field set as the CRF shop's own shipping address. */
export type HandoutShippingAddress = {
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  country?: string;
  gstin?: string;
};

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
    | "DELIVERED"
    | "CLARIFICATION_REQUESTED"
    | "CANNOT_FULFIL"
    | "RESUBMITTED";
  byName: string;
  at: string; // ISO datetime
  comment: string | null;
};

/**
 * Server-computed flags — the single source of truth for what the UI shows.
 *
 * Fixed single-approver flow: the approver's three options (approve / reject
 * / send for clarification) are all available together at PENDING_APPROVAL.
 * The delivery team's two options (deliver / cannot fulfil) are both
 * available together at APPROVED. Resubmit is the requester's one option
 * once the approver has asked for clarification.
 */
export type HandoutPermissions = {
  canView: boolean;
  canCancel: boolean; // requester, PENDING_APPROVAL
  canApprove: boolean; // approver, PENDING_APPROVAL
  canReject: boolean; // approver, PENDING_APPROVAL
  canClarify: boolean; // approver, PENDING_APPROVAL — sends it back to the requester
  canResubmit: boolean; // requester, CLARIFICATION_REQUESTED — edits and resends
  canDeliver: boolean; // delivery team, APPROVED
  canCannotFulfil: boolean; // delivery team, APPROVED — manual "can't deliver" close
};

export type HandoutDetail = HandoutSummary & {
  requestedByDesignation: string | null;
  requestedByDepartment: string | null;
  deliverTo: string;
  contactPhone: string;
  remarks: string | null;
  fulfillmentType: HandoutFulfillmentType;
  /** Present only when fulfillmentType is "SHIPPED". */
  shippingAddress: HandoutShippingAddress | null;
  items: HandoutItem[];
  totalAmount: number;
  timeline: HandoutTimelineEntry[];
  /**
   * Set once THCM's Shopify tracking webhook has reported tracking info for
   * a SHIPPED handout. Always null for HAND_DELIVERY handouts (nothing to
   * track) and null for SHIPPED ones until the callback arrives. This is
   * purely informational — it has no bearing on `delivery` below, which is
   * only ever set by the delivery team's own manual "Request fulfilled"
   * action.
   */
  tracking: {
    trackingNumber: string;
    trackingUrl: string;
  } | null;
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
  fulfillmentType: HandoutFulfillmentType;
  /** Required when fulfillmentType is "SHIPPED". */
  shippingAddress?: HandoutShippingAddress;
  items: HandoutItemInput[];
};

/** POST /handouts/:id/resubmit — same shape, sent after a clarification request. */
export type ResubmitHandoutPayload = CreateHandoutPayload;

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
