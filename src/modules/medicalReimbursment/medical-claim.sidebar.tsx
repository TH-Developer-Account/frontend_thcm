import { BriefcaseMedical } from "lucide-react";
import type { SidebarItem } from "../../layout/layout.types";
//initiation/listing
export const medicalClaimSidebar: SidebarItem[] = [
	{
		id: "form-listing",
		label: "Medical Re-imbursement Listing",
		icon: <BriefcaseMedical size={18} />,
		link: "/medical-claim/form/listing",
	},
	{
		id: "form-initiation-create",
		label: "Medical Re-imbursement Create",
		icon: <BriefcaseMedical size={18} />,
		link: "/medical-claim/initiation/create",
	},
	{
		id: "form-create",
		label: "Medical Re-imbursement Form Create",
		icon: <BriefcaseMedical size={18} />,
		link: "/medical-claim/form/create",
	},
	{
		id: "form-view",
		label: "Medical Re-imbursement Form View",
		icon: <BriefcaseMedical size={18} />,
		link: "/medical-claim/form/view",
	},
];
