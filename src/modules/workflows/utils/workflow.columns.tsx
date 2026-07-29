import type { ColumnDef } from "@tanstack/react-table";
import moment from "moment-timezone";
import { Edit, Trash, UserPlus } from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import type { WorkflowRow } from "../types/types";

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
		cell: ({ row }) => (
			<div className="workflow-table-primary">{row.original.name}</div>
		),
	},
	{
		accessorKey: "appName",
		header: "App Name",
		cell: ({ row }) => (
			<div className="workflow-table-primary">{row.original.appName}</div>
		),
	},
	{
		accessorKey: "createdBy",
		header: "Created By",
		cell: ({ row }) => (
			<div className="workflow-table-primary">{row.original.createdBy}</div>
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
		accessorKey: "lastUpdated",
		header: "Last Updated",
		cell: ({ row }) => (
			<div className="workflow-table-primary">
				{moment(row.original.lastUpdated).format("L")}
			</div>
		),
	},
	{
		accessorKey: "updatedBy",
		header: "Updated By",
		cell: ({ row }) => (
			<div className="workflow-table-primary">{row.original.updatedBy}</div>
		),
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => (
			<div className="workflow-table-actions">
				<Button
					size="sm"
					appearance="icon"
					variant="secondary"
					onClick={() => onAssign(row.original)}
					Icon={UserPlus}
					isTooltip="Assign Users"
				/>
				<Button
					type="button"
					onClick={() => onEdit(row.original)}
					Icon={Edit}
					appearance="icon"
					variant="secondary"
					isTooltip="Edit"
				/>
				<Button
					type="button"
					onClick={() => onDelete(row.original)}
					Icon={Trash}
					appearance="icon"
					variant="secondary"
					isTooltip="Delete"
				/>
			</div>
		),
	},
];
