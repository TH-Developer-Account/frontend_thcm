import type { ColumnDef } from "@tanstack/react-table";
import moment from "moment-timezone";
import { Edit, Trash, UserPlus } from "lucide-react";
import type { WorkflowRow } from "../types/workflow.types";
import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";

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
			<Badge variant={row.original.isActive ? "active" : "inactive"}>
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
						appearance="icon"
						variant="secondary"
						onClick={() => onAssign(workflow)}
						Icon={UserPlus}
						isTooltip="Assign Users"
					/>

					<Button
						type="button"
						onClick={() => onEdit(workflow)}
						Icon={Edit}
						appearance="icon"
						variant="secondary"
						isTooltip="Edit"
					/>

					<Button
						type="button"
						onClick={() => onDelete(workflow)}
						Icon={Trash}
						appearance="icon"
						variant="secondary"
						isTooltip="Delete"
					/>
				</div>
			);
		},
	},
];
