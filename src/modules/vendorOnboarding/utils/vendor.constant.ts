import { ListChecks, ShieldCheck } from "lucide-react";
import type { VendorInitiationStatus } from "../types/vendorListing.types";

export const VENDOR_INITIATION_STATUS_CONFIG: Partial<
  Record<
    VendorInitiationStatus,
    {
      label: string;
      className: string;
    }
  >
> = {
  AWAITING_VENDOR: {
    label: "Awaiting Vendor",
    className: "vendor-listing-status-pending",
  },
  VENDOR_SUBMITTED: {
    label: "Vendor Submitted",
    className: "vendor-listing-status-approved",
  },
  IN_REVIEW: {
    label: "In Review",
    className: "vendor-listing-status-pending",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "vendor-listing-status-pending",
  },
  CLOSED: {
    label: "Closed",
    className: "vendor-listing-status-closed",
  },
};

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
  {
    value: "pendingOnMe",
    label: "Approval Pending on Me",
    tooltipLabel: "View vendor onboarding records that are pending on me.",
    Icon: ShieldCheck,
  },
  {
    value: "approvedByMe",
    label: "Approved by Me",
    tooltipLabel: "View vendor onboarding records approved by me.",
    Icon: ShieldCheck,
  },
] as const;

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
