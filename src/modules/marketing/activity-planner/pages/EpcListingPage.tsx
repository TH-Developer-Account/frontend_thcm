import { Alert } from "../../../../components/common/Alert";
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
		isExporting,
		exportState,
		handleExport,
		dismissExport,
	} = useEpcListingPage();

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Event Planning Calendar (EPC) Listing"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "EPC page location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "EPC Listing" },
					],
					separator: "›",
				}}
			/>

			{exportState.status === "queued" && (
				<Alert
					type="banner"
					variant="info"
					title="Export queued"
					description={`${exportState.message} Once the export is complete, the file will be shown in Notifications and can be downloaded from there.`}
					secondaryAction={{
						label: "Dismiss",
						onClick: dismissExport,
					}}
				/>
			)}

			{exportState.status === "error" && (
				<Alert
					type="banner"
					variant="error"
					title="Export failed"
					description={exportState.message}
					primaryAction={{ label: "Retry", onClick: handleExport }}
					secondaryAction={{
						label: "Dismiss",
						onClick: dismissExport,
					}}
				/>
			)}

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
				onExport={handleExport}
				isExporting={isExporting}
			/>
		</PageSectionLayout>
	);
};

export default EpcListingPage;
