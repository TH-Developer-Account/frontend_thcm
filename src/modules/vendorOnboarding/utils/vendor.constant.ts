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
export type StateOption = {
	label: string;
	value: string;
};

export const STATES: StateOption[] = [
	{ label: "Andhra Pradesh", value: "ANDHRA_PRADESH" },
	{ label: "Arunachal Pradesh", value: "ARUNACHAL_PRADESH" },
	{ label: "Assam", value: "ASSAM" },
	{ label: "Bihar", value: "BIHAR" },
	{ label: "Chhattisgarh", value: "CHHATTISGARH" },
	{ label: "Goa", value: "GOA" },
	{ label: "Gujarat", value: "GUJARAT" },
	{ label: "Haryana", value: "HARYANA" },
	{ label: "Himachal Pradesh", value: "HIMACHAL_PRADESH" },
	{ label: "Jharkhand", value: "JHARKHAND" },
	{ label: "Karnataka", value: "KARNATAKA" },
	{ label: "Kerala", value: "KERALA" },
	{ label: "Madhya Pradesh", value: "MADHYA_PRADESH" },
	{ label: "Maharashtra", value: "MAHARASHTRA" },
	{ label: "Manipur", value: "MANIPUR" },
	{ label: "Meghalaya", value: "MEGHALAYA" },
	{ label: "Mizoram", value: "MIZORAM" },
	{ label: "Nagaland", value: "NAGALAND" },
	{ label: "Odisha", value: "ODISHA" },
	{ label: "Punjab", value: "PUNJAB" },
	{ label: "Rajasthan", value: "RAJASTHAN" },
	{ label: "Sikkim", value: "SIKKIM" },
	{ label: "Tamil Nadu", value: "TAMIL_NADU" },
	{ label: "Telangana", value: "TELANGANA" },
	{ label: "Tripura", value: "TRIPURA" },
	{ label: "Uttar Pradesh", value: "UTTAR_PRADESH" },
	{ label: "Uttarakhand", value: "UTTARAKHAND" },
	{ label: "West Bengal", value: "WEST_BENGAL" },
	{
		label: "Andaman and Nicobar Islands",
		value: "ANDAMAN_AND_NICOBAR_ISLANDS",
	},
	{ label: "Chandigarh", value: "CHANDIGARH" },
	{
		label: "Dadra and Nagar Haveli and Daman and Diu",
		value: "DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU",
	},
	{ label: "Delhi", value: "DELHI" },
	{ label: "Jammu and Kashmir", value: "JAMMU_AND_KASHMIR" },
	{ label: "Ladakh", value: "LADAKH" },
	{ label: "Lakshadweep", value: "LAKSHADWEEP" },
	{ label: "Puducherry", value: "PUDUCHERRY" },
];
