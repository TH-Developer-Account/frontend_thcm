// modules/audit/shared/checklist/checklistTemplate.columns.tsx
//
// Column definitions for the checklist-template data table. Shared by
// Dealer and Factory libraries; module-specific columns (facility type,
// plant …) are injected via `fieldColumns`.
//
// Column ids for sortable columns MUST match AuditTemplateSortField —
// the page maps TanStack SortingState → server sort params by id.
//
// Row actions follow the template lifecycle ONLY when the module passes
// `onNewVersion` / `onArchive` (Dealer does). Without them the menu keeps
// its original behaviour (View / Edit / Delete for every row).
//
//   DRAFT      View · Edit · Delete
//   PUBLISHED  View · New version · Archive
//   ARCHIVED   View · New version

import type { ColumnDef } from "@tanstack/react-table";
import { Archive, Eye, FilePlus2, Pencil, Trash2 } from "lucide-react";

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
	/** Copy a PUBLISHED / ARCHIVED template into the next draft version. */
	onNewVersion?: (row: AuditTemplateListRow) => void;
	/** Retire a PUBLISHED template. */
	onArchive?: (row: AuditTemplateListRow) => void;
	canCreateVersion?: boolean;
	canArchive?: boolean;
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
	showSectionCount = true,
}: {
	fieldColumns: readonly AuditTemplateFieldColumn[];
	actions: AuditTemplateRowActions;
	/** Dealer Audit has no sections, so it hides this column. */
	showSectionCount?: boolean;
}): ColumnDef<AuditTemplateListRow>[] {
	const followsLifecycle = Boolean(actions.onNewVersion || actions.onArchive);

	const buildMenuItems = (
		row: AuditTemplateListRow,
	): ActionMenuItem<AuditTemplateListRow>[] => {
		const isDraft = row.status === "DRAFT";
		const isPublished = row.status === "PUBLISHED";

		return [
			{ id: "view", label: "View", Icon: Eye, onClick: actions.onView },
			{
				id: "edit",
				label: "Edit",
				Icon: Pencil,
				hidden: !actions.canEdit || (followsLifecycle && !isDraft),
				onClick: actions.onEdit,
			},
			{
				id: "new-version",
				label: "New version",
				Icon: FilePlus2,
				hidden:
					!actions.onNewVersion || !actions.canCreateVersion || isDraft,
				onClick: (target) => actions.onNewVersion?.(target),
			},
			{
				id: "archive",
				label: "Archive",
				Icon: Archive,
				hidden: !actions.onArchive || !actions.canArchive || !isPublished,
				onClick: (target) => actions.onArchive?.(target),
			},
			{
				id: "delete",
				label: "Delete",
				Icon: Trash2,
				variant: "danger",
				hidden: !actions.canDelete || (followsLifecycle && !isDraft),
				onClick: actions.onDelete,
			},
		];
	};

	const sectionCountColumn: ColumnDef<AuditTemplateListRow> = {
		id: "sectionCount",
		accessorKey: "sectionCount",
		header: "Sections",
		enableSorting: false,
		meta: numberMeta,
	};

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
		...(showSectionCount ? [sectionCountColumn] : []),
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
						actions={buildMenuItems(row.original)}
						size="sm"
						ariaLabel={`Actions for ${row.original.name}`}
					/>
				</div>
			),
		},
	];
}
