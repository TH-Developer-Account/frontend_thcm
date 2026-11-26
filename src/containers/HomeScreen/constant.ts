// Target: containers/HomeScreen/constant.ts
import type { LucideIcon } from "lucide-react";
import {
	BriefcaseMedical,
	CalendarDays,
	ClipboardPlus,
	Coins,
	FileText,
	Gift,
	GiftIcon,
	Handshake,
	Inspect,
	InspectIcon,
	Megaphone,
	MonitorCog,
	Network,
	ReceiptIndianRupee,
	Settings,
	Star,
	UserCheck,
	Zap,
} from "lucide-react";

// Who may see a tile: an app's users, every signed-in user, or anyone with
// administration rights (super admin or admin of at least one app).
export type HomeActionAccess =
	| { kind: "app"; appKey: string }
	| { kind: "everyone" }
	| { kind: "internal" }
	| { kind: "administration" };

/** Small pill in the card's top-right corner. */
export type HomeActionBadge = {
	label: string;
	icon: LucideIcon;
};

export type HomeAction = {
	icon: LucideIcon;
	/** Large faded illustration in the card's bottom-right corner. */
	decorIcon: LucideIcon;
	title: string;
	description: string;
	path: string;
	access: HomeActionAccess;
	isActive: boolean;
	/**
	 * Static highlight label. These are set by hand here, NOT computed from
	 * usage — change or remove them as the business decides.
	 */
	badge?: HomeActionBadge;
};

// Descriptions were corrected in Batch 13 (they had been copied between
// modules); confirm the wording with the module owners.
export const actions: HomeAction[] = [
	{
		icon: Megaphone,
		decorIcon: CalendarDays,
		title: "Marketing Activity Planner",
		description: "Plan, track, and approve marketing events and campaigns.",
		path: "/marketing/activity-planner/listing",
		access: { kind: "app", appKey: "MAP" },
		isActive: false,
		badge: { label: "Frequently used", icon: Star },
	},
	{
		icon: Gift,
		decorIcon: GiftIcon,
		title: "Handouts",
		description: "Request, approve, and track souvenir handouts.",
		path: "/handouts",
		access: { kind: "app", appKey: "HANDOUT" },
		isActive: false,
	},
	{
		icon: FileText,
		decorIcon: Handshake,
		title: "Vendor Onboarding",
		description: "Initiate, review, and approve new vendor registrations.",
		path: "/vendor-onboarding/listing",
		access: { kind: "app", appKey: "VENDOR_ONBOARDING" },
		isActive: false,
		badge: { label: "Quick access", icon: Zap },
	},
	{
		icon: BriefcaseMedical,
		decorIcon: ClipboardPlus,
		title: "Medical Forms",
		description: "Initiate, submit, and track medical reimbursement claims.",
		path: "/medi-claim/listing",
		access: { kind: "app", appKey: "MEDICAL_CLAIM" },
		isActive: false,
	},
	{
		icon: ReceiptIndianRupee,
		decorIcon: Coins,
		title: "Contract & Price Panel Committee",
		description:
			"Raise and track contract price approvals (CPP) with suppliers.",
		// No listing page yet — points at the create page until it exists.
		path: "/cpp/requests/create",
		access: { kind: "app", appKey: "CPP" },
		isActive: false,
	},
	{
		icon: UserCheck,
		decorIcon: Network,
		title: "Workflows",
		description: "Set up approval workflows, stages, and approvers.",
		path: "/workflow/listing",
		access: { kind: "everyone" },
		isActive: false,
	},
	{
		icon: MonitorCog,
		decorIcon: Settings,
		title: "Administrator",
		description: "System config, user roles, and access management.",
		path: "/admin/users",
		access: { kind: "administration" },
		isActive: false,
	},
	{
		icon: Inspect,
		decorIcon: InspectIcon,
		title: "Dealer Audit",
		description: "Audit for dealers.",
		path: "/audit/dealer/checklist/listing",
		access: { kind: "app", appKey: "DEALER_AUDIT" },
		isActive: false,
	},
] as const;
