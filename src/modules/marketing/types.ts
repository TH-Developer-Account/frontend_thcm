import type { EPCStatus } from "../../utils/types";

export interface CostItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export interface CrfProps {
	items: CostItem[];
	onChange: (items: CostItem[]) => void;
	isViewer?: boolean;
}

export interface EpcFormProps {
	epcId?: string;
	userRole: "ADMIN" | "MANAGER" | "VIEWER";
}

export type EpcStatus = "DRAFT" | "SUBMITTED";

export interface EpcFormValues {
	id?: string; // for edit mode
	epfNo: string;
	poDocumentRefNo: string;
	department: string;
	zone: string;
	branch: string;
	budgetCode: string;
	vertical: string;
	scale: string;
	eventName: string;
	eventDescription: string;
	eventFrom: string;
	eventTo: string;
	location: string;
	objective: string;
	status: EpcStatus;
}

export type UserRole = "ADMIN" | "EMPLOYEE" | "DEALER";

export interface UseEpcFormProps {
	epcId?: string;
}
export interface Option {
	label: string;
	value: string;
}

export const ALL_STATUSES = [
	{ api: "PENDING", label: "Pending" },
	{ api: "RECOMMENDED", label: "Recommended" },
	{ api: "SUBMITTED", label: "Submitted" },
	{ api: "SENT_BACK", label: "Sent Back" },
	{ api: "APPROVED", label: "Approved" },
	{ api: "CANCELLED", label: "Cancelled" },
	{ api: "COMPLETED", label: "Completed" },
	{ api: "REPORT_SUBMITTED", label: "Report Submitted" },
] as const;

export type ApprovalApiStatus = (typeof ALL_STATUSES)[number]["api"];

export const BASE_STEPS = ALL_STATUSES.filter((s) =>
	["PENDING", "RECOMMENDED", "SUBMITTED"].includes(s.api),
);

export const SUCCESS_STEPS = ALL_STATUSES.filter((s) =>
	["APPROVED", "COMPLETED", "REPORT_SUBMITTED"].includes(s.api),
);

export const INTERRUPT_STEPS = ALL_STATUSES.filter((s) =>
	["SENT_BACK", "CANCELLED"].includes(s.api),
);

export const EPC_TO_API_STATUS: Record<EPCStatus, ApprovalApiStatus> = {
	Approved: "APPROVED",
	Recommended: "RECOMMENDED",
	Pending: "PENDING",
	Completed: "COMPLETED",
	Submitted: "SUBMITTED",
	"Sent Back": "SENT_BACK",
	"Report Submitted": "REPORT_SUBMITTED",
	Cancelled: "CANCELLED",
};
