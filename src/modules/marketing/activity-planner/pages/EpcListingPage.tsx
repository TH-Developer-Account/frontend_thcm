import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import DataTableSkeleton from "../../../../components/ui/DataTableSkeleton";

import EPCTable from "../components/EPCTable/EPCTable";
import EPCTopbar from "../components/EPCTable/EPCTopbar";
import { useEpcListingPage } from "../hooks/useEpcListingPage";

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
		<PageRowSectionLayout
			contentMode="contained"
			stickyHeader
			header_children={
				<PageHeader
					headerText="Event Planning Calendar (EPC) Listing"
					// subtitleText="Manage your Event Planning Calendar (EPC) details here"
					badgeProps={{
						text: "",
						to: "/",
						direction: "back",
					}}
				>
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
				</PageHeader>
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
		</PageRowSectionLayout>
	);
};

export default EpcListingPage;
