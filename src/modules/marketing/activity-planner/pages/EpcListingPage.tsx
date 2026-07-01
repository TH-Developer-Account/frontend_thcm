import { PageHeader } from "../../../../components/ui/PageHeader";
import DataTableSkeleton from "../../../../components/ui/DataTableSkeleton";

import EPCTable from "../components/EPCTable/EPCTable";
import EPCTopbar from "../components/EPCTable/EPCTopbar";
import { useEpcListingPage } from "../hooks/useEpcListingPage";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import Card from "../../../../components/common/Card";

const EpcListingPage = () => {
	const {
		data,
		isLoading,
		isFetching,
		searchInput,
		setSearchInput,
		selectedFilter,
		handleFilterChange,
		filters,
		handleAdvancedFilterChange,
		handleClearAllFilters,
		activeFilterCount,
		sorting,
		setSorting,
		pageIndex,
		pageSize,
		pageCount,
		handlePageChange,
		handlePageSizeChange,
	} = useEpcListingPage();

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Event Planning Calendar (EPC) Listing"
				navigation={{
					variant: "breadcrumbs",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "EPC Listing",
						},
					],
					separator: ">",
				}}
			></PageHeader>
			<Card
				title={
					<EPCTopbar
						search={searchInput}
						onSearchChange={setSearchInput}
						selectedFilter={selectedFilter}
						onFilterChange={handleFilterChange}
						filters={filters}
						onAdvancedFilterChange={handleAdvancedFilterChange}
						onClearAllFilters={handleClearAllFilters}
						activeFilterCount={activeFilterCount}
					/>
				}
			>
				{isLoading || isFetching ? (
					<DataTableSkeleton rows={8} columns={6} showPagination />
				) : (
					<EPCTable
						data={data?.data ?? []}
						loading={false}
						sorting={sorting}
						onSortingChange={setSorting}
						pageIndex={pageIndex}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={handlePageChange}
						onPageSizeChange={handlePageSizeChange}
					/>
				)}
			</Card>
		</PageSectionLayout>
	);
};

export default EpcListingPage;
