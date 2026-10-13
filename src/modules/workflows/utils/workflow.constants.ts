import { ClipboardCheck, ClipboardList } from "lucide-react";
import type { AppSummary } from "../../../context/Auth/AuthContext";
import type { BudgetCategory, WorkflowSelectOption } from "../types/types";

// App name used to gate the budget-category field on the workflow form.
// Compared against `basics.appDesc`.
export const MARKETING_ACTIVITY_PLANNER_APP_NAME = "Marketing Activity Planner";

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

export const budgetCategories: BudgetCategory[] = [
  {
    value: "below_20k",
    label: "Below ₹20K",
    min: 0,
    max: 20000,
  },
  {
    value: "20k_3l",
    label: "₹20K – ₹3L",
    min: 20000,
    max: 300000,
  },
  {
    value: "3l_6l",
    label: "₹3L – ₹6L",
    min: 300000,
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
