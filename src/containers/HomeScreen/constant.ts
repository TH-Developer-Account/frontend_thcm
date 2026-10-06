import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Hospital,
  Megaphone,
  MonitorCog,
  UserCheck,
} from "lucide-react";

// Who may see a tile: an app's users, every signed-in user, or anyone with
// administration rights (super admin or admin of at least one app).
export type HomeActionAccess =
  | { kind: "app"; appKey: string }
  | { kind: "everyone" }
  | { kind: "administration" };

export type HomeAction = {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  access: HomeActionAccess;
  isActive: boolean;
};

export const actions: HomeAction[] = [
  {
    icon: Megaphone,
    title: "Marketing Activity Planner",
    description: "Plan, track, and approve marketing events and campaigns.",
    path: "/marketing/activity-planner/listing",
    access: { kind: "app", appKey: "MAP" },
    isActive: false,
  },
  {
    icon: FileText,
    title: "Vendor Onboarding",
    description: "Submit, review, and process dealer reimbursements.",
    path: "/vendor/onboarding/listing",
    access: { kind: "app", appKey: "VENDOR_ONBOARDING" },
    isActive: false,
  },
  {
    icon: Hospital,
    title: "Medical Forms",
    description: "Configure and compare machinery specs for customer needs.",
    path: "/medi-claim/listing",
    access: { kind: "app", appKey: "MEDICAL_CLAIM" },
    isActive: false,
  },
  {
    icon: UserCheck,
    title: "Workflows",
    description:
      "Manage vendor registration, verification, and approval processes.",
    path: "/workflow/listing",
    access: { kind: "everyone" },
    isActive: false,
  },
  {
    icon: MonitorCog,
    title: "Administrator",
    description: "System config, user roles, and access management.",
    path: "/admin/users",
    access: { kind: "administration" },
    isActive: false,
  },
];
