import React from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SortingState } from "@tanstack/react-table";

import Button from "../../../../../components/common/Button";
import Card from "../../../../../components/common/Card";
import { SearchInput } from "../../../../../components/forms/SearchInput";
import DataTable from "../../../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../../../components/ui/tables/Skeletons/DataTableSkeleton";
import { FilterTabs } from "../../../../../components/ui/FilterTabs";
import { useAuth } from "../../../../../context/Auth/useAuth";
import { Can } from "../../../../../context/permissionHelpers";
import { useMasterData } from "../../../../../hooks/useMasterData";

import { clearStoredEpcInfo } from "../../helpers/localstorage";
import type { EpcFilters, EpcListItem } from "../../types/epc.types";
import {
	epcListFilterOptions,
	epcStatusOptions,
	type EpcListFilter,
} from "../../utils/constant";

import { getEPCColumns } from "./columns";
import {
	FilterDropdown,
	type FilterSection,
} from "../../../../../components/common/FilterDropdown";

type EPCTableProps = {
	data: EpcListItem[];

	isLoading?: boolean;
	isFetching?: boolean;

	search: string;
	onSearchChange: (value: string) => void;

	selectedFilter: EpcListFilter;
	onFilterChange: (value: EpcListFilter) => void;

	filters: EpcFilters;
	onAdvancedFilterChange: (updatedFilters: Partial<EpcFilters>) => void;
	onClearAllFilters: () => void;
	activeFilterCount: number;

	sorting: SortingState;
	onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;

	pageIndex: number;
	pageSize: number;
	pageCount: number;

	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;
};

const EPC_SKELETON_ROWS = 8;
const EPC_SKELETON_COLUMNS = 6;

const EPCTable = ({
	data,
	isLoading = false,
	isFetching = false,
	search,
	onSearchChange,
	selectedFilter,
	onFilterChange,
	filters,
	onAdvancedFilterChange,
	onClearAllFilters,
	activeFilterCount,
	sorting,
	onSortingChange,
	pageIndex,
	pageSize,
	pageCount,
	onPageChange,
	onPageSizeChange,
}: EPCTableProps) => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { data: masterData } = useMasterData();

	const advancedFilterSections = React.useMemo<
		FilterSection<EpcFilters>[]
	>(() => {
		const eventTypeOptions = masterData?.eventNames ?? [];
		const zoneOptions = masterData?.regions ?? [];

		return [
			{
				type: "checkbox",
				key: "status",
				label: "Status",
				options: epcStatusOptions,
			},
			{
				type: "checkbox",
				key: "zone",
				label: "Zone",
				options: zoneOptions,
			},
			{
				type: "checkbox",
				key: "eventType",
				label: "Event type",
				options: eventTypeOptions,
				columns: 1,
			},
			{
				type: "dateRange",
				label: "Event date",
				fromKey: "eventDateFrom",
				toKey: "eventDateTo",
				fromLabel: "From",
				toLabel: "To",
			},
			{
				type: "date",
				key: "createdDate",
				label: "Created date",
				inputLabel: "Created on",
			},
		];
	}, [masterData?.eventNames, masterData?.regions]);

	const columns = React.useMemo(
		() =>
			getEPCColumns({
				onLeadCreate: () => {
					navigate("/marketing/activity-planner/leads/create");
				},
				currentUserId: user?.id,
			}),
		[navigate, user?.id],
	);

	const filterTabs = React.useMemo(
		() =>
			epcListFilterOptions.map((option) => ({
				value: option.value,
				label: option.label,
				tooltipLabel: option.tooltipLabel,
				Icon: option.Icon,
			})),
		[],
	);

	const handleCreateEpc = React.useCallback(() => {
		clearStoredEpcInfo();
		navigate("/marketing/activity-planner/create");
	}, [navigate]);

	return (
		<Card
			title={
				<FilterTabs
					id="epc-list-filter-tabs"
					ariaLabel="Filter EPC listings"
					items={filterTabs}
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
						placeholder="Search by event name"
					/>
					<FilterDropdown<EpcFilters>
						filters={filters}
						sections={advancedFilterSections}
						onChange={onAdvancedFilterChange}
						onClearAll={onClearAllFilters}
						activeFilterCount={activeFilterCount}
						title="Filters"
						ariaLabel="EPC filters"
					/>

					<Can action="write" app="MAP" module="EPC">
						<Button
							type="button"
							appearance="cta"
							variant="brand"
							size="sm"
							Icon={Plus}
							iconSize={16}
							iconPosition="left"
							text="Create EPC"
							className="epc-listing-create"
							onClick={handleCreateEpc}
						/>
					</Can>
				</>
			}
		>
			<section
				className="epc-listing-table"
				aria-label="Event Planning Calendar records"
				aria-busy={isLoading || isFetching}
			>
				{isLoading ? (
					<DataTableSkeleton
						rows={EPC_SKELETON_ROWS}
						columns={EPC_SKELETON_COLUMNS}
						showPagination
					/>
				) : (
					<DataTable<EpcListItem>
						data={data}
						columns={columns}
						loading={false}
						sorting={sorting}
						onSortingChange={onSortingChange}
						manualSorting
						manualPagination
						pageIndex={pageIndex}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={onPageChange}
						onPageSizeChange={onPageSizeChange}
						scrollTargetId="tableScroll"
						emptyTitle="No EPC records found"
						emptyDescription="Try adjusting the filters or search term."
					/>
				)}

				{isFetching && !isLoading ? (
					<span className="sr-only" role="status" aria-live="polite">
						Refreshing EPC records
					</span>
				) : null}
			</section>
		</Card>
	);
};

export default EPCTable;
