import { status } from "../modules/marketing/constant";
import type { EpcWorkflowApproval } from "../modules/marketing/activity-planner/types/epc.types";

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
	| "Checked"
	| "Recommended"
	| "Pending"
	| "Completed"
	| "Submitted"
	| "Sent Back"
	| "Report Submitted"
	| "Cancelled";

export const APPROVAL_STATUS = {
	PENDING: "PENDING",
	APPROVED: "APPROVED",
	REJECTED: "REJECTED",
	IN_PROGRESS: "IN_PROGRESS",
} as const;
export type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Clarified";
export type GeneralStatus = EPCStatus | TableUserStatus | ApprovalStatus;

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
	is_epc_form?: boolean;
	is_crf_form: boolean;
	is_epf_form: boolean;
	is_lead_form?: boolean;
	lead_id?: string;
	epc_id?: string;
	epf_id?: string;
	crf_id?: string;
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

	// old compatibility
	name?: string;
	email?: string;

	// new display format
	approvers?: ApprovalTableApproverRow[];
};

export type ApprovalRow = {
	id: number;
	name: string;
	email: string;
	stageName?: string;
	strategy: string;
	status?: string;
	stageOrder?: number;
	approvals?: EpcWorkflowApproval[];
};

// utils/types/api.types.ts

export type ApiErrorResponse = {
	success: boolean;
	statusCode: number;
	message: string;
	errors?: Record<string, string[]>;
};
