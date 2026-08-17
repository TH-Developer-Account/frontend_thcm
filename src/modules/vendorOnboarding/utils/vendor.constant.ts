import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import type { VendorListingFilter } from "../types/vendorListing.types";
import type { Option } from "../../../components/forms/input.types";

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

const toSelectOptions = (values: string[]): Option[] =>
	values.map((value) => ({
		label: value,
		value,
	}));

export const yesNoOptions = toSelectOptions(["Yes", "No"]);

export const vendorTypeOptions = toSelectOptions([
	"PO Based",
	"Non PO Based",
	"Not Applicable",
]);

export const companyCodeOptions = toSelectOptions([
	"0070 - KGP",
	"0080 - BLR",
	"0091 - DWD",
	"Extension",
]);

export const purchaseOrgOptions = toSelectOptions([
	"P501 - Direct Purchase",
	"P502 - Indirect Purchase",
	"P503 - Capital Purchase",
	"P504 - External Services",
	"P505 - Stock Transport",
	"P506 - Spare Part Purchase",
	"P507 - ASCS Warranty Purch",
	"P509 - Free Job Work PO",
	"P510 - Machine Purchase UEB",
	"Not Applicable",
]);
export const paymentTermOptions = toSelectOptions([
	"AP01 - Payment immediately on Receipt & Acceptance.",
	"AP02 - Payment on 30 days from GR based on acceptance.",
	"AP03 - Payment on 45 days from GR based on acceptance.",
	"AP04 - Payment on 60 days from GR based on acceptance.",
	"AP05 - Payment on 15 days from GR based on acceptance.",
	"AP21 - Immediate Payment on Receipt of Invoice",
	"AP22 - Payment on 15 days from date of Invoice",
	"AP23 - Payment on 30 days from date of Invoice",
	"AP25 - Immediate payment with Payment Block-A",
	"PC30 - Payment on 30 days credit from the B/L date",
	"AP36 - 100% Advance against PO",
	"AP31 - 10% Advance against PO, balance on 30 days from GR",
	"AP32 - 25% Advance against PO, balance on 30 days from GR",
	"AP33 - 50% Advance against PO, balance on 30 days from GR",
	"AP34 - 75% Advance against PO, balance on 30 days from GR",
	"AP35 - 90% Advance against PO, balance on 30 days from GR",
	"AP37 - 25% Advance against PO, and the rest against proforma invoice",
	"AP41 - 10% of invoice submitted, balance on 30 days",
	"AP42 - 25% of invoice submitted, balance on 30 days",
	"AP43 - 50% of invoice submitted, balance on 30 days",
	"AP44 - 75% of invoice submitted, balance on 30 days",
	"AP45 - 90% of invoice submitted, balance on 30 days",
	"AP46 - 100% of invoice submitted",
	"AP26 - Payment on 25 days from date of Invoice",
	"AP27 - Payment on 60 days from date of Invoice",
	"AP15 - 100% T/T – 30 days from the date of B/L (Imports only)",
	"AP16 - 60 days credit from the B/L date",
	"AP51 - 10% of invoice on GR, balance on 30 days from GR",
	"AP10 - 100% on 30 days BMS, against accepted Hundi",
	"AP11 - 100% on 45 days BMS, against accepted Hundi",
	"AP12 - 100% on 60 days BMS, against accepted Hundi",
	"AP13 - 100% on 90 days BMS, against accepted Hundi",
	"AP14 - 100% on 75 days BMS, against accepted Hundi",
	"AP52 - 25% of invoice on GR, balance on 30 days from GR",
	"AP53 - 50% of invoice on GR, balance on 30 days from GR",
	"AP54 - 75% of invoice on GR, balance on 30 days from GR",
	"AP55 - 90% of invoice on GR, balance on 30 days from GR",
	"AP56 - 100% of invoice on receipt of material",
	"AP57 - 100% advance against document through bank",
	"AP58 - 100% advance against invoice, payment through L/C",
	"AP59 - 20% advance against PO, 70% against delivery, and balance on commissioning",
	"AP60 - 20% advance with PO and balance against proforma invoice",
]);
export const tdsOptions = toSelectOptions([
	"194C - Contractors (2%)",
	"194C - Contractors (1%)",
	"194J - Professional Fees (10%)",
	"194J - Technical Fees (2%)",
	"194I - Rent (10%)",
	"194I - Rent - Machine (2%)",
	"194H - Brokerage & Commission (2%)",
	"194H - Brokerage & Commission - Non Filer (10%)",
	"194Q - Supply of Material - IV (0.10%)",
]);

export const vendorCategoryOptions = toSelectOptions([
	"Material",
	"Parts",
	"Service",
	"Capital",
	"Capital Services",
	"Not Applicable",
]);

export const materialTypeOptions = toSelectOptions([
	"1 - Direct",
	"2 - Indirect",
	"Not Applicable",
]);

export const materialSubTypeOptions = toSelectOptions([
	"1 - Proprietary",
	"2 - Non-Proprietary",
	"Not Applicable",
]);
