export type WorkflowStage = {
  id: string;
  stageOrder: number;
  name: string;
  strategy: ApprovalRule;
  minApprovals?: number;
  slaDays: string;
  rejectionAction: RejectionAction;
  approvers: Approver[];
  isExpanded?: boolean;
};

export type WorkflowBasics = {
  name: string;
  regionId: string;
  minBudget: string;
  maxBudget: string;
  priority: string;
  isActive: boolean;
  description: string;
};

export type WorkflowStatus =
  | "Draft"
  | "Active"
  | "Paused"
  | "Archived"
  | "Pending Approval";

export type WorkflowOwnerType = "mine" | "team";

export type WorkflowItem = {
  id: string;
  name: string;
  module: string;
  owner: string;
  ownerType: WorkflowOwnerType;
  stages: number;
  lastUpdated: string;
  status: WorkflowStatus;
};

export type WorkflowFilterKey = "all" | "mine" | "draft" | "active" | "pending";

export type WorkFlowProps = {
  currentStep: number;
  goNext: () => void;
  goBack: () => void;
  basics: WorkflowBasics;
  stages: WorkflowStage[];
  availableUsers: Approver[];
  currentUserId: string;
  onBasicChange: <K extends keyof WorkflowBasics>(
    key: K,
    value: WorkflowBasics[K],
  ) => void;
  onStageChange: <K extends keyof WorkflowStage>(
    stageId: string,
    key: K,
    value: WorkflowStage[K],
  ) => void;
  onToggleStage: (stageId: string) => void;
  onRemoveApprover: (stageId: string, approverId: string) => void;
  onAddApprover: (stageId: string, approver: Approver) => void;
  onSubmit: () => void;
  loading?: boolean;
  onAddStage: () => void;
};

export type FormValues = {
  isActive: boolean;
  status: "active" | "inactive";
  zone: string;
  app: string;
};

export type ApprovalRule = "ANY" | "ALL" | "QUORUM";
export type RejectionAction = "RETURN" | "CANCEL" | "ESCALATE";

export type CreateWorkflowPayload = {
  name: string;
  workspaceId: string;
  regionId: string;
  minBudget: number;
  maxBudget: number;
  priority: number;
  isActive: boolean;
  stages: {
    stageOrder: number;
    strategy: ApprovalRule;
    approverIds: string[];
    minApprovals?: number;
  }[];
};

export type WorkflowSettings = {
  allowSubmitterEdit: boolean;
  emailNotifications: boolean;
  remindOnSlaBreach: boolean;
  requireCommentOnReject: boolean;
  autoApproveOnTimeout: boolean;
};

export type FlowType = "SEQUENTIAL" | "PARALLEL" | "CONDITIONAL";

export type CurrentAuthUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type WorkflowMainProps = {
  currentStep: number;
  goNext: () => void;
  goBack: () => void;
  basics: WorkflowBasics;
  stages: WorkflowStage[];
  availableUsers: Approver[];
  currentUserId: string;
  onBasicChange: <K extends keyof WorkflowBasics>(
    key: K,
    value: WorkflowBasics[K],
  ) => void;
  onStageChange: <K extends keyof WorkflowStage>(
    stageId: string,
    key: K,
    value: WorkflowStage[K],
  ) => void;
  onToggleStage: (stageId: string) => void;
  onRemoveApprover: (stageId: string, approverId: string) => void;
  onAddApprover: (stageId: string, approver: Approver) => void;
  onSubmit: () => void;
};

export interface WorkflowRow {
  id?: string;
  name: string;
  app_name: string;
  created_by: string;
  isActive: boolean;
  last_updated: string;
  updated_by: string;
  workflowUsers?: Record<string, string>[];
}

export type WorkflowCard = {
  id: string;
  name: string;
  app_name: string;
  created_by: string;
  isActive: boolean;
  last_updated: string;
  updated_by: string;
  workflowUsers: Record<string, string>[];
};

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type Approver = {
  id: string;
  stageId: string;
  userId: string;
  user: User;
};

type StageStrategy = "ANY" | "ALL" | "SOME";

type Stage = {
  id: string;
  name: string;
  templateId: string;
  stageOrder: number;
  strategy: StageStrategy;
  minApprovals: number | null;
  approvers: Approver[];
};

type App = {
  id: string;
  key: string;
  name: string;
};

type CreatedUpdatedBy = {
  first_name: string;
  last_name: string;
};

type workFlowUser = {
  created_at: string;
  id: string;
  templateId: string;
  user: User;
};

export type WorkFlowTemplate = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  appId: string;
  metaData_1: string;
  metaData_2: string;
  metaData_3: string;
  created_at: string; // ISO date
  updated_at: string; // ISO date
  stages: Stage[];
  app: App;
  created_by: CreatedUpdatedBy;
  updated_by: CreatedUpdatedBy;
  workFlowUsers: workFlowUser[];
};
