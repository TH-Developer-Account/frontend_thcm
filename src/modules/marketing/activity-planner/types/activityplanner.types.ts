// badge and button types
export type TableUserStatus = "Active" | "Blocked" | "Inactive";

export type EditingSection = "epc" | "crf" | "epf" | null;

export type PlannerMode =
	| "NORMAL"
	| "CLARIFICATION_EDIT"
	| "DEVIATION_EDIT"
	| "REPORT_FLOW";

export type PlannerEditableFields = {
	epc: string[];
	crf: string[];
	epf: string[];
};

export type PlannerPermissions = {
	isProposerUser: boolean;
	canActOnCurrentStage: boolean;

	canEditEpc: boolean;
	canEditCrf: boolean;
	canEditEpf: boolean;

	canShowApprovalWorkflow: boolean;
	canShowComments: boolean;
	canShowOutcome: boolean;
	canShowDeviation: boolean;
	canShowReport: boolean;

	canSubmitClarifiedUpdate: boolean;
	canSubmitDeviationUpdate: boolean;

	editableFields: PlannerEditableFields;
};

export type EPCStatus =
	| "Approved"
	| "Conducted"
	| "Pending"
	| "Completed"
	| "Submitted"
	| "Validated"
	| "Report Submitted"
	| "Report Clarified"
	| "Cancelled"
	| "Clarified"
	| "In Progress"
	| "Rejected"
	| "Deviated"
	| "Closed";

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
	SUBMITTED: "Submitted",
	APPROVED: "Approved",
	CANCELLED: "Cancelled",
	CONDUCTED: "Conducted",
	COMPLETED: "Completed",
	REPORT_SUBMITTED: "Report Submitted",
	CLARIFY_REPORT: "Report Clarified",
	CLARIFY: "Clarified",
	VALIDATED: "Validated",
	DEVIATION_IN_PROGRESS: "Deviated",
	CLOSED: "Closed",
};

export interface PaginationProps {
	pageIndex: number; // 0-based
	pageSize: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
}

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
