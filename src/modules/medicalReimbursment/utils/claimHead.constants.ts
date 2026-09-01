import type { ClaimHead } from "../types/reimbursementClaim.types";

export const CLAIM_HEAD_OPTIONS: Array<{
	label: string;
	value: ClaimHead;
}> = [
	{
		label: "Visit Fees",
		value: "VISIT_FEES",
	},
	{
		label: "Medicines & Investigations",
		value: "MEDICINES_INVESTIGATIONS",
	},
	{
		label: "Ophthalmic Treatment",
		value: "OPHTHALMIC_TREATMENT",
	},
	{
		label: "Executive Health Check-up",
		value: "EXECUTIVE_HEALTH_CHECKUP",
	},
	{
		label: "Excess Hospitalisation",
		value: "EXCESS_HOSPITALISATION",
	},
];

export const PATIENT_OPTIONS = [
	{
		label: "Self",
		value: "SELF",
	},
	{
		label: "Spouse",
		value: "SPOUSE",
	},
];
