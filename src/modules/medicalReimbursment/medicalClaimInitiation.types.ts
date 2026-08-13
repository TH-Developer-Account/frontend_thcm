import type { MedicalClaimStatus } from "./medicalClaimListing.types";

export type MedicalClaimInitiationFormMode = "create" | "view";

export interface MedicalClaimInitiationPayload {
	employeeName: string;
	email: string | null;
	mobile: string | null;
}

export interface MedicalClaimInitiationValues extends MedicalClaimInitiationPayload {
	status?: MedicalClaimStatus;
	referenceNumber?: string;
}

export type MedicalClaimInitiationErrors = Partial<
	Record<keyof MedicalClaimInitiationPayload, string>
>;
