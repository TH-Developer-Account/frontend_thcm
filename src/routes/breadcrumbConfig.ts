import { matchPath } from "react-router-dom";
import type { BreadcrumbItem } from "../components/ui/PageNavigation/pageNavigation.types";

type BreadcrumbResolver = (
	params: Record<string, string | undefined>,
) => BreadcrumbItem[];

type BreadcrumbRoute = {
	pattern: string;
	getBreadcrumbs: BreadcrumbResolver;
};

// Keep in sync with the actual route declarations in AppRoutes/*Routes.tsx.
// Longest/most-specific patterns first so matchPath doesn't shadow a child route.
export const breadcrumbRoutes: BreadcrumbRoute[] = [
	// Vendor Onboarding
	{
		pattern: "/vendor-onboarding/:onboardingId/view",
		getBreadcrumbs: ({ onboardingId }) => [
			{ label: "Vendor Onboarding", href: "/vendor-onboarding/listing" },
			{
				label: "Vendor Details",
				href: onboardingId ? `/vendor-onboarding/${onboardingId}` : undefined,
			},
			{ label: "View" },
		],
	},
	{
		pattern: "/vendor-onboarding/:onboardingId",
		getBreadcrumbs: () => [
			{ label: "Vendor Onboarding", href: "/vendor-onboarding/listing" },
			{ label: "Vendor Details" },
		],
	},
	{
		pattern: "/vendor-onboarding/create",
		getBreadcrumbs: () => [
			{ label: "Vendor Onboarding", href: "/vendor-onboarding/listing" },
			{ label: "Create" },
		],
	},
	{
		pattern: "/vendor-onboarding/initiation/create",
		getBreadcrumbs: () => [
			{ label: "Vendor Onboarding", href: "/vendor-onboarding/listing" },
			{ label: "Initiate" },
		],
	},
	{
		pattern: "/vendor-onboarding/listing",
		getBreadcrumbs: () => [{ label: "Vendor Onboarding" }],
	},
	{
		pattern: "/vendor-onboarding/dashboard",
		getBreadcrumbs: () => [{ label: "Vendor Dashboard" }],
	},

	// Business Partners
	{
		pattern: "/admin/business-partners/:id/view",
		getBreadcrumbs: () => [
			{ label: "Business Partners", href: "/admin/business-partners" },
			{ label: "Partner Details" },
		],
	},
	{
		pattern: "/admin/business-partners/create",
		getBreadcrumbs: () => [
			{ label: "Business Partners", href: "/admin/business-partners" },
			{ label: "Create" },
		],
	},
	{
		pattern: "/admin/business-partners",
		getBreadcrumbs: () => [{ label: "Business Partners" }],
	},

	// Users
	{
		pattern: "/admin/users/create",
		getBreadcrumbs: () => [
			{ label: "Users", href: "/admin/users" },
			{ label: "Create" },
		],
	},
	{
		pattern: "/admin/users/:id",
		getBreadcrumbs: () => [
			{ label: "Users", href: "/admin/users" },
			{ label: "User Details" },
		],
	},
	{ pattern: "/admin/users", getBreadcrumbs: () => [{ label: "Users" }] },

	// Workflows
	{
		pattern: "/workflow/edit-workflows/:id",
		getBreadcrumbs: () => [
			{ label: "Workflows", href: "/workflow/listing" },
			{ label: "Workflow Details" },
			{ label: "Edit" },
		],
	},
	{
		pattern: "/workflow/create-workflows",
		getBreadcrumbs: () => [
			{ label: "Workflows", href: "/workflow/listing" },
			{ label: "Create" },
		],
	},
	{
		pattern: "/workflow/listing",
		getBreadcrumbs: () => [{ label: "Workflows" }],
	},

	// Medical Claims
	{
		pattern: "/medi-claim/initiation/:initiationId/view",
		getBreadcrumbs: () => [
			{ label: "Medical Claims", href: "/medi-claim/listing" },
			{ label: "Initiation", href: "/medi-claim/initiation/listing" },
			{ label: "Details" },
		],
	},
	{
		pattern: "/medi-claim/initiation/:initiationId",
		getBreadcrumbs: () => [
			{ label: "Medical Claims", href: "/medi-claim/listing" },
			{ label: "Initiation", href: "/medi-claim/initiation/listing" },
			{ label: "Details" },
		],
	},
	{
		pattern: "/medi-claim/initiation/create",
		getBreadcrumbs: () => [
			{ label: "Medical Claims", href: "/medi-claim/listing" },
			{ label: "Initiation", href: "/medi-claim/initiation/listing" },
			{ label: "Create" },
		],
	},
	{
		pattern: "/medi-claim/initiation/listing",
		getBreadcrumbs: () => [
			{ label: "Medical Claims", href: "/medi-claim/listing" },
			{ label: "Initiation" },
		],
	},
	{
		pattern: "/medi-claim/:id/view",
		getBreadcrumbs: () => [
			{ label: "Medical Claims", href: "/medi-claim/listing" },
			{ label: "Claim Details" },
		],
	},
	{
		pattern: "/medi-claim/listing",
		getBreadcrumbs: () => [{ label: "Medical Claims" }],
	},

	// Marketing / Activity Planner
	{
		pattern: "/marketing/activity-planner/leads/create",
		getBreadcrumbs: () => [
			{
				label: "Activity Planner",
				href: "/marketing/activity-planner/listing",
			},
			{ label: "Leads", href: "/marketing/activity-planner/leads/listing" },
			{ label: "Create" },
		],
	},
	{
		pattern: "/marketing/activity-planner/leads/view",
		getBreadcrumbs: () => [
			{
				label: "Activity Planner",
				href: "/marketing/activity-planner/listing",
			},
			{ label: "Leads", href: "/marketing/activity-planner/leads/listing" },
			{ label: "Details" },
		],
	},
	{
		pattern: "/marketing/activity-planner/leads/listing",
		getBreadcrumbs: () => [
			{
				label: "Activity Planner",
				href: "/marketing/activity-planner/listing",
			},
			{ label: "Leads" },
		],
	},
	{
		pattern: "/marketing/activity-planner/file-module/listing",
		getBreadcrumbs: () => [
			{
				label: "Activity Planner",
				href: "/marketing/activity-planner/listing",
			},
			{ label: "Files" },
		],
	},
	{
		pattern: "/marketing/activity-planner/create",
		getBreadcrumbs: () => [
			{
				label: "Activity Planner",
				href: "/marketing/activity-planner/listing",
			},
			{ label: "Create" },
		],
	},
	{
		pattern: "/marketing/activity-planner/:id",
		getBreadcrumbs: () => [
			{
				label: "Activity Planner",
				href: "/marketing/activity-planner/listing",
			},
			{ label: "Details" },
		],
	},
	{
		pattern: "/marketing/activity-planner/listing",
		getBreadcrumbs: () => [{ label: "Activity Planner" }],
	},
	{
		pattern: "/marketing/dashboard",
		getBreadcrumbs: () => [{ label: "Dashboard" }],
	},
];

export const resolveBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
	for (const route of breadcrumbRoutes) {
		const match = matchPath(route.pattern, pathname);
		if (match) {
			return route.getBreadcrumbs(match.params);
		}
	}
	return [];
};
