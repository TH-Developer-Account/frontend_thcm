import type { EpcDetailResponse } from "../types/epc.types";

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
