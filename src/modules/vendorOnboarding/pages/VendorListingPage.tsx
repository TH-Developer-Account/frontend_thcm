import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorListingTable from "../components/VendorListingTable";
import { useVendorListing } from "../hooks/useVendorListing";
import {
  toInitiationRow,
  toOnboardingRow,
} from "../utils/vendorListingRowMapper";
import type {
  VendorInitiationListingRow,
  VendorOnboardingListingRow,
} from "../types/vendorListing.types";

const VendorListingPage = () => {
  const navigate = useNavigate();

  const {
    tab,
    search,
    pageIndex,
    pageSize,
    pageCount,
    rows,
    isLoading,
    isFetching,
    handleTabChange,
    handleSearchChange,
    handlePageSizeChange,
    setPageIndex,
  } = useVendorListing();

  const isInitiationTab = tab === "initiation";

  // The backend already scoped `rows` to the active tab — this only reshapes
  // field names/adds the two placeholder nulls the table's types expect.
  const rowsForTable = useMemo(
    () =>
      isInitiationTab ? rows.map(toInitiationRow) : rows.map(toOnboardingRow),
    [isInitiationTab, rows],
  );

  const handleViewRow = (
    row: VendorInitiationListingRow | VendorOnboardingListingRow,
  ) => {
    const path =
      tab === "initiation" ? "/vendor/initiation" : "/vendor/onboarding";
    navigate(`${path}/${row.id}`);
  };

  const handleExport = () => {
    console.log(`Export vendor ${tab} rows:`, rows);
  };

  return (
    <PageSectionLayout>
      <PageHeader
        headerText="Vendors Listing"
        navigation={{
          variant: "breadcrumbs",
          ariaLabel: "Vendors listing location",
          breadcrumbs: [
            {
              label: "Home Screen",
              href: "/",
            },
            {
              label: "Vendors Listing",
              href: "/vendor/listing",
            },
          ],
          separator: "›",
        }}
      />

      <VendorListingTable
        selectedFilter={tab}
        onFilterChange={handleTabChange}
        search={search}
        onSearchChange={handleSearchChange}
        rows={rowsForTable}
        isLoading={isLoading}
        isFetching={isFetching}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        onPageSizeChange={handlePageSizeChange}
        onExport={handleExport}
        onViewRow={handleViewRow}
      />
    </PageSectionLayout>
  );
};

export default VendorListingPage;
