import { ClipboardCheck, ClipboardList } from "lucide-react";
import type { Permission } from "../../../context/Auth/AuthContext";
import type {
  BudgetCategory,
  DynamicWorkflowTableItem,
} from "../types/workflow.types";

export const api_routes = {
  // other routes...
  create_workflow_api_route: "/work-flow",
  get_all_workflow_api_route: "/work-flow",
  create_assign_users_workflow_template: "work-flow/assign-profile",
};

// Includes an app if the caller has MODULE-scope read access to it, OR is
// that app's admin (APP-scope write). Without the second clause, an
// app-admin with no individual module grants would never see their own
// app here — app-scope rows are always action: "write" only, so a
// read-only filter silently excluded them.
export const formatApps = (data: Permission[]) => {
  const uniqueMap = new Map();

  data.forEach((item) => {
    const isModuleRead = item.scope === "MODULE" && item.action === "read";
    const isAppAdmin = item.scope === "APP" && item.action === "write";

    if ((isModuleRead || isAppAdmin) && !uniqueMap.has(item.appId)) {
      uniqueMap.set(item.appId, {
        value: item.appId,
        label: item.appName,
      });
    }
  });

  return Array.from(uniqueMap.values());
};

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

// workflow.constants.ts

export const DYNAMIC_WORKFLOW_TABLE_DATA: DynamicWorkflowTableItem[] = [
  {
    id: "workflow-001",
    name: "Vendor Standard Approval",
    description: "Standard workflow for vendor onboarding requests.",
    stageCount: 3,
    approverCount: 4,
    createdBy: {
      id: "user-001",
      name: "Monica",
      email: "monica@tat-hitachi.co.in",
    },
    relationship: "CREATED_BY_ME",
    status: "ACTIVE",
    updatedAt: "2026-07-25T10:30:00.000Z",
  },
  {
    id: "workflow-002",
    name: "Finance and Compliance Review",
    description: "Finance verification followed by compliance approval.",
    stageCount: 2,
    approverCount: 3,
    createdBy: {
      id: "user-002",
      name: "Rahul Sharma",
      email: "rahul@tat-hitachi.co.in",
    },
    relationship: "ASSIGNED_TO_ME",
    status: "ACTIVE",
    updatedAt: "2026-07-23T08:15:00.000Z",
  },
  {
    id: "workflow-003",
    name: "High-Value Vendor Approval",
    description: "Additional approval stages for high-value vendors.",
    stageCount: 4,
    approverCount: 5,
    createdBy: {
      id: "user-001",
      name: "Monica",
      email: "monica@tat-hitachi.co.in",
    },
    relationship: "CREATED_BY_ME",
    status: "DRAFT",
    updatedAt: "2026-07-20T14:45:00.000Z",
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
