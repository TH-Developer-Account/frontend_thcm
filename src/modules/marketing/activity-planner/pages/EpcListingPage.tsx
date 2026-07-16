import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";

import EPCTable from "../components/EPCTable/EPCTable";
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
    <PageSectionLayout>
      <PageHeader
        headerText="Event Planning Calendar (EPC) Listing"
        navigation={{
          variant: "breadcrumbs",
          ariaLabel: "EPC page location",
          breadcrumbs: [
            {
              label: "Home Screen",
              href: "/",
            },
            {
              label: "EPC Listing",
            },
          ],
          separator: "›",
        }}
      />

      <EPCTable
        data={data?.data ?? []}
        isLoading={isLoading}
        isFetching={isFetching}
        search={searchInput}
        onSearchChange={setSearchInput}
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
        filters={filters}
        onAdvancedFilterChange={handleAdvancedFilterChange}
        onClearAllFilters={handleClearAllFilters}
        activeFilterCount={activeFilterCount}
        sorting={sorting}
        onSortingChange={setSorting}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </PageSectionLayout>
  );
};

export default EpcListingPage;
