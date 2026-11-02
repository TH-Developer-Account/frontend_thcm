export type AuthorityRole = "PROPOSER" | "CHECKER" | "APPROVER";

export type AuthorityLimitAssignment = {
  id: string;
  role: AuthorityRole;
  designationId: string;
  designationName: string;
};

export type AuthorityLimit = {
  id: string;
  label: string;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
  assignments: AuthorityLimitAssignment[];
};

export type AuthorityLimitInput = {
  label: string;
  minAmount: number;
  maxAmount: number | null;
  isActive?: boolean;
};
