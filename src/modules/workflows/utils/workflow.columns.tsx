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

	// Decided by useWorkflowPermissions().canEditWorkflow:
	//  - personal (USER) templates → editable
	//  - admin (shared) templates  → editable by the admin of that app only
	//  - anything else             → view-only
	canEdit: (workflow: WorkflowRow) => boolean;
};

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
	canEdit,
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
			const isPersonalTemplate = workflow.ownerType === "USER";

			const actions: ActionMenuItem<WorkflowRow>[] = [
				// View is read-only, so it's available for every workflow —
				// admin and user templates alike. Listed first as the
				// lowest-risk action.
				{
					id: "view",
					label: "View",
					Icon: Eye,
					onClick: onView,
					hidden: !workflow.id,
					variant: "danger",
				},
				{
					id: "assign",
					label: "Assign Users",
					Icon: UserPlus,
					onClick: onAssign,
					hidden: isPersonalTemplate, // only applicable to admin templates, not self-assigned USER templates
					variant: "danger",
				},
				{
					// Now shown for admin templates too (admin of that app / super
					// admin). Everyone else still gets view-only on admin templates.
					id: "edit",
					label: "Edit",
					Icon: Edit,
					onClick: onEdit,
					hidden: !canEdit(workflow),
					variant: "danger",
				},
				{
					// Unchanged: delete stays limited to personal templates.
					id: "delete",
					label: "Delete",
					Icon: Trash,
					onClick: onDelete,
					hidden: !isPersonalTemplate,
					variant: "danger",
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
