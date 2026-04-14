import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash } from "lucide-react";
import type { WorkflowRow } from "../types/workflow.types";
import { Badge } from "../../../../components/common/Badge";
import Button from "../../../../components/common/Button";

export const columns: ColumnDef<WorkflowRow>[] = [
	{
		accessorKey: "name",
		header: "Workflow Name",
		cell: ({ row }) => {
			return (
				<div>
					<div className="font-medium">{row.original.name}</div>
				</div>
			);
		},
	},
	{
		accessorKey: "app_name",
		header: "App Name",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.app_name}</div>
			</div>
		),
	},
	{
		accessorKey: "created_by",
		header: "Created By",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">${row.original.created_by}</div>
			</div>
		),
	},
	{
		accessorKey: "isActive",
		header: "Status",
		cell: ({ row }) => (
			<Badge status={row.original.isActive ? "Active" : "Inactive"}>
				{row.original.isActive ? "Active" : "Inactive"}
			</Badge>
		),
	},
	{
		accessorKey: "last_updated",
		header: "Last Updated",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.last_updated}</div>
			</div>
		),
	},
	{
		accessorKey: "updated_by",
		header: "Updated By",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.updated_by}</div>
			</div>
		),
	},
	{
		accessorKey: "actions",
		header: "Actions",
		cell: () => (
			<div className="flex flex-row justify-start">
				<div className="font-medium">
					<Button
						type="submit"
						className="bg-transparent  text-orange-900"
						Icon={Edit}
						iconPosition="right"
						iconColor="#f35a00"
					/>
				</div>
				<div className="font-medium">
					<Button
						type="submit"
						className="bg-transparent  text-orange-900"
						Icon={Trash}
						iconPosition="right"
						iconColor="#f35a00"
					/>
				</div>
			</div>
		),
	},
];
