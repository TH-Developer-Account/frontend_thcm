import type { ColumnDef } from "@tanstack/react-table";
import moment from "moment-timezone";
import { Edit, Eye, Trash, UserPlus } from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";

import type { WorkflowRow } from "../types/types";

type WorkflowColumnActions = {
	onAssign: (workflow: WorkflowRow) => void;
	onEdit: (workflow: WorkflowRow) => void;
	onDelete: (workflow: WorkflowRow) => void;
	onView: (workflow: WorkflowRow) => void;
};

// Admin templates (ownerType "ADMIN", or missing/unrecognized — fail
// closed toward view-only rather than accidentally editable) can only be
// viewed. Only a user's own templates (ownerType "USER") are editable.
const isEditableTemplate = (workflow: WorkflowRow): boolean =>
	workflow.ownerType === "USER";

const formatWorkflowDate = (value: WorkflowRow["lastUpdated"]): string => {
	if (!value) return "—";

	const date = moment(value);

	return date.isValid() ? date.format("L") : "—";
};

export const getWorkflowColumns = ({
	onAssign,
	onEdit,
	onDelete,
	onView,
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
			const editable = isEditableTemplate(workflow);

			const actions: ActionMenuItem<WorkflowRow>[] = [
				{
					id: "assign",
					label: "Assign Users",
					Icon: UserPlus,
					onClick: onAssign,
					hidden: editable, // only applicable to admin templates, not self-assigned USER templates
				},
				{
					id: "edit",
					label: "Edit",
					Icon: Edit,
					onClick: onEdit,
					hidden: !editable,
				},
				{
					id: "delete",
					label: "Delete",
					Icon: Trash,
					onClick: onDelete,
					hidden: !editable,
					variant: "danger",
				},
				{
					id: "view",
					label: "View",
					Icon: Eye,
					onClick: onView,
					hidden: editable,
				},
			];

			return (
				<ActionMenu<WorkflowRow>
					row={workflow}
					actions={actions}
					ariaLabel={`Actions for ${workflow.name || "workflow"}`}
				/>
			);
		},
	},
];
