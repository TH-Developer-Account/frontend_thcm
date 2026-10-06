// types/epc.types.ts
// EPC + shared Activity Planner types:
// planner/status, EPC detail & list, line items, event outcome,
// event report and files module.
import type React from "react";

import type { CommentUser } from "../../../../components/ui/comments";
import type { FileUploadValue } from "../../../../components/ui/FileUpload/fileUpload.types";
import type { PendingOn } from "../../../../utils/statusAlert.helper";
import type { ActiveWorkflow, WorkflowStage } from "../../../workflows";
import type { ApiStatus } from "../utils/status";

/* ========================================================================== */
/*                          Planner / status (shared)                         */
/* ========================================================================== */

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

/* ========================================================================== */
/*                                 EPC — list                                 */
/* ========================================================================== */

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
	pendingOn: PendingOn;

	// ↓ new — used by the row action menu
	created_by_id?: string;
	crf_id?: string | null;
	epf_id?: string | null;

	// Derived server-side (see searchEventProposal.helper.ts's
	// attachSourceType) from the EPC's EventName.reportTemplateKey via the
	// event report template registry. null when the EventName has no
	// reportTemplateKey mapped — callers should treat null as "no
	// report-related actions available for this row", not as a LEAD_FORM
	// default.
	sourceType?: "LEAD_FORM" | "DATA_FORM" | null;
	dualVariant?: boolean;
};

export type EpcListResponse = {
	data: EpcListItem[];
	total?: number;
	page?: number;
	limit?: number;
	totalPages?: number;
};

/* ========================================================================== */
/*                                EPC — detail                                */
/* ========================================================================== */

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

/* ========================================================================== */
/*                            EPC — form & payload                            */
/* ========================================================================== */

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

/* ========================================================================== */
/*                     Line items (shared by CRF and EPF)                     */
/* ========================================================================== */

export type ProductType = "EPF" | "CRF";

export type Product = {
	id: string;
	productType: ProductType;
	category: string;
	partNumber: string;
	name: string;
	description: string | null;
	unitRate: string | number;
	isActive: boolean;
	created_at: string;
	updated_at: string;
	width?: number;
	height?: number;
	unit?: string;
};

export type LineItemOption = {
	id?: string;
	value: string;
	label: string;
	particular: string;
	description: string | null;
	category?: string;
	partNumber?: string;

	rate?: number;
	quantity?: number;
	total?: number;

	width?: number;
	height?: number;
	unit?: string;

	quotationFile?: File | null;
	quotationFileUrl?: string | null;
	quotationFileName?: string | null;
};

export interface LineItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export type GroupedOption = {
	label: string;
	options: LineItemOption[];
};

/**
 * Normalized row consumed by LineTableView.
 *
 * Values such as height and width may arrive from the API as either
 * numbers or numeric strings, so the view model supports both.
 */
export type TableRow = {
	id?: string;

	sno: number;
	partNumber?: string;

	particulars: string;
	description: string;

	rate?: number;
	qty?: number;
	total?: number;

	height?: number | string;
	width?: number | string;
	unit?: string;

	category?: string;

	quotationUrl?: string | null;
	quotationFileName?: string | null;
};

/**
 * Kept as an alias only if existing files already import this name.
 * This represents one row, not an array of rows.
 */
export type LineItemTableGen = TableRow;

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

export type ColumnKey =
	| "sno"
	| "partNumber"
	| "particular"
	| "description"
	| "rate"
	| "quantity"
	| "total"
	| "width"
	| "height"
	| "unit"
	| "quotation"
	| "actions";

export interface ColumnConfig {
	key: ColumnKey;
	label: string;
	colSpan: number;
	align?: "left" | "right" | "center";
	editable?: boolean;
	disabled?: boolean;
}

/* ========================================================================== */
/*                         Event outcome / deviation                          */
/* ========================================================================== */

export type EventDeviationPayload =
	| {
			status: string;
			reason: string;
	  }
	| FormData;

export type EventOutcomePayload = {
	status: string;
	reason: string;
};

export type EventOutcomeProps = {
	eventStatus?: string | null;
	epcID?: string | null;

	workspaceId?: string;
	appId?: string;

	onSuccess?: () => void | Promise<void>;
	onDeviationPreviewSuccess?: (stages: WorkflowStage[]) => void;
};

