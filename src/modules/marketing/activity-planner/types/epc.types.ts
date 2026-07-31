import type { CommentUser } from "../../../../components/ui/comments";
import type { ActiveWorkflow } from "../../../workflows";
import type { ApiStatus } from "../utils/status";

export type ApprovalApiStatus = ApiStatus;
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

type Report = {
	id: string;
	epcId: string;
	status: string;
	remarks: string | null;
	outcomeStatus: string | null;
	totalLeadsGenerated: number | null;

	// API returns Decimal as string
	approvedEventCost: string | null;

	// API currently returns this as string
	expectedConversion: string | null;

	validatorId: string | null;
	images: {
		id: string;
		reportId: string;
		position: number;
		s3Key: string;
		fileUrl: string;
	}[];
};
export type EpcDeviationInfo = {
	deviationReason?: string | null;
	deviationAmount?: string | number | null;
	deviationDocUrl?: string | null;
	deviationDocS3Key?: string | null;
};

export type EpcDetailResponse = EpcDeviationInfo & {
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

	created_by?:
		| {
				id: string;
				first_name?: string;
				last_name?: string;
				email?: string;
		  }
		| CommentUser
		| null;

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
	activeWorkflow?: ActiveWorkflow | null;
	report?: Report | null;
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
