import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

import type { MedicalClaimListingTab } from "../types/medicalClaimListing.types";

export const MEDICAL_CLAIM_LISTING_FILTER_TABS = [
	{
		value: "claims",
		label: "Created by me",
		shortLabel: "Created",
		tooltipLabel: "View medical claims initiated by me",
		Icon: ShieldCheck,
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
