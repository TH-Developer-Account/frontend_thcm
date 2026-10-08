import { CheckCircle2, Clock3, Send, ShieldCheck } from "lucide-react";

import type {
	MedicalClaimListingTab,
	MedicalClaimStatus,
} from "../types/medicalClaimListing.types";
import { MEDICAL_CLAIM_STATUS_LABELS } from "./medicalClaimStatus.constants";

export const MEDICAL_CLAIM_LISTING_FILTER_TABS = [
	// {
	// 	value: "claims",
	// 	label: "Created by me",
	// 	shortLabel: "Created",
	// 	tooltipLabel: "View medical claims initiated by me",
	// 	Icon: ShieldCheck,
	// },
	{
		value: "initiation",
		label: "Awaiting employee",
		shortLabel: "Awaiting",
		tooltipLabel:
			"Claims whose link was sent but not yet submitted by the employee",
		Icon: Send,
	},
	{
		value: "pendingOnMe",
		label: "Pending on me",
		shortLabel: "Pending",
		tooltipLabel: "View medical claims awaiting my approval",
		Icon: Clock3,
	},
	{
		value: "approvedByMe",
		label: "Approved by me",
		shortLabel: "Approved",
		tooltipLabel: "View medical claims approved by me",
		Icon: CheckCircle2,
	},
] as const satisfies ReadonlyArray<{
	value: MedicalClaimListingTab;
	label: string;
	shortLabel: string;
	tooltipLabel: string;
	Icon: typeof ShieldCheck;
}>;

export type MedicalClaimStatusFilter = "all" | MedicalClaimStatus;

export type MedicalClaimStatusOption = {
	label: string;
	value: MedicalClaimStatusFilter;
};

const option = (value: MedicalClaimStatus): MedicalClaimStatusOption => ({
	label: MEDICAL_CLAIM_STATUS_LABELS[value],
	value,
});

/** Status filter options per tab (values match the backend exactly). */
export const getStatusOptionsForTab = (
	tab: MedicalClaimListingTab,
): MedicalClaimStatusOption[] => {
	if (tab === "initiation") return [];
	const statuses: MedicalClaimStatus[] =
		tab === "pendingOnMe"
			? ["IN_PROGRESS"]
			: [
					"IN_PROGRESS",
					"CLARIFICATION_REQUESTED",
					"APPROVED",
					"REJECTED",
					"CLOSED",
				];
	return [{ label: "All statuses", value: "all" }, ...statuses.map(option)];
};
