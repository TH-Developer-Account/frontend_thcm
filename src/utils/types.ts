import { status } from "../modules/marketing/constant";

// badge and button types
export type TableUserStatus =
  | "Active"
  | "Blocked"
  | "Inactive"
  | "active"
  | "inactive"
  | "blocked";
export type EPCStatus =
  | "Approved"
  | "Recommended"
  | "Pending"
  | "Completed"
  | "Submitted"
  | "Sent Back"
  | "Report Submitted"
  | "Cancelled";

export type GeneralStatus = EPCStatus | TableUserStatus;

export const statusMap: Record<string, EPCStatus> = {
  PENDING: "Pending",
  RECOMMENDED: "Recommended",
  SUBMITTED: "Submitted",
  SENT_BACK: "Sent Back",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  REPORT_SUBMITTED: "Report Submitted",
};
export interface TableUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  status: TableUserStatus;
  avatar: string;
}
export const statusStyles: Record<TableUserStatus, string> = {
  Active: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  Inactive: "bg-amber-100 text-amber-700",
  inactive: "bg-amber-100 text-amber-700",
  Blocked: "bg-red-100 text-red-600",
  blocked: "bg-red-100 text-red-600",
};
// types.ts (or same file)
type StatusKey = keyof typeof status;

// EPC Listing Table
export interface EPCRow {
  id: string;
  proposal_number: string;
  event_description: string;
  created_by: string;
  status: StatusKey;
  location: string;
  event_name: string;
  first_name: string;
  last_name: string;
  is_crf_form: boolean;
  is_epf_form: boolean;
  epf?: string;
  crf?: string;
}

export interface PaginationProps {
  pageIndex: number; // 0-based
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export type EventRow = {
  id: string;
  type: "EPC" | "EPF" | "CRF";
  status: "Pending" | "Approved" | "Rejected";
  budget: number;
  participants: number;
};
