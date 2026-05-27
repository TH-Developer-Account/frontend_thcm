import type { ApprovalApiStatus } from "../../types";

export type ApiDateString = string;

export type EpcListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  zone?: string[];
  eventType?: string[];
  eventDateFrom?: string;
  eventDateTo?: string;
  createdDate?: string;
  createdByMe?: boolean;
  pendingOnMe?: boolean;
  approvedByMe?: boolean;
};

export type EpcFilters = {
  status: string[];
  zone: string[];
  eventType: string[];
  eventDateFrom: string;
  eventDateTo: string;
  createdDate: string;
};

export type EpcListItem = {
  id: string;
  proposal_number: string;
  event_name?: string;
  event_title?: string;
  status: ApprovalApiStatus;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  location?: string;
  event_from_date?: string;
};

export type EpcListResponse = {
  data: EpcListItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type EpcDetailResponse = {
  id: string;
  proposal_number: string;
  event_from_date: ApiDateString;
  event_to_date: ApiDateString;
  event_description: string;
  location: string;
  locationMeta: {
    pincode: string;
    officeName: string;
    district: string;
    stateName: string;
    latitude: number | null;
    longitude: number | null;
  };
  event_objective: string;
  status: ApprovalApiStatus;

  created_by_id: string;
  updated_by_id: string;

  created_by?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;

  department_id: string;
  region_id: string;
  branch_id: string;
  event_scale: number;
  budget_master_id: string;
  event_name_id: string;
  vertical_id: string;

  created_at: ApiDateString;
  updated_at: ApiDateString;

  department: EpcDepartment;
  vertical: EpcVertical;
  region: EpcRegion;
  branch: EpcBranch;
  event_name: EpcEventName;
  budget_master: EpcBudgetMaster;

  epf?: EpcDetailEpf | null;
  crf?: EpcDetailCrf | null;
  activeWorkflow?: EpcActiveWorkflow | null;
};

export type EpcDepartment = {
  id: string;
  department_name?: string;
  title?: string;
};

export type EpcVertical = {
  id: string;
  name?: string;
  code?: string;
  title?: string;
};

export type EpcRegion = {
  id: string;
  region_name?: string;
  title?: string;
};

export type EpcBranch = {
  id: string;
  branch_name?: string;
  description?: string;
  title?: string;
};

export type EpcEventName = {
  id: string;
  title: string;
};

export type EpcBudgetMaster = {
  id: string;
  value?: string;
  description?: string;
  code?: string;
};

export type EpcDetailEpf = {
  id: string;

  externalParticipants: number;
  internalParticipants: number;
  totalParticipants?: number;

  crfTotal?: string | number;
  eventBudget: string | number;
  annualBudget: string | number;
  availableBudget: string | number;
  allotedBudget?: string | number;

  dealerName: string;
  dealerPercent: number;
  dealerShare: number;

  tataHitachiPercent?: number;
  tataHitachiShare?: number;
  tataHitachiPoAmount: number;

  status: ApprovalApiStatus;
  lineItems: EpcLineItem[];
};

export type EpcDetailCrf = {
  id: string;
  lineItems: EpcLineItem[];
};

export type EpcLineItem = {
  id?: string;
  productId?: string;
  quantity?: string | number;
  qty?: string | number;
  amount?: string | number;
  rate?: string | number;
  total?: string | number;
  category?: string;
  description?: string;
  particulars?: string;
  particular?: string;
  item_name?: string;
  name?: string;
  product?: {
    id: string;
    partNumber?: string;
    name?: string;
    description?: string;
    category?: string;
  };
};

export type EpcActiveWorkflow = {
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
  template: EpcWorkflowTemplate;
  stages: EpcWorkflowStage[];
};

export type EpcWorkflowTemplate = {
  id: string;
  name: string;
  description: string;
};

export type EpcWorkflowStage = {
  id: string;
  workflowId: string;
  stageOrder: number;
  iteration: number;
  isCurrentIteration: boolean;
  strategy: "ALL" | "ANY" | "SOME" | "QUORUM";
  minApprovals: number | null;
  startedAt: ApiDateString | null;
  dueAt: ApiDateString | null;
  escalatedTo: string | null;
  status: "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
  approvals: EpcWorkflowApproval[];
  stageName?: string;
  name?: string;
};

export type EpcWorkflowApproval = {
  id: string;
  stageId: string;
  approverId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  actedAt: ApiDateString | null;
  reason: string | null;
  approver: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  comments: unknown[];
};

export type EpcFormValues = {
  epfNo?: string;
  poDocumentRefNo?: string;
  department: string;
  region: string;
  branch: string;
  budget_master_id: string;
  budgetDescription?: string;
  vertical: string;
  event_scale: string | number;
  event_name: string;
  event_description: string;
  event_from_date: string;
  event_to_date: string;
  location: string;
  event_objective: string;
  status?: ApprovalApiStatus | "DRAFT" | "SUBMITTED";
  proposal_number?: string;
  created_by_id?: string;
  locationMeta?: {
    pincode: string;
    officeName: string;
    district: string;
    stateName: string;
    latitude: number | null;
    longitude: number | null;
  };
};

export type EpcCreatePayload = Record<string, unknown>;
export type EpcUpdatePayload = Record<string, unknown>;
