import { BriefcaseMedical } from "lucide-react";
import type { SidebarItem } from "../../layout/layout.types";

export const medicalClaimSidebar: SidebarItem[] = [
	{
		id: "form",
		label: "Medical Re-imbursement Form",
		icon: <BriefcaseMedical size={18} />,
		link: "/medical-claim/form/create",
	},
	{
		id: "form",
		label: "Medical Re-imbursement Form View",
		icon: <BriefcaseMedical size={18} />,
		link: "/medical-claim/form/view",
	},
];
