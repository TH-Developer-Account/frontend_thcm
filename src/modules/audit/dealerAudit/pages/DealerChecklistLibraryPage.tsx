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
	useDealerChecklistTemplates,
	useDeleteDealerChecklistTemplate,
} from "../hooks/useDealerChecklistTemplates";
import {
	DEALER_AUDIT_CATEGORY_OPTIONS,
	DEALER_DETAIL_FIELD_KEYS,
	DEALER_FACILITY_TYPE_OPTIONS,
} from "../templates/dealer-template.config";
import type { DealerChecklistLibraryFilters } from "../templates/dealer-template.types";

const FILTER_SECTIONS: readonly FilterSection<DealerChecklistLibraryFilters>[] = [
	{
		type: "checkbox",
		key: "facilityTypes",
		label: "Facility type",
		options: DEALER_FACILITY_TYPE_OPTIONS,
		columns: 1,
	},
	{
		type: "checkbox",
		key: "auditCategories",
		label: "Audit category",
		options: DEALER_AUDIT_CATEGORY_OPTIONS,
		columns: 1,
	},
];

const FIELD_COLUMNS = [
	{ key: DEALER_DETAIL_FIELD_KEYS.facilityType, header: "Facility type" },
	{ key: DEALER_DETAIL_FIELD_KEYS.auditCategory, header: "Category" },
];

export default function DealerChecklistLibraryPage() {
	const navigate = useNavigate();
	const permissions = useDealerAuditAccess();
	const libraryParams = useDealerChecklistLibraryParams();
	const { listParams } = libraryParams;

	const templates = useDealerChecklistTemplates(listParams);
	const deleteMutation = useDeleteDealerChecklistTemplate();
	const [templatePendingDelete, setTemplatePendingDelete] =
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
				actions: {
					canEdit: permissions.canManageTemplates,
					canDelete: permissions.canManageTemplates,
					onView: (row) => navigate(DEALER_AUDIT_ROUTES.template.view(row.id)),
					onEdit: (row) => navigate(DEALER_AUDIT_ROUTES.template.edit(row.id)),
					onDelete: (row) => {
						deleteMutation.reset();
						setTemplatePendingDelete(row);
					},
				},
			}),
		// deleteMutation.reset is stable across renders.
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

	const isPublishedPendingDelete = templatePendingDelete?.status === "PUBLISHED";

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
				onRowClick={(row) => navigate(DEALER_AUDIT_ROUTES.template.view(row.id))}
			/>

			<AuditConfirmModal
				open={Boolean(templatePendingDelete)}
				title="Delete checklist template?"
				warningTitle="This action cannot be undone"
				warningDescription={
					isPublishedPendingDelete
						? "This template is published. Audits already created keep their checklist version, but new audits can no longer use it."
						: "The template and all of its sections and parameters will be permanently removed."
				}
				confirmLabel="Delete template"
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
					<p className="text-body-sm text-(--color-text-primary)">
						<span className="font-semibold">{templatePendingDelete.name}</span>{" "}
						<span className="text-(--color-text-secondary)">
							· v{templatePendingDelete.version} ·{" "}
							{templatePendingDelete.parameterCount} parameters
						</span>
					</p>
				) : null}
			</AuditConfirmModal>
		</>
	);
}
