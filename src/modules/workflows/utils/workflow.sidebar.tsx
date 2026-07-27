import { BriefcaseBusinessIcon } from "lucide-react";
import type { SidebarItem } from "../../../layout/layout.types";

export const workflowSidebar: SidebarItem[] = [
	{
		id: "listing",
		label: "Workflow Listing",
		icon: <BriefcaseBusinessIcon size={18} />,
		link: "/workflow/listing",
	},
	{
		id: "dynamicWorkflow",
		label: "Dynamic Workflow",
		icon: <BriefcaseBusinessIcon size={18} />,
		link: "/workflow/dynamic-create",
	},
];