export type DeviationInfo = {
	reason: string;
	deviatedAmount: string;
	file: FileUploadValue | null;
};

/* ========================================================================== */
/*                                Event report                                */
/* ========================================================================== */

export type ReportStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "APPROVED"
	| "CLARIFY_REPORT"
	| "REJECTED";

export type ReportImage = {
	id?: string;
	url?: string | null;
	fileUrl?: string | null;
	s3Key?: string | null;
	reportId?: string;
	position?: number;
	caption?: string;
	file?: File;
};

export type UploadFileItem = {
	url: string;
	file?: File;
	name?: string;
	type?: string;
	size?: number;
};

export type AllowedFileKind = "image" | "pdf" | "document" | "any";

export type OutcomeStatus =
	| "SUCCESSFUL"
	| "PARTIALLY_SUCCESSFUL"
	| "UNSUCCESSFUL"
	| "";

export type EventReportDetail = {
	id?: string;
	status?: ReportStatus | string;
	pdfUrl?: string | null;
	validatorId?: string | null;
	totalLeadsGenerated?: number | string | null;
	outcomeStatus?: OutcomeStatus | string | null;
	approvedEventCost?: number | string | null;
	expectedConversion?: string | null;
	remarks?: string | null;
	images?: ReportImage[];
};

export type FormState = {
	totalLeadsGenerated: string;
	outcomeStatus: OutcomeStatus;
	approvedEventCost: string;
	expectedConversion: string;
	remarks: string;
	formType: "CREATE" | "EDIT";
};

export type EventReportTemplateProps = {
	epcId: string;
	initialReport?: EventReportDetail | null;
	onBack: () => void;
	onPreview: () => void;
	onSuccess?: () => void | Promise<void>;
	eventCost?: number | string;
};

export type PreviewProps = {
	open: boolean;
	onClose: () => void;
	epcData?: EpcDetailResponse | null;
	report?: EventReportDetail | null;
	loading?: boolean;
};

export type EventReportSectionProps = {
	report?: EventReportDetail | null;
	isProposer?: boolean;
	isValidator?: boolean;
	canCreateReport?: boolean;
	canViewReport?: boolean;
	hasValidatorPreviewed?: boolean;
	isValidating?: boolean;
	isClarifying?: boolean;
	onOpenReportBuilder: () => void;
	onOpenReportPreview: () => void;
	onValidateReport?: () => void | Promise<void>;
	onClarifyReport?: () => void | Promise<void>;
};

export type UseEventReportFormProps = {
	epcId: string;
	eventCost?: string | number;
	initialReport?: EventReportDetail | null;
	onSuccess?: () => void | Promise<void>;
};

/* ========================================================================== */
/*                                Files module                                */
/* ========================================================================== */

export type FileDownloadKind = "output" | "error";

export type FileModuleTriggeredBy = {
	id: string;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
};

export type FileModuleEpc = {
	id: string;
	proposalNumber: string;
};

export type FileModuleApiItem = {
	id?: unknown;
	type?: unknown;
	status?: unknown;

	totalRecords?: unknown;
	successRecords?: unknown;
	failedRecords?: unknown;

	hasOutputFile?: unknown;
	hasErrorFile?: unknown;

	createdAt?: unknown;

	triggeredBy?: {
		id?: unknown;
		first_name?: unknown;
		last_name?: unknown;
		email?: unknown;
	} | null;

	epc?: {
		id?: unknown;
		proposal_number?: unknown;
	} | null;
};

export type FileModuleListingRow = {
	id: string;
	type: string;
	status: string;

	totalRecords: number;
	successRecords: number;
	failedRecords: number;

	hasOutputFile: boolean;
	hasErrorFile: boolean;

	createdAt: string;

	triggeredBy: FileModuleTriggeredBy | null;
	epc: FileModuleEpc | null;
};

export type FileModuleEventGroupRow = {
	id: string;
	epc: FileModuleEpc | null;

	operationCount: number;
	operationTypes: string[];

	totalRecords: number;
	successRecords: number;
	failedRecords: number;

	outputFileCount: number;
	errorFileCount: number;

	latestStatus: string;
	latestCreatedAt: string;

	triggeredBy: FileModuleTriggeredBy[];
	logs: FileModuleListingRow[];
};

export type FileDownloadUrlResponse = {
	success: boolean;
	url: string;
};
