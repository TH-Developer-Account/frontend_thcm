import type { ClaimHead } from "../types/reimbursementClaim.types";

export const HOSPITALISATION_CLAIM_HEAD: ClaimHead = "EXCESS_HOSPITALISATION";

/** Every claim head the API can return — used to label existing bills. */
export const ALL_CLAIM_HEAD_OPTIONS: Array<{
	label: string;
	value: ClaimHead;
}> = [
	{ label: "Visit Fees", value: "VISIT_FEES" },
	{ label: "Medicines & Investigations", value: "MEDICINES_INVESTIGATIONS" },
	{ label: "Ophthalmic Treatment", value: "OPHTHALMIC_TREATMENT" },
	{ label: "Executive Health Check-up", value: "EXECUTIVE_HEALTH_CHECKUP" },
	{ label: "Excess Hospitalisation", value: "EXCESS_HOSPITALISATION" },
];

/** The non-hospitalisation heads — what every grade can pick. */
export const CLAIM_HEAD_OPTIONS = ALL_CLAIM_HEAD_OPTIONS.filter(
	(option) => option.value !== HOSPITALISATION_CLAIM_HEAD,
);

/**
 * Heads a claimant can pick. Hospitalisation is offered to EG grades only
 * (pass `isHospitalisationGrade(grade)`); the row schema and the backend
 * reject it for every other grade.
 */
export const getClaimHeadOptions = (allowHospitalisation: boolean) =>
	allowHospitalisation ? ALL_CLAIM_HEAD_OPTIONS : CLAIM_HEAD_OPTIONS;

export const getClaimHeadLabel = (value?: string | null): string =>
	ALL_CLAIM_HEAD_OPTIONS.find((option) => option.value === value)?.label ??
	(value || "--");

export const PATIENT_OPTIONS = [
	{ label: "Self", value: "SELF" },
	{ label: "Spouse", value: "SPOUSE" },
];
