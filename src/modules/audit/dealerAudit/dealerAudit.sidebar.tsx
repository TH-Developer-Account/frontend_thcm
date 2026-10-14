import {
	Building2,
	ClipboardCheck,
	ClipboardList,
	FileCheck2,
	FilePlus,
	Home,
	LayoutDashboard,
	ListChecks,
	Settings,
	Table,
} from "lucide-react";

import type { SidebarItem } from "../../../layout/layout.types";
import { DEALER_AUDIT_ROUTES } from "./dealer-audit.routes";

const READ = { app: "MAP", module: "DealerAudit", action: "read" } as const;
const WRITE = { app: "MAP", module: "DealerAudit", action: "write" } as const;

/**
 * Sidebar visibility is a convenience only. Page access is enforced by
 * DealerAuditGuard and, authoritatively, by the backend.
 */
export const dealerAuditSidebar: SidebarItem[] = [
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
		permission: READ,
	},
	{
		id: "audits",
		label: "Audits",
		icon: <ClipboardCheck size={20} />,
		link: DEALER_AUDIT_ROUTES.audits.root,
		permission: READ,
		children: [
			{
				id: "audits-list",
				label: "Audit Listing",
				link: DEALER_AUDIT_ROUTES.audits.list,
				icon: <ListChecks size={18} />,
				permission: READ,
			},
			{
				id: "audits-create",
				label: "Create Audit",
				link: DEALER_AUDIT_ROUTES.audits.create,
				icon: <FilePlus size={18} />,
				permission: WRITE,
			},
		],
	},
	{
		id: "checklist",
		label: "Checklist",
		icon: <ClipboardList size={20} />,
		link: DEALER_AUDIT_ROUTES.template.root,
		permission: READ,
		children: [
			{
				id: "checklist-list",
				label: "Checklist Listing",
				link: DEALER_AUDIT_ROUTES.template.list,
				icon: <Table size={18} />,
				permission: READ,
			},
			{
				id: "checklist-create",
				label: "Create Checklist",
				link: DEALER_AUDIT_ROUTES.template.create,
				icon: <FilePlus size={18} />,
				permission: WRITE,
			},
		],
	},
	{
		id: "audit-reports",
		label: "Audit Reports",
		icon: <FileCheck2 size={20} />,
		link: DEALER_AUDIT_ROUTES.reports.root,
		permission: READ,
	},
	{
		id: "dealers",
		label: "Dealers",
		icon: <Building2 size={20} />,
		link: DEALER_AUDIT_ROUTES.dealers.root,
		permission: { app: "MAP", module: "Dealers", action: "read" },
	},
	{
		id: "settings",
		label: "Settings",
		icon: <Settings size={20} />,
		link: DEALER_AUDIT_ROUTES.profile,
	},
];
