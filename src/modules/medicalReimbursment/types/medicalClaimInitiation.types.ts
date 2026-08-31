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

export type MedicalClaimInitiationImportPayload = FormData;

export interface MedicalClaimInitiationImportResponse {
	success: boolean;
	message: string;
	data?: {
		totalRows: number;
		importedRows: number;
		failedRows: number;
	};
}
export interface ImportedMedicalClaimInitiationRow {
	/**
	 * Client-side identifier used only by the table.
	 * Do not include this in the initiation payload.
	 */
	rowId: string;
	employeeName: string;
	grade: string;
	email: string;
	mobile: string;
}

export type ImportedMedicalClaimInitiationApiRow = Omit<
	ImportedMedicalClaimInitiationRow,
	"rowId"
>;

export interface MedicalClaimInitiationImportResponse {
	success: boolean;
	message: string;
	importedData: ImportedMedicalClaimInitiationApiRow[];
}

export interface BulkMedicalClaimInitiationPayload {
	employees: ImportedMedicalClaimInitiationApiRow[];
}

export interface BulkMedicalClaimInitiationResponse {
	success: boolean;
	message: string;
	data?: {
		total: number;
		initiated: number;
		failed: number;
	};
}
