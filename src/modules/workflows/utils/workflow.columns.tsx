import type { ColumnDef } from "@tanstack/react-table";
import moment from "moment-timezone";
import { Edit, Trash, UserPlus } from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";

import type { WorkflowRow } from "../types/types";

type WorkflowColumnActions = {
	onAssign: (workflow: WorkflowRow) => void;
	onEdit: (workflow: WorkflowRow) => void;
	onDelete: (workflow: WorkflowRow) => void;
};

const formatWorkflowDate = (value: WorkflowRow["lastUpdated"]): string => {
	if (!value) return "—";

	const date = moment(value);

	return date.isValid() ? date.format("L") : "—";
};

/**
 * Only application/admin templates can be assigned to other users.
 *
 * USER templates are automatically owned by their creator and do not need
 * user assignment.
 *
 * Unknown ownerType values are treated safely as non-assignable until the
 * backend returns the field.
 */
const canAssignUsers = (workflow: WorkflowRow): boolean =>
	workflow.ownerType === "ADMIN";

export const getWorkflowColumns = ({
	onAssign,
	onEdit,
	onDelete,
}: WorkflowColumnActions): ColumnDef<WorkflowRow>[] => [
	{
		accessorKey: "name",
		header: "Workflow Name",
		cell: ({ row }) => (
			<div className="workflow-table-primary">{row.original.name || "—"}</div>
		),
	},
	{
		accessorKey: "appName",
		header: "App Name",
		cell: ({ row }) => (
			<div className="workflow-table-primary">
				{row.original.appName || "—"}
			</div>
		),
	},
	{
		accessorKey: "createdBy",
		header: "Created By",
		cell: ({ row }) => (
			<div className="workflow-table-primary">
				{row.original.createdBy || "—"}
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
		accessorKey: "lastUpdated",
		header: "Last Updated",
		cell: ({ row }) => (
			<div className="workflow-table-primary">
				{formatWorkflowDate(row.original.lastUpdated)}
			</div>
		),
	},
	{
		accessorKey: "updatedBy",
		header: "Updated By",
		cell: ({ row }) => (
			<div className="workflow-table-primary">
				{row.original.updatedBy || "—"}
			</div>
		),
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => {
			const workflow = row.original;
			const showAssignUsers = canAssignUsers(workflow);

			return (
				<div className="workflow-table-actions">
					{showAssignUsers && (
						<Button
							type="button"
							size="sm"
							appearance="icon"
							variant="secondary"
							onClick={() => onAssign(workflow)}
							Icon={UserPlus}
							isTooltip="Assign Users"
						/>
					)}

					<Button
						type="button"
						size="sm"
						appearance="icon"
						variant="secondary"
						onClick={() => onEdit(workflow)}
						Icon={Edit}
						isTooltip="Edit"
					/>

					<Button
						type="button"
						size="sm"
						appearance="icon"
						variant="secondary"
						onClick={() => onDelete(workflow)}
						Icon={Trash}
						isTooltip="Delete"
					/>
				</div>
			);
		},
	},
];
