import {
	FileText,
	Hospital,
	Megaphone,
	MonitorCog,
	UserCheck,
} from "lucide-react";

export const actions = [
	{
		icon: Megaphone,
		title: "Marketing Activity Planner",
		description: "Plan, track, and approve marketing events and campaigns.",
		path: "/marketing/activity-planner/listing",
		appKey: "MAP",
		isActive: true,
	},

	{
		icon: FileText,
		title: "Vendor Onboarding",
		description: "Submit, review, and process dealer reimbursements.",
		path: "/vendor/onboarding/listing",
		appKey: "VENDOR_ONBOARDING",
		isActive: false,
	},

	{
		icon: Hospital,
		title: "Medical Forms",
		description: "Configure and compare machinery specs for customer needs.",
		path: "/medi-claim/listing",
		appKey: "MEDICAL_CLAIM",
		isActive: false,
	},
	{
		icon: UserCheck,
		title: "Workflows",
		description:
			"Manage vendor registration, verification, and approval processes.",
		path: "/workflow/listing",
		appKey: "WORKFLOW",
		isActive: false,
	},
	{
		icon: MonitorCog,
		title: "Administrator",
		description: "System config, user roles, and access management.",
		path: "/admin/users",
		appKey: "ADMIN",
		isActive: false,
	},
] as const;
