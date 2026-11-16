import { FilePlusCorner, Table } from "lucide-react";
import type { SidebarItem } from "../../../layout/layout.types";

export const cppSidebar: SidebarItem[] = [
	{
		id: "cpp-listing",
		label: "Listing",
		icon: <Table size={18} />,
		link: "/cpp/listing",
	},
	{
		id: "cpp-create",
		label: "Create CPP Request",
		icon: <FilePlusCorner size={18} />,
		link: "/cpp/create",
	},
];
