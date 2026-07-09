import { useMemo } from "react";
import { FileDown, List, UserCheck, Users } from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { SearchInput } from "../../../../components/forms/SearchInput";
import DataTable from "../../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../../components/ui/tables/Skeletons/DataTableSkeleton";
import { FilterTabs } from "../../../../components/ui/FilterTabs";

import {
	getGroupedLeadColumns,
	getLeadCustomerColumns,
} from "../columns/leadCustomerColumns";
import type { LeadEventGroup, LeadRow } from "../types/leads.types";

export type LeadListFilter = "all" | "grouped" | "assigned";

type LeadsTableProps = {
	selectedFilter: LeadListFilter;
	onFilterChange: (value: LeadListFilter) => void;

	search: string;
	onSearchChange: (value: string) => void;

	allLeads: LeadRow[];
	assignedLeads: LeadRow[];
	groupedLeads: LeadEventGroup[];

	isLoading?: boolean;
	isFetching?: boolean;

	pageIndex: number;
	pageSize: number;
	pageCount: number;

	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;

	onExport: () => void;
};

const LEAD_FILTER_TABS = [
	{
		value: "all",
		label: "All Leads",
		tooltipLabel: "View all available leads",
		Icon: List,
	},
	{
		value: "grouped",
		label: "Grouped",
		tooltipLabel: "View leads grouped by event",
		Icon: Users,
	},
	{
		value: "assigned",
		label: "Assigned",
		tooltipLabel: "View leads assigned to me",
		Icon: UserCheck,
	},
] as const;

const SKELETON_ROW_COUNT = 8;

export default function LeadsTable({
	selectedFilter,
	onFilterChange,

	search,
	onSearchChange,

	allLeads,
	assignedLeads,
	groupedLeads,

	isLoading = false,
	isFetching = false,

	pageIndex,
	pageSize,
	pageCount,
	onPageChange,
	onPageSizeChange,

	onExport,
}: LeadsTableProps) {
	const leadColumns = useMemo(() => getLeadCustomerColumns(), []);

	const groupedLeadColumns = useMemo(() => getGroupedLeadColumns(), []);

	const isGroupedView = selectedFilter === "grouped";

	const visibleLeads = selectedFilter === "assigned" ? assignedLeads : allLeads;

	const searchPlaceholder = isGroupedView
		? "Search grouped events"
		: "Search leads";

	const skeletonColumnCount = isGroupedView
		? groupedLeadColumns.length
		: leadColumns.length;

	const emptyDescription =
		selectedFilter === "assigned"
			? "No assigned leads found."
			: "No leads found.";

	return (
		<Card
			className="lead-listing-card"
			title={
				<FilterTabs
					id="lead-listing-tabs"
					ariaLabel="Filter lead listings"
					items={LEAD_FILTER_TABS}
					value={selectedFilter}
					onChange={onFilterChange}
					className="border-b-none px-0 py-0"
				/>
			}
			secondaryHeader={
				<>
					<SearchInput
						value={search}
						onChange={onSearchChange}
						placeholder={searchPlaceholder}
					/>

					<Button
						type="button"
						text="Export"
						Icon={FileDown}
						iconPosition="left"
						iconSize={16}
						appearance="cta"
						variant="brand"
						size="sm"
						onClick={onExport}
					/>
				</>
			}
		>
			<section
				className="lead-listing"
				aria-labelledby="lead-listing-tabs"
				aria-busy={isLoading || isFetching}
			>
				<div className="lead-listing-table">
					{isLoading ? (
						<DataTableSkeleton
							rows={SKELETON_ROW_COUNT}
							columns={skeletonColumnCount}
							showPagination
						/>
					) : isGroupedView ? (
						<DataTable<LeadEventGroup>
							data={groupedLeads}
							columns={groupedLeadColumns}
							manualPagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							pageCount={pageCount}
							onPageChange={onPageChange}
							onPageSizeChange={onPageSizeChange}
							emptyTitle="No grouped lead events found"
							emptyDescription="Try changing the current page or search term."
							scrollTargetId="tableScroll"
						/>
					) : (
						<DataTable<LeadRow>
							data={visibleLeads}
							columns={leadColumns}
							manualPagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							pageCount={pageCount}
							onPageChange={onPageChange}
							onPageSizeChange={onPageSizeChange}
							emptyTitle={
								selectedFilter === "assigned"
									? "No assigned leads found"
									: "No leads found"
							}
							emptyDescription={emptyDescription}
							scrollTargetId="tableScroll"
						/>
					)}
				</div>

				{isFetching && !isLoading ? (
					<span className="sr-only" role="status" aria-live="polite">
						Refreshing lead list
					</span>
				) : null}
			</section>
		</Card>
	);
}
