import type {
  ApiDateString,
  ApprovalRule,
  WorkflowExecutionMode,
  WorkflowUser,
} from "./shared.types";

export type {
  ApiDateString,
  ApprovalRule,
  WorkflowExecutionMode,
  WorkflowUser,
  WorkflowApprovalLike,
  ApprovalStageLike,
} from "./shared.types";

export type WorkflowApprover = {
  id: string;
  stageId: string;
  user: WorkflowUser;
  isExternalApprover: boolean;
};

export type WorkflowStage = {
  id: string;
  stageOrder: number;
  name: string;
  strategy: ApprovalRule;
  minApprovals: number;
  approvers: WorkflowApprover[];
  isExpanded?: boolean;
};

export type WorkflowSelectOption = {
  value: string;
  label: string;
};

export type WorkflowBasics = {
  name: string;
  app: string;
  appDesc?: string;
  category?: string;
  isActive: boolean;
  description: string;
  // "APP" only offered/honored when the caller administers the selected
  // app (canManageApp) — defaults to "USER" for everyone else.
  scope?: "APP" | "USER";
};

export type WorkflowApproverPayload = {
  userId: string;
  name: string;
  email: string;
  isExternalApprover: boolean;
};

export type WorkflowType = "USERCREATED";

export type CreateWorkflowPayload = {
  name: string;
  workspaceId: string;
  isActive: boolean;
  appId: string;
  description: string;
  metaData_1: string;
  metaData_2: string;
  metaData_3: string;
  stages: Array<{
    name: string;
    stageOrder: number;
    strategy: ApprovalRule;
    approverIds: WorkflowApproverPayload[];
    minApprovals?: number;
  }>;
  // "APP" only takes effect if the caller actually administers this app
  // (canManageApp) — the backend independently re-verifies this, it's not
  // trusted from the payload. "USER" (or omitted) is always allowed.
  scope?: "APP" | "USER";
  // Maps to SaveMode: "template" → true, "once" → false. Defaults to
  // true (reusable) server-side if omitted.
  isReusable?: boolean;
  /** @deprecated Never read by the backend — WorkflowTemplate has no such
   * column. This was a no-op the whole time. Use `scope` instead. */
  workflowType?: WorkflowType;
};

export type WorkflowApp = {
  id: string;
  key: string;
  name: string;
};

export type WorkflowTemplateUser = {
  id: string;
  templateId: string;
  createdAt: ApiDateString;
  user: WorkflowUser;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  appId: string;
  workspaceId?: string;
  metaData_1: string;
  metaData_2: string;
  metaData_3: string;
  createdAt: ApiDateString;
  updatedAt: ApiDateString;
  stages: WorkflowStage[];
  app: WorkflowApp;
  createdBy: WorkflowUser;
  updatedBy: WorkflowUser;
  workflowUsers: WorkflowTemplateUser[];
  // "ADMIN" = created via scope: "APP" by an eligible app admin,
  // assignable to others via workflowUsers. "USER" = personal,
  // self-assigned only — this is the REAL signal for what
  // isUserCreatedWorkflow used to fake-detect via workflowType below.
  ownerType: "ADMIN" | "USER";
  // false = ad-hoc/one-off (SaveMode "once") — hidden from reusable
  // template listings, auto-deactivated once its single instance finishes.
  isReusable: boolean;
  /** @deprecated WorkflowTemplate never actually had this column on the
   * backend — reads always resolved to undefined. Use `ownerType` instead. */
  workflowType?: WorkflowType | string;
};

export type WorkflowRow = {
  id: string;
  name: string;
  appName: string;
  createdBy: string;
  isActive: boolean;
  lastUpdated: ApiDateString;
  updatedBy: string;
  workflowUsers: Array<Pick<WorkflowUser, "id">>;
  ownerType?: "ADMIN" | "USER";
  /** @deprecated Use `ownerType` instead — see WorkflowTemplate. */
  workflowType?: WorkflowType | string;
};

export type WorkflowSummary = {
  id: string;
  name: string;
  stageCount: number;
  flowType: WorkflowExecutionMode;
  description?: string;
  approverCount?: number;
  updatedAt?: ApiDateString;
};

