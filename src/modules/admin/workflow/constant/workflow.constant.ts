import type { WorkspacePayload } from "../../user-profile/types/profile.types";
import type {
  Approver,
  CurrentAuthUser,
  WorkflowSettings,
  WorkflowStage,
} from "../types/workflow.types";

export const availableUsers: Approver[] = [
  {
    id: "user-uuid-2",
    name: "Sunita Rao",
    email: "sunita.rao@example.com",
    role: "Recommender",
    initials: "SR",
    avatarVariant: "teal",
  },
  {
    id: "user-uuid-3",
    name: "Kiran Patel",
    email: "kiran.patel@example.com",
    role: "Checker",
    initials: "KP",
    avatarVariant: "purple",
  },
  {
    id: "user-uuid-4",
    name: "Rohit Shah",
    email: "rohit.shah@example.com",
    role: "Approver",
    initials: "RS",
    avatarVariant: "orange",
  },
  {
    id: "user-uuid-5",
    name: "Amit Kumar",
    email: "amit.kumar@example.com",
    role: "Validator",
    initials: "AK",
    avatarVariant: "blue",
  },
  {
    id: "user-uuid-6",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    role: "Finance Controller",
    initials: "PN",
    avatarVariant: "teal",
  },
];

export const initialSettings: WorkflowSettings = {
  allowSubmitterEdit: false,
  emailNotifications: true,
  remindOnSlaBreach: true,
  requireCommentOnReject: false,
  autoApproveOnTimeout: false,
};

export const getCurrentUserApprover = (user: CurrentAuthUser): Approver => ({
  id: user.id,
  name: `${user.first_name} ${user.last_name}`,
  email: user.email,
  role: "Proposer",
  initials: `${user.first_name[0]}${user.last_name[0]}`,
  avatarVariant: "orange",
});

export const createInitialStages = (currentUser: Approver): WorkflowStage[] => [
  {
    id: "stage-1",
    stageOrder: 1,
    name: "Proposer",
    strategy: "SOME",
    slaDays: "1",
    rejectionAction: "RETURN",
    isExpanded: true,
    approvers: [currentUser],
  },
  {
    id: "stage-2",
    stageOrder: 2,
    name: "Recommender",
    strategy: "ANY",
    slaDays: "2",
    rejectionAction: "RETURN",
    isExpanded: false,
    approvers: [],
  },
  {
    id: "stage-3",
    stageOrder: 3,
    name: "Checker",
    strategy: "ANY",
    slaDays: "2",
    rejectionAction: "RETURN",
    isExpanded: false,
    approvers: [],
  },
  {
    id: "stage-4",
    stageOrder: 4,
    name: "Approver",
    strategy: "ALL",
    slaDays: "2",
    rejectionAction: "RETURN",
    isExpanded: false,
    approvers: [],
  },
  {
    id: "stage-5",
    stageOrder: 5,
    name: "Validator",
    strategy: "ANY",
    slaDays: "1",
    rejectionAction: "RETURN",
    isExpanded: false,
    approvers: [],
  },
];

export const api_routes = {
  // other routes...
  create_workflow_api_route: "/work-flow",
  get_all_workflow_api_route: "/work-flow",
  create_assign_users_workflow_template: "work-flow/assign-profile",
};

export const formatApps = (data: WorkspacePayload) => {
  const uniqueMap = new Map();

  data.forEach((item) => {
    if (item.action === "read") {
      if (!uniqueMap.has(item.appId)) {
        uniqueMap.set(item.appId, {
          value: item.appId,
          label: item.appName,
        });
      }
    }
  });

  return Array.from(uniqueMap.values());
};

export const mapBasics = (data: any) => ({
  id: data.id,
  name: data.name,
  description: data.description,
  workspaceId: data.workspaceId,
  app: data.appId,
  isActive: data.isActive,

  metaData_1: data.metaData_1,
  metaData_2: data.metaData_2,
  metaData_3: data.metaData_3,
});

export const mapStages = (stages: any[]) => {
  return [...stages]
    .sort((a, b) => a.stageOrder - b.stageOrder)
    .map((stage, index) => ({
      id: stage.id,
      name: stage.name,
      stageOrder: stage.stageOrder,
      strategy: stage.strategy,
      minApprovals: stage.minApprovals,

      isExpanded: index === 0, // expand first by default

      approvers: stage.approvers.map((a: any) => ({
        id: a.user.id, // IMPORTANT: use user.id (not approver id)
        name: `${a.user.first_name} ${a.user.last_name}`,
        email: a.user.email,
        firstName: a.user.first_name,
        lastName: a.user.last_name,
      })),
    }));
};
