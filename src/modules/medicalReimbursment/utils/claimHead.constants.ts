import type { ClaimHead } from "../types/reimbursementClaim.types";

/** Every claim head the API can return — used to label existing bills. */
export const ALL_CLAIM_HEAD_OPTIONS: Array<{ label: string; value: ClaimHead }> = [
	{ label: "Visit Fees", value: "VISIT_FEES" },
	{ label: "Medicines & Investigations", value: "MEDICINES_INVESTIGATIONS" },
	{ label: "Ophthalmic Treatment", value: "OPHTHALMIC_TREATMENT" },
	{ label: "Executive Health Check-up", value: "EXECUTIVE_HEALTH_CHECKUP" },
	{ label: "Excess Hospitalisation", value: "EXCESS_HOSPITALISATION" },
];

/**
 * Heads a claimant can pick. Hospitalisation is not covered by this
 * (non-hospitalisation) form, so it is never offered — the row schema would
 * reject it anyway.
 */
export const CLAIM_HEAD_OPTIONS = ALL_CLAIM_HEAD_OPTIONS.filter(
	(option) => option.value !== "EXCESS_HOSPITALISATION",
);

export const getClaimHeadLabel = (value?: string | null): string =>
	ALL_CLAIM_HEAD_OPTIONS.find((option) => option.value === value)?.label ??
	(value || "--");

export const PATIENT_OPTIONS = [
	{ label: "Self", value: "SELF" },
	{ label: "Spouse", value: "SPOUSE" },
];
