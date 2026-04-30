import type { EPCStatus } from "../../utils/types";

export interface CostItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export interface CrfProps {
	items: LineItemOption[];
	onChange: React.Dispatch<React.SetStateAction<LineItemOption[]>>;
	isViewer?: boolean;
	options: GroupedOption[];
}

export interface EpcFormProps {
	epcId?: string;
}

export type EpcStatus = "DRAFT" | "SUBMITTED";

export interface EpcFormValues {
	id?: string; // for edit mode
	epfNo: string;
	poDocumentRefNo: string;
	department: string;
	region: string;
	branch: string;
	budget_master_id: string;
	budgetDescription: string;
	vertical: string;
	event_scale?: string;
	event_name: string;
	event_description: string;
	event_from_date: string;
	event_to_date: string;
	location: string;
	event_objective: string;
	status: EpcStatus;
	proposal_number: string;
}

export type UserRole = "ADMIN" | "EMPLOYEE" | "DEALER";

export interface Option {
	label: string;
	value: string;
	department?: string;
	description?: string;
	code?: string;
}

export const ALL_STATUSES = [
	{ api: "PENDING", label: "Pending" },
	{ api: "SUBMITTED", label: "Submitted" },
	{ api: "RECOMMENDED", label: "Recommended" },
	{ api: "CHECKED", label: "Checked" },
	{ api: "SENT_BACK", label: "Sent Back" },
	{ api: "APPROVED", label: "Approved" },
	{ api: "CANCELLED", label: "Cancelled" },
	{ api: "COMPLETED", label: "Completed" },
	{ api: "REPORT_SUBMITTED", label: "Report Submitted" },
] as const;

export type ApprovalApiStatus = (typeof ALL_STATUSES)[number]["api"];

export const BASE_STEPS = ALL_STATUSES.filter((s) =>
	["PENDING", "SUBMITTED"].includes(s.api),
);

export const SUCCESS_STEPS = ALL_STATUSES.filter((s) =>
	[
		"RECOMMENDED",
		"CHECKED",
		"APPROVED",
		"COMPLETED",
		"REPORT_SUBMITTED",
	].includes(s.api),
);

export const INTERRUPT_STEPS = ALL_STATUSES.filter((s) =>
	["SENT_BACK", "CANCELLED"].includes(s.api),
);

export const EPC_TO_API_STATUS: Record<EPCStatus, ApprovalApiStatus> = {
	Approved: "APPROVED",
	Recommended: "RECOMMENDED",
	Checked: "CHECKED",
	Pending: "PENDING",
	Completed: "COMPLETED",
	Submitted: "SUBMITTED",
	"Sent Back": "SENT_BACK",
	"Report Submitted": "REPORT_SUBMITTED",
	Cancelled: "CANCELLED",
};

export interface EpfFormValues {
	// Participants
	externalParticipants: number;
	internalParticipants: number;
	totalParticipants: number;
	crfTotal: number;
	// Budget
	eventBudget: number;
	annualBudget: number;
	availableBudget: number;
	allotedBudget: number;
	// Dealer
	dealerName: string;
	dealerPercent: number;
	dealerShare: number;
	// Tata Hitachi
	tataHitachiPercent: number;
	tataHitachiShare: number;
	tataHitachiPoAmount: number;
}

export interface LineItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export interface ValidationCheck {
	key: keyof EpfFormValues | string;
	label: string;
	ok: boolean;
}

export type Product = {
	id: string;
	productType: "EPF" | "CRF";
	category: string; // you can tighten this if you have enum
	partNumber: string;
	name: string;
	description: string | null;
	unitRate: string; // ⚠️ comes as string from Prisma Decimal
	isActive: boolean;
	created_at: string; // ISO date string
	updated_at: string; // ISO date string
};

export type LineItemOption = {
	value: string;
	label: string;
	particular: string;
	description: string | null;
	rate: number;
	quantity: number;
	category?: string;
	partNumber?: string;
	// height?: string;
	// width?: string;
	// artworkSize?: string;
};

export type GroupedOption = {
	label: string; // category
	options: LineItemOption[];
};

export type EPCFormErrors = Partial<Record<keyof EpcFormValues, string>>;
export type UseEpcFormProps = {
	epcId?: string | number;
};
