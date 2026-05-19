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
			contentClassName="min-w-0 overflow-hidden"
			stickyHeader
			header_children={
				<PageHeader
					headerText="Event Planning Calendar (EPC) Listing"
					subtitleText="Manage your Event Planning Calendar (EPC) details here"
					badgeProps={{
						text: "Back to Home Screen",
						to: "/",
						direction: "back",
					}}
					className="flex flex-row justify-between items-start"
				>
					<EPCTopbar
						search={searchInput}
						onSearchChange={setSearchInput}
						selectedFilter={selectedFilter}
						onFilterChange={handleFilterChange}
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
