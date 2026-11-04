import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { vendorContent } from "../utils/vendor.content";
import type { VendorListingFilter } from "../types/vendorListing.types";
import type { Option } from "../../../components/forms/input.types";

// Tab labels / tooltips live in content/vendor.content.en.json -> listing.filterTabs.*
// The dropdown option lists further down are SAP master data (stored values),
// not UI copy, so they intentionally stay here.
const tabs = vendorContent.listing.filterTabs;

export const VENDOR_ONBOARDING_FILTER_TABS = [
	{
		value: "pendingOnMe",
		label: tabs.pendingOnMe.label,
		shortLabel: tabs.pendingOnMe.shortLabel,
		tooltipLabel: tabs.pendingOnMe.tooltipLabel,
		Icon: Clock3,
	},
	{
		value: "onboarding",
		label: tabs.created.label,
		shortLabel: tabs.created.shortLabel,
		tooltipLabel: tabs.created.tooltipLabel,
		Icon: ShieldCheck,
	},

	{
		value: "approvedByMe",
		label: tabs.approvedByMe.label,
		shortLabel: tabs.approvedByMe.shortLabel,
		tooltipLabel: tabs.approvedByMe.tooltipLabel,
		Icon: CheckCircle2,
	},
] as const satisfies ReadonlyArray<{
	value: VendorListingFilter;
	label: string;
	shortLabel: string;
	tooltipLabel: string;
	Icon: typeof ShieldCheck;
}>;

// Tabs for external (TCS) users: Pending on me + Approved by me, with the
// second one shown as "Completed". The value stays "approvedByMe", so the
// API / query params are unchanged — only the visible copy differs.
// TODO: move these strings into vendor.content.en.json -> listing.filterTabs.
export const VENDOR_EXTERNAL_FILTER_TABS = [
	VENDOR_ONBOARDING_FILTER_TABS[0],
	{
		...VENDOR_ONBOARDING_FILTER_TABS[2],
		label: "Completed",
		shortLabel: "Completed",
		tooltipLabel: "View vendor onboarding requests I have completed",
	},
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
