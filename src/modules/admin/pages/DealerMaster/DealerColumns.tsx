// modules/users/columns.tsx

import type { ColumnDef } from "@tanstack/react-table";
import type { Dealer } from "./common.types";
// import { statusStyles } from "./common.types";
// import Avatar from "../../../../components/common/Avatar";

export const dealerListColumns: ColumnDef<Dealer>[] = [
	{ accessorKey: "dealerName", header: "Dealer Name" },
	{ accessorKey: "dealerCode", header: "Dealer Code" },
	{ accessorKey: "location", header: "Location" },
	{ accessorKey: "state", header: "State" },
	{ accessorKey: "region", header: "Region" },
	{ accessorKey: "contactPerson", header: "Contact Person" },
	{ accessorKey: "contactNumber", header: "Contact Number" },
	{ accessorKey: "status", header: "Status" },
];
