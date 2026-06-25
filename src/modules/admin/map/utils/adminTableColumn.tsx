import type { ColumnDef } from "@tanstack/react-table";
import type { BranchRow, DepartmentRow, ZoneRow } from "../types";
import { status } from "../constant";
import { Badge } from "../../../../components/common/Badge";

export const deptTableColumn: ColumnDef<DepartmentRow>[] = [
	{
		accessorKey: "department_code",
		header: "Department Code",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.department_code}</div>
			</div>
		),
	},
	{
		accessorKey: "department_name",
		header: "Department Name",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.department_name}</div>
			</div>
		),
	},
	{
		accessorKey: "dept_status",
		header: "Status",
		cell: ({ row }) => (
			<Badge
				status={
					status[(row.original.dept_status as keyof typeof status) || "Pending"]
				}
			/>
		),
	},
];
export const zoneTableColumn: ColumnDef<ZoneRow>[] = [
	{
		accessorKey: "zone_code",
		header: "Zone Code",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.zone_code}</div>
			</div>
		),
	},
	{
		accessorKey: "zone_name",
		header: "Zone Name",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.zone_name}</div>
			</div>
		),
	},
	{
		accessorKey: "zone_status",
		header: "Status",
		cell: ({ row }) => (
			<Badge
				status={
					status[(row.original.zone_status as keyof typeof status) || "Active"]
				}
			/>
		),
	},
];
export const branchTableColumn: ColumnDef<BranchRow>[] = [
	{
		accessorKey: "branch_code",
		header: "Branch Code",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.branch_code}</div>
			</div>
		),
	},
	{
		accessorKey: "branch_name",
		header: "Branch Name",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.branch_name}</div>
			</div>
		),
	},
	{
		accessorKey: "branch_status",
		header: "Status",
		cell: ({ row }) => (
			<Badge
				status={
					status[
						(row.original.branch_status as keyof typeof status) || "Active"
					]
				}
			/>
		),
	},
];
