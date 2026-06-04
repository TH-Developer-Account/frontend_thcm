export type ReportStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "APPROVED"
	| "CLARIFY_REPORT"
	| "REJECTED";

export type ReportImage = {
	id?: string;
	url: string;
	position?: number;
	caption?: string;
	file?: File;
};

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
