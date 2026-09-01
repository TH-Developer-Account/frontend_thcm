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

export type WorkflowOwnerType = "ADMIN" | "USER";

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

  /**
   * APP is available only when the caller can administer the selected app.
   * USER creates a personal workflow owned by the current user.
   */
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

  /**
   * APP creates an admin/application template.
   * USER creates a personal template.
   */
  scope?: "APP" | "USER";

  /**
   * True creates a reusable template.
   * False creates an ad-hoc, one-time workflow.
   */
  isReusable?: boolean;

  /**
   * @deprecated The backend does not persist this field.
   * Use scope instead.
   */
  workflowType?: WorkflowType;
};

export type WorkflowApp = {
  id: string;
  key: string;
  name: string;
};

/* -------------------------------------------------------------------------- */
/* Raw workflow-listing API types                                              */
/* -------------------------------------------------------------------------- */

export type WorkflowListPersonApi = {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

export type WorkflowListApproverApi = {
  id: string;
  stageId: string;
  userId: string;
  isExternalApprover: boolean;
  user: WorkflowUser;
};

export type WorkflowListStageApi = {
  id: string;
  name: string;
  templateId: string;
  stageOrder: number;
  strategy: ApprovalRule;

  /**
   * The listing endpoint returns null for strategies that do not require
   * an explicit minimum.
   */
  minApprovals: number | null;

  approvers: WorkflowListApproverApi[];
};

export type WorkflowTemplateUserApi = {
  id: string;
  templateId: string;
  userId: string;
  created_at: ApiDateString;
  user: WorkflowUser;
};

/**
 * Exact workflow shape returned by GET /work-flow.
 *
 * This type intentionally keeps the backend's snake-case property names.
 * The API layer converts it into WorkflowTemplate.
 */
export type WorkflowTemplateApi = {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  isActive: boolean;
  appId: string;

  metaData_1: string;
  metaData_2: string;
  metaData_3: string;

  created_by_id: string;
  updated_by_id: string;
  created_at: ApiDateString;
  updated_at: ApiDateString;

  stages: WorkflowListStageApi[];
  app: WorkflowApp;

  created_by: WorkflowListPersonApi;
  updated_by: WorkflowListPersonApi;

  /**
   * Notice the capital F: this matches the current backend response.
   */
  workFlowUsers: WorkflowTemplateUserApi[];

  /**
   * These are optional until the backend returns them from GET /work-flow.
   */
  ownerType?: WorkflowOwnerType;
  isReusable?: boolean;

  /**
   * @deprecated Use ownerType.
   */
  workflowType?: WorkflowType | string;
};

/* -------------------------------------------------------------------------- */
/* Normalized frontend workflow types                                          */
/* -------------------------------------------------------------------------- */

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

  /**
   * ADMIN is an app-level template that can be assigned to other users.
   * USER is a personal template owned by its creator.
   *
   * Optional until the listing endpoint returns this field.
   */
  ownerType?: WorkflowOwnerType;

  /**
   * Optional until the listing endpoint returns this field.
   */
  isReusable?: boolean;

  /**
   * @deprecated Use ownerType.
   */
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
  ownerType?: WorkflowOwnerType;

  /**
   * @deprecated Use ownerType.
   */
  created_by_id?: string;
  updated_by_id?: string;
  appId?: string;
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

export type WorkflowModuleListParams = {
  appId: string;
  appKey: string;
  moduleKey: string;
  scope: "MODULE" | "USER" | "ALL";
};
/* -------------------------------------------------------------------------- */
/* Workflow listing                                                            */
/* -------------------------------------------------------------------------- */

export type WorkflowScope = "CREATED_BY_ME" | "ASSIGNED_TO_ME" | "ALL";

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

export type WorkflowListMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Raw response returned by GET /work-flow.
 */
export type WorkflowListApiResponse = {
  data: WorkflowTemplateApi[];
  meta: WorkflowListMeta;
};

/**
 * Normalized response returned by workflowApi.list().
 */
export type WorkflowListResponse = {
  data: WorkflowTemplate[];
  meta: WorkflowListMeta;
};

/* -------------------------------------------------------------------------- */
/* Workflow builder                                                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Workflow attachment                                                         */
/* -------------------------------------------------------------------------- */

export type WorkflowAttachCriteria = {
  workflowId?: string;
  stages?: WorkflowBuilderPayload["stages"];
  flowType?: WorkflowExecutionMode;
  saveAsTemplate?: boolean;
  templateName?: string;
};

export type AttachWorkflowInput = WorkflowAttachCriteria & {
  recordRef: string;
  recordType: string;
  workspaceId: string;
  appId: string;
};

export type PendingWorkflowSelection = {
  key: string;
  name: string;
  previewStages: WorkflowStage[];
  attachInput: WorkflowAttachCriteria;
  isEditedExistingWorkflow: boolean;
  saveAsTemplate?: boolean;
  templateName?: string;
  mode?: string;
};

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export type WorkflowGenErrors = Partial<Record<keyof WorkflowBasics, string>>;

export type WorkflowStageErrors = Partial<Record<keyof WorkflowStage, string>>;

export type WorkflowFilter = "created" | "assigned";
export type SaveMode = "template" | "once";
export type EntryMode = "idle" | "fetch" | "create";

/* -------------------------------------------------------------------------- */
/* Approval workflow                                                           */
/* -------------------------------------------------------------------------- */

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
