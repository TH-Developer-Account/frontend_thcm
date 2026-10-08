export type MedicalClaimInitiationFormMode = "create" | "view";

export interface MedicalClaimInitiationPayload {
	employeeName: string;
	email: string;
	mobile: string;
	ticketNumber: string;
}

export interface MedicalClaimInitiationValues extends MedicalClaimInitiationPayload {
	status?: string;
	referenceNumber?: string;
}

export type MedicalClaimInitiationErrors = Partial<
	Record<keyof MedicalClaimInitiationPayload, string>
>;

/** Row-level error — same shape the backend import returns. */
export type MedicalClaimImportError = {
	row?: number;
	field?: string;
	employeeName?: string;
	message?: string;
	error?: string;
};

export type MedicalClaimImportJobStatus =
	| "waiting"
	| "delayed"
	| "active"
	| "completed"
	| "failed";

export type MedicalClaimImportProgress = {
	status: MedicalClaimImportJobStatus;
	totalRows: number;
	/** Rows successfully initiated. */
	processedRows: number;
	/** Rows NOT initiated. */
	failedRows: number;
	/** Rows initiated whose email failed (claim exists, link needs re-sending). */
	mailFailedRows?: number;
	errors: MedicalClaimImportError[];
	failedReason?: string;
	/** Rows removed client-side before upload (failed browser validation). */
	skippedRows?: number;
};

/** One parsed spreadsheet row after browser-side validation. */
export type ParsedInitiationRow = {
	row: number; // 1-based spreadsheet row (header = 1)
	values: MedicalClaimInitiationPayload;
	errors: Partial<Record<keyof MedicalClaimInitiationPayload | "row", string>>;
	isValid: boolean;
};

export type ParsedInitiationFile = {
	fileName: string;
	rows: ParsedInitiationRow[];
	validCount: number;
	invalidCount: number;
	/** Fatal problems (missing columns, empty sheet). Import is blocked. */
	fileErrors: string[];
};
