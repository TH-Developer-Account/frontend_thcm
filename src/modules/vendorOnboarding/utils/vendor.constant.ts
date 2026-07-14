import { ListChecks, ShieldCheck } from "lucide-react";
import type {
	VendorInitiationListingRow,
	VendorOnboardingListingRow,
} from "../types/vendorListing.types";

export const VENDOR_FILTER_TABS = [
	{
		value: "initiation",
		label: "Vendor Initiation",
		tooltipLabel: "View vendor initiation requests",
		Icon: ListChecks,
	},
	{
		value: "onboarding",
		label: "Vendor Onboarding",
		tooltipLabel: "View vendor onboarding records",
		Icon: ShieldCheck,
	},
] as const;

export const DUMMY_INITIATION_ROWS: VendorInitiationListingRow[] = [
	{
		id: "vendor-initiation-001",
		vendorName: "ABC Industrial Suppliers",
		vendorEmail: "contact@abcindustrial.com",
		vendorPhone: "9876543210",
		status: "PENDING",
		createdBy: "THCM Employee",
		createdAt: "2026-07-01",
	},
	{
		id: "vendor-initiation-002",
		vendorName: "Shakti Engineering Works",
		vendorEmail: "sales@shaktiengineering.com",
		vendorPhone: "9876543211",
		status: "APPROVED",
		createdBy: "THCM Employee",
		createdAt: "2026-07-02",
	},
	{
		id: "vendor-initiation-003",
		vendorName: "Dharwad Logistics Partner",
		vendorEmail: "operations@dharwadlogistics.com",
		vendorPhone: "9876543212",
		status: "PENDING",
		createdBy: "Current User",
		createdAt: "2026-07-03",
	},
];

export const DUMMY_ONBOARDING_ROWS: VendorOnboardingListingRow[] = [
	{
		id: "vendor-onboarding-001",
		vendorCode: "VND-1001",
		vendorName: "ABC Industrial Suppliers",
		vendorType: "PO Based",
		companyCode: "0080 - BLR",
		region: "South 1",
		status: "PENDING",
		createdBy: "THCM Employee",
		createdDate: "2026-07-04",
	},
	{
		id: "vendor-onboarding-002",
		vendorCode: "VND-1002",
		vendorName: "Shakti Engineering Works",
		vendorType: "Non PO Based",
		companyCode: "0070 - KGP",
		region: "East",
		status: "APPROVED",
		createdBy: "Current User",
		createdDate: "2026-07-05",
	},
	{
		id: "vendor-onboarding-003",
		vendorCode: "VND-1003",
		vendorName: "Dharwad Logistics Partner",
		vendorType: "PO Based",
		companyCode: "0091 - DWD",
		region: "Dharwad",
		status: "CLARIFICATION",
		createdBy: "THCM Employee",
		createdDate: "2026-07-06",
	},
];

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

	// Union Territories
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
