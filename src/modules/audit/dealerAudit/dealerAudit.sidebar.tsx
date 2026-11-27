import { useMemo } from "react";
import {
	ClipboardCheck,
	ClipboardList,
	FileCheck2,
	FilePlus,
	Gavel,
	Home,
	LayoutDashboard,
	ListChecks,
	Rocket,
	Table,
	UserCheck,
	Activity,
} from "lucide-react";

import type { SidebarItem } from "../../../layout/layout.types";
import type { DealerAuditPermissions } from "./dealer-audit.permissions";
import { DEALER_AUDIT_ROUTES } from "./dealer-audit.routes";
import { useDealerAuditSession } from "./hooks/useDealerAuditAccess";

type DealerAuditSidebarItem = Omit<SidebarItem, "children"> & {
	/** Page permission needed to show the item. */
	show?: keyof DealerAuditPermissions;
	children?: DealerAuditSidebarItem[];
};

/**
 * Sidebar visibility is a convenience only. Page access is enforced by
 * DealerAuditGuard and, authoritatively, by the backend.
 */
const dealerAuditSidebar: DealerAuditSidebarItem[] = [
	{
		id: "home",
		label: "Home",
		icon: <Home size={20} />,
		link: DEALER_AUDIT_ROUTES.home,
	},
	{
		id: "dashboard",
		label: "Dashboard",
		icon: <LayoutDashboard size={20} />,
		link: DEALER_AUDIT_ROUTES.dashboard,
		show: "canView",
	},
	{
		id: "my-audits",
		label: "My Audits",
		icon: <ClipboardCheck size={20} />,
		link: DEALER_AUDIT_ROUTES.myAudits,
		show: "canViewMyAudits",
	},
	{
		id: "review-queue",
		label: "Review Queue",
		icon: <UserCheck size={20} />,
		link: DEALER_AUDIT_ROUTES.reviewQueue,
		show: "canViewReviewQueue",
	},
	{
		id: "approvals",
		label: "Approvals",
		icon: <Gavel size={20} />,
		link: DEALER_AUDIT_ROUTES.approvals,
		show: "canViewApprovals",
	},
	{
		id: "tracker",
		label: "Audit Tracker",
		icon: <Activity size={20} />,
		link: DEALER_AUDIT_ROUTES.tracker,
		show: "canViewTracker",
	},
	{
		id: "audits",
		label: "Audits",
		icon: <ClipboardCheck size={20} />,
		link: DEALER_AUDIT_ROUTES.audits.root,
		show: "canViewAllAudits",
		children: [
			{
				id: "audits-list",
				label: "Audit Listing",
				link: DEALER_AUDIT_ROUTES.audits.list,
				icon: <ListChecks size={18} />,
				show: "canViewAllAudits",
			},
			{
				id: "cycles-create",
				label: "New Audit Cycle",
				link: DEALER_AUDIT_ROUTES.cycles.create,
				icon: <Rocket size={18} />,
				show: "canCreateAudit",
			},
			{
				id: "audits-create",
				label: "Create Single Audit",
				link: DEALER_AUDIT_ROUTES.audits.create,
				icon: <FilePlus size={18} />,
				show: "canCreateAudit",
			},
		],
	},
	{
		id: "checklist",
		label: "Checklist",
		icon: <ClipboardList size={20} />,
		link: DEALER_AUDIT_ROUTES.template.root,
		show: "canViewChecklists",
		children: [
			{
				id: "checklist-list",
				label: "Checklist Listing",
				link: DEALER_AUDIT_ROUTES.template.list,
				icon: <Table size={18} />,
				show: "canViewChecklists",
			},
			{
				id: "checklist-create",
				label: "Create Checklist",
				link: DEALER_AUDIT_ROUTES.template.create,
				icon: <FilePlus size={18} />,
				show: "canManageTemplates",
			},
		],
	},
	{
		id: "audit-reports",
		label: "Audit Reports",
		icon: <FileCheck2 size={20} />,
		link: DEALER_AUDIT_ROUTES.reports.root,
		show: "canDownloadReport",
	},
];

const filterSidebar = (
	items: DealerAuditSidebarItem[],
	permissions: DealerAuditPermissions,
): DealerAuditSidebarItem[] =>
	items
		.filter((item) => !item.show || permissions[item.show])
		.map((item) =>
			item.children
				? { ...item, children: filterSidebar(item.children, permissions) }
				: item,
		);

/** Sidebar items the current user is allowed to see. */
export function useDealerAuditSidebar(): SidebarItem[] {
	const { permissions } = useDealerAuditSession();
	return useMemo(
		() => filterSidebar(dealerAuditSidebar, permissions),
		[permissions],
	);
}
