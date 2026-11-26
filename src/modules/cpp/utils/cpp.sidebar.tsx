import { FilePlusCorner, Table, Users } from "lucide-react";
import type { SidebarItem } from "../../../layout/layout.types";

export const cppSidebar: SidebarItem[] = [
	{
		id: "cpp-listing",
		label: "Dashboard",
		icon: <Table size={18} />,
		link: "/cpp/listing",
	},
	{
		id: "cpp-create",
		label: "Create CPP Request",
		icon: <FilePlusCorner size={18} />,
		link: "/cpp/create",
	},
	{
		// Visible to everyone for now; the API itself needs write access on
		// the CPP_APPROVAL_MATRIX module, so other users just get "forbidden".
		id: "cpp-approval-matrix",
		label: "Approval Matrix",
		icon: <Users size={18} />,
		link: "/cpp/approval-matrix",
	},
];
