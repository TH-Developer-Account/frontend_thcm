import type { ColumnDef } from "@tanstack/react-table";
import moment from "moment-timezone";
import { Edit, Trash, UserPlus } from "lucide-react";
import type { WorkflowRow } from "../types/workflow.types";
import { Badge } from "../../../../components/common/Badge";
import Button from "../../../../components/common/Button";

type WorkflowColumnActions = {
	onAssign: (row: WorkflowRow) => void;
	onEdit: (row: WorkflowRow) => void;
	onDelete: (row: WorkflowRow) => void;
};

export const getWorkflowColumns = ({
	onAssign,
	onEdit,
	onDelete,
}: WorkflowColumnActions): ColumnDef<WorkflowRow>[] => [
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
				<div className="font-medium">{row.original.created_by}</div>
			</div>
		),
	},
	{
		accessorKey: "isActive",
		header: "Status",
		cell: ({ row }) => (
			<Badge status={row.original.isActive ? "active" : "inactive"}>
				{row.original.isActive ? "Active" : "Inactive"}
			</Badge>
		),
	},
	{
		accessorKey: "last_updated",
		header: "Last Updated",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">
					{moment(row.original.last_updated).format("L")}
				</div>
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
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			const workflow = row.original;
			return (
				<div className="flex flex-row justify-start gap-2">
					<Button
						size="sm"
						status="primary"
						onClick={() => onAssign(workflow)}
						Icon={UserPlus}
						isTooltip="Assign Users"
						iconColor="#f35a00"
					/>

					<Button
						type="button"
						className="bg-transparent text-orange-900"
						onClick={() => onEdit(workflow)}
						Icon={Edit}
						iconPosition="right"
						iconColor="#f35a00"
						isTooltip="Edit"
					/>

					<Button
						type="button"
						className="bg-transparent text-orange-900"
						onClick={() => onDelete(workflow)}
						Icon={Trash}
						iconPosition="right"
						iconColor="#f35a00"
						isTooltip="Delete"
					/>
				</div>
			);
		},
	},
];
