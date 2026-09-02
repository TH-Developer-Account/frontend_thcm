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

export type MedicalClaimImportError = {
	row?: number;
	employeeName?: string;
	message?: string;
	error?: string;
};

export type MedicalClaimImportProgress = {
	status: "waiting" | "delayed" | "active" | "completed" | "failed";
	totalRows: number;
	processedRows: number;
	failedRows: number;
	errors: MedicalClaimImportError[];
	failedReason?: string;
};
