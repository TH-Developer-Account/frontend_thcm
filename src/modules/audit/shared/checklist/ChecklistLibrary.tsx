// modules/audit/shared/checklist/ChecklistLibrary.tsx
//
// Presentational checklist-template library: header, toolbar (search,
// status tabs, FilterDropdown) and a server-driven TanStack data table.
// All state (page, sort, filters) is owned by the module page so it can
// live in the URL and drive the query.

import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import Button from "../../../../components/common/Button";
import { Alert } from "../../../../components/common/Alert";
import {
	FilterDropdown,
	type FilterSection,
} from "../../../../components/common/FilterDropdown";
import TabsBar from "../../../../components/common/TabsBar";
import { SearchInput } from "../../../../components/forms/SearchInput";
import { PageHeader } from "../../../../components/ui/PageHeader";
import TableListing from "../../../../components/ui/tables/DataTable/TableListing";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { TEMPLATE_STATUS_FILTER_TABS } from "../templates/audit-template.status";
import type {
	AuditTemplateListRow,
	TemplateLifecycleStatus,
} from "../templates/audit.template.types";

export type TemplateStatusTab = TemplateLifecycleStatus | "ALL";

export interface ChecklistLibraryProps<TFilters extends object> {
	eyebrow: string;
	title: string;
	subtitle: string;
	createLabel?: string;
	canCreate: boolean;
	onCreateTemplate: () => void;

	rows: AuditTemplateListRow[];
	columns: ColumnDef<AuditTemplateListRow>[];
	isLoading: boolean;
	isFetching?: boolean;
	errorMessage?: string | null;
	onRetry?: () => void;

	search: string;
	onSearchChange: (value: string) => void;

	statusTab: TemplateStatusTab;
	onStatusTabChange: (value: TemplateStatusTab) => void;

	filters: TFilters;
	filterSections: readonly FilterSection<TFilters>[];
	onFiltersChange: (updated: Partial<TFilters>) => void;
	onClearFilters: () => void;

	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;

	/** 0-based, as the shared DataTable expects. */
	pageIndex: number;
	pageSize: number;
	pageCount: number;
	totalItems: number;
	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;

	onRowClick?: (row: AuditTemplateListRow) => void;
}

export default function ChecklistLibrary<TFilters extends object>({
	eyebrow,
	title,
	subtitle,
	createLabel = "Create checklist",
	canCreate,
	onCreateTemplate,
	rows,
	columns,
	isLoading,
	isFetching = false,
	errorMessage,
	onRetry,
	search,
	onSearchChange,
	statusTab,
	onStatusTabChange,
	filters,
	filterSections,
	onFiltersChange,
	onClearFilters,
	sorting,
	onSortingChange,
	pageIndex,
	pageSize,
	pageCount,
	totalItems,
	onPageChange,
	onPageSizeChange,
	onRowClick,
}: ChecklistLibraryProps<TFilters>) {
	const hasActiveQuery =
		search.trim().length > 0 ||
		statusTab !== "ALL" ||
		Object.values(filters).some(
			(value) => Array.isArray(value) && value.length > 0,
		);

	return (
		<PageSectionLayout>
			<PageHeader>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-1">
						<span className="text-eyebrow text-(--color-brand)">{eyebrow}</span>
						<h1 className="text-page-title text-(--color-text-primary)">{title}</h1>
						<p className="text-body-sm text-(--color-text-secondary)">{subtitle}</p>
					</div>

					{canCreate ? (
						<Button
							text={createLabel}
							variant="brand"
							size="md"
							Icon={Plus}
							onClick={onCreateTemplate}
						/>
					) : null}
				</div>
			</PageHeader>

			<TableListing<AuditTemplateListRow>
				ariaLabel="All checklist templates"
				data={rows}
				columns={columns}
				getRowId={(row) => row.id}
				loading={isLoading}
				minWidth="lg"
				tabs={
					<TabsBar
						items={TEMPLATE_STATUS_FILTER_TABS}
						mode="single"
						active={statusTab}
						onChange={onStatusTabChange}
						ariaLabel="Filter templates by status"
						variant="soft"
					/>
				}
				toolbarStart={
					<SearchInput
						value={search}
						onChange={onSearchChange}
						placeholder="Search by template name or description"
						containerClassName="min-w-0 w-full sm:w-80"
					/>
				}
				toolbarEnd={
					<div className="flex items-center gap-3">
						<span
							className="text-body-sm text-(--color-text-secondary)"
							aria-live="polite"
						>
							{isFetching && !isLoading
								? "Updating…"
								: `${totalItems} template${totalItems === 1 ? "" : "s"}`}
						</span>
						<FilterDropdown<TFilters>
							filters={filters}
							sections={filterSections}
							onChange={onFiltersChange}
							onClearAll={onClearFilters}
							title="Filter templates"
							ariaLabel="Filter templates"
						/>
					</div>
				}
				message={
					errorMessage ? (
						<Alert
							variant="error"
							title="Couldn't load checklist templates"
							description={errorMessage}
							primaryAction={
								onRetry ? { label: "Retry", onClick: onRetry } : undefined
							}
						/>
					) : null
				}
				emptyTitle={
					hasActiveQuery ? "No templates match your filters" : "No checklist templates yet"
				}
				emptyDescription={
					hasActiveQuery
						? "Try another search, status or filter."
						: canCreate
							? "Create your first checklist template to start auditing."
							: "Templates will appear here once an admin publishes them."
				}
				sorting={sorting}
				onSortingChange={onSortingChange}
				manualSorting
				enablePagination
				manualPagination
				pageIndex={pageIndex}
				pageSize={pageSize}
				pageCount={pageCount}
				onPageChange={onPageChange}
				onPageSizeChange={onPageSizeChange}
				onRowClick={onRowClick}
			/>
		</PageSectionLayout>
	);
}
