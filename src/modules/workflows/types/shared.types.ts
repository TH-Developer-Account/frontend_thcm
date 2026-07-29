export type ApiDateString = string;

export type ApprovalRule = "ANY" | "ALL" | "SOME";

export type WorkflowExecutionMode = "SEQUENTIAL" | "PARALLEL";

export type WorkflowUser = {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};
