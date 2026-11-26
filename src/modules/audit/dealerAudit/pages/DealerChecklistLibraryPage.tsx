// modules/audit/dealerAudit/pages/DealerChecklistLibraryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";

import type { FilterSection } from "../../../../components/common/FilterDropdown";
import AuditConfirmModal from "../../shared/components/AuditConfirmModal";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import ChecklistLibrary from "../../shared/checklist/ChecklistLibrary";
import {
	createAuditTemplateColumns,
	isSortableTemplateColumn,
} from "../../shared/checklist/checklistTemplate.columns";
import type { AuditTemplateListRow } from "../../shared/templates/audit.template.types";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { useDealerAuditAccess } from "../hooks/useDealerAuditAccess";
import { useDealerChecklistLibraryParams } from "../hooks/useDealerChecklistLibraryParams";
import {
	useArchiveDealerChecklistTemplate,
	useCreateDealerChecklistTemplateVersion,
	useDealerChecklistTemplates,
	useDeleteDealerChecklistTemplate,
} from "../hooks/useDealerChecklistTemplates";
import {
	DEALER_DETAIL_FIELD_KEYS,
	DEALER_FACILITY_TYPE_OPTIONS,
} from "../templates/dealer-template.config";
import type { DealerChecklistLibraryFilters } from "../templates/dealer-template.types";

const FILTER_SECTIONS: readonly FilterSection<DealerChecklistLibraryFilters>[] =
	[
		{
			type: "checkbox",
			key: "facilityTypes",
			label: "Facility type",
			options: DEALER_FACILITY_TYPE_OPTIONS,
			columns: 1,
		},
	];

const FIELD_COLUMNS = [
	{ key: DEALER_DETAIL_FIELD_KEYS.facilityType, header: "Facility type" },
];

