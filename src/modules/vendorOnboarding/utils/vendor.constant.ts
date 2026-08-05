import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import type { VendorListingFilter } from "../types/vendorListing.types";

export const VENDOR_ONBOARDING_FILTER_TABS = [
	{
		value: "onboarding",
		label: "Created by me",
		shortLabel: "Created",
		tooltipLabel: "View vendor onboarding records created by me",
		Icon: ShieldCheck,
	},
	{
		value: "pendingOnMe",
		label: "Pending on me",
		shortLabel: "Pending",
		tooltipLabel: "View vendor onboarding approvals pending on me",
		Icon: Clock3,
	},
	{
		value: "approvedByMe",
		label: "Approved by me",
		shortLabel: "Approved",
		tooltipLabel: "View vendor onboarding requests approved by me",
		Icon: CheckCircle2,
	},
] as const satisfies ReadonlyArray<{
	value: VendorListingFilter;
	label: string;
	shortLabel: string;
	tooltipLabel: string;
	Icon: typeof ShieldCheck;
}>;
export const VENDOR_INITIATION_FILTER_TABS = [
	{
		value: "initiation",
		label: "Created by me",
		shortLabel: "Created",
		tooltipLabel: "View vendor onboarding records created by me",
		Icon: ShieldCheck,
	},
	{
		value: "pendingOnMe",
		label: "Pending on me",
		shortLabel: "Pending",
		tooltipLabel: "View vendor onboarding approvals pending on me",
		Icon: Clock3,
	},
	// {
	// 	value: "approvedByMe",
	// 	label: "Approved by me",
	// 	shortLabel: "Approved",
	// 	tooltipLabel: "View vendor onboarding requests approved by me",
	// 	Icon: CheckCircle2,
	// },
] as const satisfies ReadonlyArray<{
	value: VendorListingFilter;
	label: string;
	shortLabel: string;
	tooltipLabel: string;
	Icon: typeof ShieldCheck;
}>;
