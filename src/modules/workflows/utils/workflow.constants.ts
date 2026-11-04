import { ClipboardCheck, ClipboardList } from "lucide-react";
import type { AppSummary } from "../../../context/Auth/AuthContext";
import type { BudgetCategory, WorkflowSelectOption } from "../types/types";

// App name used to gate the budget-category field on the workflow form.
// Compared against `basics.appDesc`.
export const MARKETING_ACTIVITY_PLANNER_APP_NAME = "Marketing Activity Planner";

// Personal ("user") workflow templates are only available for this app.
// Matching is done on a normalised key OR name (see isVendorOnboardingApp), so
// "Vendor Onboarding", "vendor-onboarding" and "VENDOR_ONBOARDING" all match.
export const VENDOR_ONBOARDING_APP_NAME = "Vendor Onboarding";

const normaliseAppIdentifier = (value?: string | null): string =>
  (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const VENDOR_ONBOARDING_IDENTIFIER = normaliseAppIdentifier(
  VENDOR_ONBOARDING_APP_NAME,
);

export const isVendorOnboardingApp = (
  app?: { appKey?: string | null; appName?: string | null } | null,
): boolean =>
  Boolean(app) &&
  (normaliseAppIdentifier(app?.appKey) === VENDOR_ONBOARDING_IDENTIFIER ||
    normaliseAppIdentifier(app?.appName) === VENDOR_ONBOARDING_IDENTIFIER);

// Copy for the "template type" radio on the create form. `value` is what is
// sent to the API as `scope` (APP = admin/shared template, USER = personal).
export const workflowScopeCopy = {
  groupLabel: "Template type",
  shared: {
    value: "APP",
    label: "Shared template",
    hint: "An admin can assign this template to users of this app.",
  },
  personal: {
    value: "USER",
    label: "Personal template",
    hint: "Only you can use this template. Personal templates are available for Vendor Onboarding.",
  },
} as const;

export const api_routes = {
  // other routes...
  create_workflow_api_route: "/work-flow",
  get_all_workflow_api_route: "/work-flow",
  create_assign_users_workflow_template: "work-flow/assign-profile",
};

// The session already folds app-admin rights and module grants into one list
// (administeredApps + permissions, deduplicated), so there is no scope to
// re-derive here. Permission rows are module-only now; admin rights are not
// a permission row.
export const formatApps = (
  accessibleApps: AppSummary[],
): WorkflowSelectOption[] =>
  accessibleApps.map((app) => ({ value: app.appId, label: app.appName }));

// Kept in lockstep with the backend's `budgetMap` (utils/contants.ts) — a
// template's `metaData_1` is one of these `value`s, and evaluateBudget()
// looks it up in that same map server-side. If the two ever diverge, a
// template saved against a stale category here would silently never match
// any EPC's Tata Hitachi share (budgetMap[staleValue] is undefined).
//
// Updated for the Schedule of Authority bands (previously 20k/3L/6L/10L).
export const budgetCategories: BudgetCategory[] = [
  {
    value: "below_20k",
    label: "Below ₹20K",
    min: 0,
    max: 20000,
  },
  {
    value: "20k_1l",
    label: "₹20K – ₹1L",
    min: 20000,
    max: 100000,
  },
  {
    value: "1l_6l",
    label: "₹1L – ₹6L",
    min: 100000,
    max: 600000,
  },
  {
    value: "6l_10l",
    label: "₹6L – ₹10L",
    min: 600000,
    max: 1000000,
  },
  {
    value: "above_10l",
    label: "Above ₹10L",
    min: 1000000,
    max: null,
  },
];

export const workflowListFilterOptions = [
  {
    value: "ALL",
    label: "All workflows",
    shortLabel: "All",
    tooltipLabel: "View all workflows",
    Icon: ClipboardCheck,
  },
  {
    value: "ASSIGNED_TO_ME",
    label: "Assigned to me",
    shortLabel: "Assigned",
    tooltipLabel: "View all workflows assigned to me",
    Icon: ClipboardList,
  },
  {
    value: "CREATED_BY_ME",
    label: "Created by me",
    shortLabel: "Created",
    tooltipLabel: "View all workflows created by me",
    Icon: ClipboardCheck,
  },
] as const;