export type WorkflowScope = "created" | "assigned";
export type WorkflowListScope = "ALL" | "ASSIGNED_TO_ME" | "CREATED_BY_ME";

export type WorkflowListParams = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
  scope?: WorkflowListScope;
};

export type WorkflowListResponse = {
  data: WorkflowTemplate[];
  meta: {
    totalPages: number;
  };
};

export type WorkflowBuilderPayload = {
  stages: Array<{
    name: string;
    stageOrder: number;
    strategy: ApprovalRule;
    minApprovals: number;
    approvers: WorkflowApprover[];
  }>;
  flowType: WorkflowExecutionMode;
  saveAsTemplate: boolean;
  templateName?: string;
  sourceRecordRef: string;
};

export type WorkflowBuilderState = {
  stages: WorkflowStage[];
  flowType: WorkflowExecutionMode;
  saveAsTemplate: boolean;
  templateName: string;
};

export type WorkflowBuilderOptions = {
  initialStages?: WorkflowStage[];
  initialFlowType?: WorkflowExecutionMode;
  initialSaveAsTemplate?: boolean;
  initialTemplateName?: string;
};

export type WorkFlowProps = {
  currentStep: number;
  goNext: () => void;
  goBack: () => void;
  basics: WorkflowBasics;
  stages: WorkflowStage[];
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
  onAddApprover: (stageId: string, approver: WorkflowApprover) => void;
  onSubmit: () => void;
  loading?: boolean;
  onAddStage: () => void;
  appOptions: WorkflowSelectOption[];
  categoryOptions?: WorkflowSelectOption[];
  showCategory?: boolean;
  showStatus?: boolean;
};

export type AttachWorkflowInput = {
  recordRef: string;
  recordType: string;
  workflowId?: string;
  stages?: WorkflowBuilderPayload["stages"];
  flowType?: WorkflowExecutionMode;
  saveAsTemplate?: boolean;
  templateName?: string;
};

export type WorkflowGenErrors = Partial<Record<keyof WorkflowBasics, string>>;
export type WorkflowStageErrors = Partial<Record<keyof WorkflowStage, string>>;

export type WorkflowFilter = "created" | "assigned";
export type SaveMode = "template" | "once";
export type EntryMode = "idle" | "fetch" | "create";

export type ApprovalTableApproverRow = {
  id: string;
  name: string;
  email: string;
  minApprovals?: string | number | null;
  status?: string | null;
};

export type ApprovalTableRow = {
  id: string;
  stageOrder: number;
  stageName: string;
  strategy: string;
  minApprovals?: string | number | null;
  totalApprovers?: string | number | null;
  status?: string | null;
  name?: string;
  email?: string;
  approvers?: ApprovalTableApproverRow[];
};

export type WorkflowApproval = {
  id: string;
  stageId: string;
  approverId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  actedAt: ApiDateString | null;
  reason: string | null;
  approver: WorkflowUser;
  comments: unknown[];
};

export type ApprovalWorkflowStage = {
  id: string;
  workflowId: string;
  stageOrder: number;
  iteration: number;
  isCurrentIteration: boolean;
  strategy: ApprovalRule | "QUORUM";
  minApprovals: number | null;
  startedAt: ApiDateString | null;
  dueAt: ApiDateString | null;
  escalatedTo: string | null;
  status: "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
  approvals: WorkflowApproval[];
  stageName?: string;
  name?: string;
};

export type MapWorkflowStagesOptions = {
  showOnlyCurrentStageStatus?: boolean;
};

export type WorkflowActivityEntry = {
  entryType?: string | null;
  action?: string | null;
  reason?: string | null;
  message?: string | null;
  isActiveWorkflow?: boolean | null;
  workflowId?: string | null;
  createdAt?: ApiDateString | null;
};

export type WorkflowTemplateReference = Pick<
  WorkflowTemplate,
  "id" | "name" | "description"
>;

export type ActiveWorkflow = {
  id: string;
  templateId: string;
  workspaceId: string;
  eventProposalId: string;
  iteration: number;
  isActive: boolean;
  workflowType: "STANDARD";
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  currentStage: number;
  created_at: ApiDateString;
  updated_at: ApiDateString;
  template: WorkflowTemplateReference;
  stages: ApprovalWorkflowStage[];
};
