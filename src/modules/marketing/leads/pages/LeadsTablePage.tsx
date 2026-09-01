import { useCallback, useMemo, useState } from "react";

import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";

import LeadsTable, { type LeadListFilter } from "../components/LeadsTable";
import { groupLeadsByEvent } from "../helpers/groupLeadsByEvent";
import { useLeadRowsQuery } from "../queries/useLeadQueries";
import type { LeadEventDetails, LeadRow } from "../types/leads.types";

import "../styles/leads.css";

const INITIAL_PAGE_INDEX = 0;
const INITIAL_PAGE_SIZE = 5;

const STATIC_EPC_DETAILS_MAP = new Map<string, LeadEventDetails>();

const normalizeSearchValue = (value: unknown): string =>
	String(value ?? "")
		.trim()
		.toLowerCase();

const matchesLeadSearch = (lead: LeadRow, searchValue: string): boolean => {
	if (!searchValue) return true;

	const searchableValues = [
		lead.proposalNumber,
		lead.event_name,
		lead.location,
		lead.status,
		lead.epcStatus,
		lead.epcId,
	];

	return searchableValues.some((value) =>
		normalizeSearchValue(value).includes(searchValue),
	);
};

export default function LeadsTablePage() {
	const [pageIndex, setPageIndex] = useState(INITIAL_PAGE_INDEX);
	const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);

	const [search, setSearch] = useState("");
	const [selectedFilter, setSelectedFilter] = useState<LeadListFilter>("all");

	const {
		data: leadResult,
		isLoading,
		isFetching,
	} = useLeadRowsQuery({
		// DataTable is zero-based; the backend is one-based.
		page: pageIndex + 1,
		pageSize,
	});

	const leads = leadResult?.data ?? [];
	const pageCount = leadResult?.pagination.totalPages ?? 0;

	const normalizedSearch = useMemo(
		() => normalizeSearchValue(search),
		[search],
	);

	const filteredLeads = useMemo(() => {
		return leads.filter((lead) => matchesLeadSearch(lead, normalizedSearch));
	}, [leads, normalizedSearch]);

	const groupedLeads = useMemo(() => {
		return groupLeadsByEvent(filteredLeads, STATIC_EPC_DETAILS_MAP);
	}, [filteredLeads]);

	/*
	 * Replace this with the actual assignment field
	 * when the backend returns assignment information.
	 */
	const assignedLeads = filteredLeads;

	const handlePageChange = useCallback((nextPageIndex: number) => {
		setPageIndex(nextPageIndex);
	}, []);

	const handlePageSizeChange = useCallback((nextPageSize: number) => {
		setPageSize(nextPageSize);
		setPageIndex(INITIAL_PAGE_INDEX);
	}, []);

	const handleSearchChange = useCallback((value: string) => {
		setSearch(value);
		setPageIndex(INITIAL_PAGE_INDEX);
	}, []);

	const handleFilterChange = useCallback((value: LeadListFilter) => {
		setSelectedFilter(value);
		setPageIndex(INITIAL_PAGE_INDEX);
	}, []);

	const handleExport = () => {
		const exportData =
			selectedFilter === "grouped"
				? groupedLeads
				: selectedFilter === "assigned"
					? assignedLeads
					: filteredLeads;

		console.log("Export clicked", {
			view: selectedFilter,
			data: exportData,
		});
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Leads Listing"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Leads page location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Leads Listing",
						},
					],
					separator: "›",
				}}
			/>

			<LeadsTable
				selectedFilter={selectedFilter}
				onFilterChange={handleFilterChange}
				search={search}
				onSearchChange={handleSearchChange}
				allLeads={filteredLeads}
				assignedLeads={assignedLeads}
				groupedLeads={groupedLeads}
				isLoading={isLoading}
				isFetching={isFetching}
				pageIndex={pageIndex}
				pageSize={pageSize}
				pageCount={pageCount}
				onPageChange={handlePageChange}
				onPageSizeChange={handlePageSizeChange}
				onExport={handleExport}
			/>
		</PageSectionLayout>
	);
}