export default function DealerChecklistLibraryPage() {
	const navigate = useNavigate();
	const permissions = useDealerAuditAccess();
	const libraryParams = useDealerChecklistLibraryParams();
	const { listParams } = libraryParams;

	const templates = useDealerChecklistTemplates(listParams);
	const deleteMutation = useDeleteDealerChecklistTemplate();
	const archiveMutation = useArchiveDealerChecklistTemplate();
	const newVersionMutation = useCreateDealerChecklistTemplateVersion();

	const [templatePendingDelete, setTemplatePendingDelete] =
		useState<AuditTemplateListRow | null>(null);
	const [templatePendingArchive, setTemplatePendingArchive] =
		useState<AuditTemplateListRow | null>(null);

	// If a delete empties the last page, step back to the last real page.
	useEffect(() => {
		if (templates.isFetching || templates.totalPages === 0) return;
		if (listParams.page > templates.totalPages) {
			libraryParams.setPageIndex(templates.totalPages - 1);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [templates.isFetching, templates.totalPages, listParams.page]);

	const columns = useMemo(
		() =>
			createAuditTemplateColumns({
				fieldColumns: FIELD_COLUMNS,
				// Dealer checklists are a flat list — no Sections column.
				showSectionCount: false,
				actions: {
					// Edit / Delete only appear on drafts; published and archived
					// versions are immutable (New version / Archive instead).
					canEdit: permissions.canManageTemplates,
					canDelete: permissions.canManageTemplates,
					canCreateVersion: permissions.canManageTemplates,
					canArchive: permissions.canManageTemplates,
					onView: (row) => navigate(DEALER_AUDIT_ROUTES.template.view(row.id)),
					onEdit: (row) => navigate(DEALER_AUDIT_ROUTES.template.edit(row.id)),
					onDelete: (row) => {
						deleteMutation.reset();
						setTemplatePendingDelete(row);
					},
					onArchive: (row) => {
						archiveMutation.reset();
						setTemplatePendingArchive(row);
					},
					onNewVersion: (row) => {
						if (newVersionMutation.isPending) return;
						newVersionMutation.mutate(row.id, {
							onSuccess: (draft) =>
								navigate(DEALER_AUDIT_ROUTES.template.edit(draft.id)),
						});
					},
				},
			}),
		// Mutation `reset` / `mutate` / `isPending` are read at click time.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[navigate, permissions.canManageTemplates],
	);

	const sorting: SortingState = [
		{ id: listParams.sortBy, desc: listParams.sortOrder === "desc" },
	];

	const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
		const next = typeof updater === "function" ? updater(sorting) : updater;
		const [first] = next;
		if (!first || !isSortableTemplateColumn(first.id)) {
			libraryParams.setSort(null, "desc");
			return;
		}
		libraryParams.setSort(first.id, first.desc ? "desc" : "asc");
	};

	const handleConfirmDelete = () => {
		if (!templatePendingDelete || deleteMutation.isPending) return;
		deleteMutation.mutate(templatePendingDelete.id, {
			onSuccess: () => setTemplatePendingDelete(null),
		});
	};

	const handleConfirmArchive = () => {
		if (!templatePendingArchive || archiveMutation.isPending) return;
		archiveMutation.mutate(templatePendingArchive.id, {
			onSuccess: () => setTemplatePendingArchive(null),
		});
	};

	return (
		<>
			<ChecklistLibrary<DealerChecklistLibraryFilters>
				eyebrow="Dealer Audit"
				title="Checklist library"
				subtitle="Build, review and reuse inspection standards across dealer locations."
				canCreate={permissions.canManageTemplates}
				onCreateTemplate={() => navigate(DEALER_AUDIT_ROUTES.template.create)}
				rows={templates.rows}
				columns={columns}
				isLoading={templates.isLoading}
				isFetching={templates.isFetching}
				errorMessage={templates.errorMessage}
				onRetry={() => void templates.refetch()}
				search={libraryParams.searchInput}
				onSearchChange={libraryParams.setSearchInput}
				statusTab={libraryParams.statusTab}
				onStatusTabChange={libraryParams.setStatusTab}
				filters={libraryParams.filters}
				filterSections={FILTER_SECTIONS}
				onFiltersChange={libraryParams.setFilters}
				onClearFilters={libraryParams.clearFilters}
				sorting={sorting}
				onSortingChange={handleSortingChange}
				pageIndex={listParams.page - 1}
				pageSize={listParams.pageSize}
				pageCount={templates.totalPages}
				totalItems={templates.totalItems}
				onPageChange={libraryParams.setPageIndex}
				onPageSizeChange={libraryParams.setPageSize}
				onRowClick={(row) =>
					navigate(DEALER_AUDIT_ROUTES.template.view(row.id))
				}
			/>

			{/* Delete — drafts only (the server also refuses templates used by audits). */}
			<AuditConfirmModal
				open={Boolean(templatePendingDelete)}
				title="Delete draft?"
				warningTitle="This action cannot be undone"
				warningDescription="The draft and all of its parameters will be permanently removed."
				confirmLabel="Delete draft"
				isConfirming={deleteMutation.isPending}
				errorMessage={
					deleteMutation.isError
						? getAuditActionErrorMessage(deleteMutation.error, "template")
						: null
				}
				onConfirm={handleConfirmDelete}
				onClose={() => setTemplatePendingDelete(null)}
			>
				{templatePendingDelete ? (
					<TemplateSummaryLine template={templatePendingDelete} />
				) : null}
			</AuditConfirmModal>

			{/* Archive — published only. */}
			<AuditConfirmModal
				open={Boolean(templatePendingArchive)}
				tone="warning"
				title="Archive template?"
				warningTitle="It will no longer be available for new audits"
				warningDescription="Audits already created keep their checklist version. You can create a new version from it later."
				confirmLabel="Archive template"
				isConfirming={archiveMutation.isPending}
				errorMessage={
					archiveMutation.isError
						? getAuditActionErrorMessage(archiveMutation.error, "template")
						: null
				}
				onConfirm={handleConfirmArchive}
				onClose={() => setTemplatePendingArchive(null)}
			>
				{templatePendingArchive ? (
					<TemplateSummaryLine template={templatePendingArchive} />
				) : null}
			</AuditConfirmModal>
		</>
	);
}

function TemplateSummaryLine({ template }: { template: AuditTemplateListRow }) {
	return (
		<p className="text-body-sm text-fg">
			<span className="font-semibold">{template.name}</span>{" "}
			<span className="text-fg-secondary tabular-nums">
				· v{template.version} · {template.parameterCount} parameters
			</span>
		</p>
	);
}
