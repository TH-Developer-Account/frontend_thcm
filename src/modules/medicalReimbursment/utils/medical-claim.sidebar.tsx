import { Table, FilePlusCorner } from "lucide-react";
import type { SidebarItem } from "../../../layout/layout.types";
export const medicalClaimSidebar: SidebarItem[] = [
	{
		id: "form-listing",
		label: " Listing",
		icon: <Table size={18} />,
		link: "/medi-claim/listing",
	},
	{
		id: "form-initiation-create",
		label: "Initiate Create",
		icon: <FilePlusCorner size={18} />,
		link: "/medi-claim/initiation/create",
	},
];
