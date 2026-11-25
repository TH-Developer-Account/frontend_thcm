// handouts/handouts.constants.ts
// Labels, tones and permission module keys for Handouts.

import type {
  HandoutFulfillmentType,
  HandoutStatus,
  HandoutView,
} from "./handouts.types";

export const HANDOUT_STATUS_LABEL: Record<HandoutStatus, string> = {
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved, awaiting delivery",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  CLOSED: "Closed, hand delivered",
  CLARIFICATION_REQUESTED: "Clarification requested",
  CANNOT_FULFIL: "Cannot be fulfilled",
};

export type HandoutTone = "success" | "neutral" | "warning" | "danger" | "info";

export const HANDOUT_STATUS_TONE: Record<HandoutStatus, HandoutTone> = {
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  CANCELLED: "neutral",
  CLOSED: "success",
  CLARIFICATION_REQUESTED: "warning",
  CANNOT_FULFIL: "danger",
};

export const HANDOUT_STATUS_OPTIONS = (
  Object.keys(HANDOUT_STATUS_LABEL) as HandoutStatus[]
).map((value) => ({ value, label: HANDOUT_STATUS_LABEL[value] }));

export const HANDOUT_VIEW_LABEL: Record<HandoutView, string> = {
  mine: "My Requests",
  approve: "Pending to Approve",
  deliver: "Pending to Deliver",
};

/** How the souvenirs reach the requester — shown as a two-option Radio. */
export const HANDOUT_FULFILLMENT_TYPE_LABEL: Record<
  HandoutFulfillmentType,
  string
> = {
  HAND_DELIVERY: "Hand delivery on premises",
  SHIPPED: "Ship to an address",
};

export const HANDOUT_FULFILLMENT_TYPE_OPTIONS = (
  Object.keys(HANDOUT_FULFILLMENT_TYPE_LABEL) as HandoutFulfillmentType[]
).map((value) => ({ value, label: HANDOUT_FULFILLMENT_TYPE_LABEL[value] }));

/**
 * RBAC (app "MAP"). ASSUMPTION — create this one module in the profile
 * editor and grant it per profile; no designation list or named
 * "Marketing Head" role is hard-coded on the frontend:
 *
 *   HANDOUT  read = open Handouts / see own
 *            write = raise a request, approve, AND deliver — one grant
 *            covers all three; requester/approver/delivery-team are not
 *            separately grantable modules.
 *
 * Row-level actions (can I approve/deliver *this* request right now) still
 * come from the server's per-request `permissions` flags, which narrow a
 * write grant further by the request's status.
 */
export const HANDOUT_APP = "MAP";
export const HANDOUT_MODULE = "HANDOUT";

export const HANDOUT_LIMITS = {
  PURPOSE: 200,
  DELIVER_TO: 200,
  REMARKS: 500,
  NOTE: 500,
  MAX_ITEMS: 50,
} as const;

export const HANDOUTS_BASE_PATH = "/marketing/activity-planner/handouts";
export const HANDOUTS_NEW_PATH = `${HANDOUTS_BASE_PATH}/new`;
