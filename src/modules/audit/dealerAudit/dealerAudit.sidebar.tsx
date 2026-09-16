import {
	Home,
	Settings,
	Table,
	ClipboardList,
	LayoutDashboard,
	FilePlus,
	FileCheck2,
	Building2,
	PlayCircle,
	ListChecks,
	ScanLine,
} from "lucide-react";

import type { SidebarItem } from "../../../layout/layout.types";
import { DEALER_AUDIT_ROUTES } from "./dealer-audit.routes";

const DEMO_AUDIT_ID = "AUD-001";
const DEMO_ITEM_ID = "showroom-cleanliness";

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
		permission: {
			app: "MAP",
			module: "DealerAudit",
			action: "read",
		},
	},

	{
		id: "checklist",
		label: "Checklist",
		icon: <ClipboardList size={20} />,
		link: DEALER_AUDIT_ROUTES.template.root,
		permission: {
			app: "MAP",
			module: "DealerAudit",
			action: "read",
		},
		children: [
			{
				id: "checklist-list",
				label: "Checklist Listing",
				link: DEALER_AUDIT_ROUTES.template.list,
				icon: <Table size={18} />,
				permission: {
					app: "MAP",
					module: "DealerAudit",
					action: "read",
				},
			},
			{
				id: "checklist-create",
				label: "Create Checklist",
				link: DEALER_AUDIT_ROUTES.template.create,
				icon: <FilePlus size={18} />,
				permission: {
					app: "MAP",
					module: "DealerAudit",
					action: "write",
				},
			},
		],
	},

	// Temporary demo audit execution links.
	{
		id: "audit-execution",
		label: "Audit Execution",
		icon: <PlayCircle size={20} />,
		link: DEALER_AUDIT_ROUTES.execution.checklist(DEMO_AUDIT_ID),
		permission: {
			app: "MAP",
			module: "DealerAudit",
			action: "read",
		},
		children: [
			{
				id: "audit-checklist",
				label: "Audit Checklist",
				link: DEALER_AUDIT_ROUTES.execution.checklist(DEMO_AUDIT_ID),
				icon: <ListChecks size={18} />,
				permission: {
					app: "MAP",
					module: "DealerAudit",
					action: "read",
				},
			},
			{
				id: "audit-item-demo",
				label: "Audit Item",
				link: DEALER_AUDIT_ROUTES.execution.item(DEMO_AUDIT_ID, DEMO_ITEM_ID),
				icon: <ScanLine size={18} />,
				permission: {
					app: "MAP",
					module: "DealerAudit",
					action: "read",
				},
			},
		],
	},

	{
		id: "audit-reports",
		label: "Audit Reports",
		icon: <FileCheck2 size={20} />,
		link: DEALER_AUDIT_ROUTES.reports.root,
		permission: {
			app: "MAP",
			module: "DealerAudit",
			action: "read",
		},
	},
	{
		id: "dealers",
		label: "Dealers",
		icon: <Building2 size={20} />,
		link: DEALER_AUDIT_ROUTES.dealers.root,
		permission: {
			app: "MAP",
			module: "Dealers",
			action: "read",
		},
	},
	{
		id: "settings",
		label: "Settings",
		icon: <Settings size={20} />,
		link: DEALER_AUDIT_ROUTES.profile,
	},
];
