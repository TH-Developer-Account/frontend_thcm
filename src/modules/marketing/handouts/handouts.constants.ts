// handouts/handouts.constants.ts
// Labels, tones and permission module keys for Handouts.

import type { HandoutStatus, HandoutView } from "./handouts.types";

export const HANDOUT_STATUS_LABEL: Record<HandoutStatus, string> = {
	PENDING_APPROVAL: "Pending approval",
	APPROVED: "Approved, awaiting delivery",
	REJECTED: "Rejected",
	CANCELLED: "Cancelled",
	CLOSED: "Closed, hand delivered",
};

export type HandoutTone = "success" | "neutral" | "warning" | "danger" | "info";

export const HANDOUT_STATUS_TONE: Record<HandoutStatus, HandoutTone> = {
	PENDING_APPROVAL: "warning",
	APPROVED: "info",
	REJECTED: "danger",
	CANCELLED: "neutral",
	CLOSED: "success",
};

export const HANDOUT_STATUS_OPTIONS = (
	Object.keys(HANDOUT_STATUS_LABEL) as HandoutStatus[]
).map((value) => ({ value, label: HANDOUT_STATUS_LABEL[value] }));

export const HANDOUT_VIEW_LABEL: Record<HandoutView, string> = {
	mine: "My requests",
	approve: "To approve",
	deliver: "To deliver",
};

/**
 * RBAC modules (app "MAP"). ASSUMPTION — create these three modules in the
 * profile editor and grant them per profile; no designation list or named
 * "Marketing Head" role is hard-coded on the frontend:
 *
 *   HANDOUT_REQUEST  read = open Handouts / see own    write = raise a request
 *   HANDOUT_APPROVE  write = the single approver (Marketing Head profile)
 *   HANDOUT_DELIVER  write = delivery team
 *
 * Row-level actions still come from the server's `permissions` flags.
 */
export const HANDOUT_APP = "MAP";
export const HANDOUT_MODULES = {
	request: "HANDOUT_REQUEST",
	approve: "HANDOUT_APPROVE",
	deliver: "HANDOUT_DELIVER",
} as const;

export const HANDOUT_LIMITS = {
	PURPOSE: 200,
	DELIVER_TO: 200,
	REMARKS: 500,
	NOTE: 500,
	MAX_ITEMS: 50,
} as const;

export const HANDOUTS_BASE_PATH = "/marketing/activity-planner/handouts";
