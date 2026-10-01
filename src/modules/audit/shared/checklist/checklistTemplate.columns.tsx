// modules/audit/shared/checklist/checklistTemplate.columns.tsx
//
// Column definitions for the checklist-template data table. Shared by
// Dealer and Factory libraries; module-specific columns (facility type,
// plant …) are injected via `fieldColumns`.
//
// Column ids for sortable columns MUST match AuditTemplateSortField —
// the page maps TanStack SortingState → server sort params by id.

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../../components/common/ActionMenu";
import { Badge } from "../../../../components/common/Badge";
import { formatDateTime } from "../../../../utils/format";
import {
	getTemplateStatusBadgeVariant,
	getTemplateStatusLabel,
} from "../templates/audit-template.status";
import type {
	AuditTemplateListRow,
	AuditTemplateSortField,
} from "../templates/audit.template.types";

export interface AuditTemplateFieldColumn {
	/** Key into AuditTemplateListRow.fieldLabels */
	key: string;
	header: string;
}

export interface AuditTemplateRowActions {
	onView: (row: AuditTemplateListRow) => void;
	onEdit: (row: AuditTemplateListRow) => void;
	onDelete: (row: AuditTemplateListRow) => void;
	canEdit: boolean;
	canDelete: boolean;
}

export const SORTABLE_TEMPLATE_COLUMNS: readonly AuditTemplateSortField[] = [
	"name",
	"status",
	"version",
	"updatedAt",
];

export const isSortableTemplateColumn = (
	columnId: string,
): columnId is AuditTemplateSortField =>
	SORTABLE_TEMPLATE_COLUMNS.some((field) => field === columnId);

const numberMeta = { align: "right" as const };

export function createAuditTemplateColumns({
	fieldColumns,
	actions,
}: {
	fieldColumns: readonly AuditTemplateFieldColumn[];
	actions: AuditTemplateRowActions;
}): ColumnDef<AuditTemplateListRow>[] {
	const menuItems: ActionMenuItem<AuditTemplateListRow>[] = [
		{ id: "view", label: "View", Icon: Eye, onClick: actions.onView },
		{
			id: "edit",
			label: "Edit",
			Icon: Pencil,
			hidden: !actions.canEdit,
			onClick: actions.onEdit,
		},
		{
			id: "delete",
			label: "Delete",
			Icon: Trash2,
			variant: "danger",
			hidden: !actions.canDelete,
			onClick: actions.onDelete,
		},
	];

	return [
		{
			id: "name",
			accessorKey: "name",
			header: "Template",
			cell: ({ row }) => (
				<div className="min-w-56 max-w-md">
					<p className="truncate font-semibold text-(--color-text-primary)">
						{row.original.name}
					</p>
					{row.original.description ? (
						<p
							className="line-clamp-1 text-xs text-(--color-text-secondary)"
							title={row.original.description}
						>
							{row.original.description}
						</p>
					) : null}
				</div>
			),
		},
		...fieldColumns.map<ColumnDef<AuditTemplateListRow>>((column) => ({
			id: `field-${column.key}`,
			header: column.header,
			enableSorting: false,
			cell: ({ row }) => row.original.fieldLabels[column.key] || "--",
		})),
		{
			id: "status",
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<Badge
					status={row.original.status.toLowerCase()}
					variant={getTemplateStatusBadgeVariant(row.original.status)}
					text={`● ${getTemplateStatusLabel(row.original.status)}`}
				/>
			),
		},
		{
			id: "sectionCount",
			accessorKey: "sectionCount",
			header: "Sections",
			enableSorting: false,
			meta: numberMeta,
		},
		{
			id: "parameterCount",
			accessorKey: "parameterCount",
			header: "Parameters",
			enableSorting: false,
			meta: numberMeta,
		},
		{
			id: "totalPoints",
			accessorKey: "totalPoints",
			header: "Max points",
			enableSorting: false,
			meta: numberMeta,
		},
		{
			id: "version",
			accessorKey: "version",
			header: "Version",
			meta: numberMeta,
			cell: ({ row }) => `v${row.original.version}`,
		},
		{
			id: "updatedAt",
			accessorKey: "updatedAt",
			header: "Last updated",
			cell: ({ row }) => (
				<div className="whitespace-nowrap">
					<p>{row.original.updatedAt ? formatDateTime(row.original.updatedAt) : "--"}</p>
					{row.original.updatedByName ? (
						<p className="text-xs text-(--color-text-secondary)">
							by {row.original.updatedByName}
						</p>
					) : null}
				</div>
			),
		},
		{
			id: "actions",
			header: () => <span className="sr-only">Actions</span>,
			enableSorting: false,
			meta: { align: "right" as const },
			cell: ({ row }) => (
				// Keep menu clicks from triggering the row's "view" navigation.
				<div
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => event.stopPropagation()}
				>
					<ActionMenu
						row={row.original}
						actions={menuItems}
						size="sm"
						ariaLabel={`Actions for ${row.original.name}`}
					/>
				</div>
			),
		},
	];
}
