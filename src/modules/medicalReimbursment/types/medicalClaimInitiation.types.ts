import type { MedicalClaimStatus } from "./medicalClaimListing.types";

export type MedicalClaimInitiationFormMode = "create" | "view";

export interface MedicalClaimInitiationPayload {
	employeeName: string;
	email: string;
	mobile: string;
	ticketNumber: string;
}

export interface MedicalClaimInitiationValues extends MedicalClaimInitiationPayload {
	status?: MedicalClaimStatus;
	referenceNumber?: string;
}

export type MedicalClaimInitiationErrors = Partial<
	Record<keyof MedicalClaimInitiationPayload, string>
>;
