import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import MedicalClaimListingTable from "./MedicalClaimListingTable";
import { useMedicalClaimListing } from "./useMedicalClaimListing";
import type { MedicalClaimListingRow } from "./medicalClaimListing.types";
import { toMedicalClaimListingRow } from "./medicalClaimListing.mapper";
import PageSectionLayout from "../../layout/PageSectionLayout";
import { PageHeader } from "../../components/ui/PageHeader";

const MedicalClaimListingPage = () => {
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
	} = useMedicalClaimListing({ initialTab: "pendingOnMe" });

	const rowsForTable = useMemo(
		() => rows.map(toMedicalClaimListingRow),
		[rows],
	);

	const handleViewRow = useCallback(
		(row: MedicalClaimListingRow) => {
			navigate(`/medical-claim/form/${row.id}/view`);
		},
		[navigate],
	);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Claims"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Medical reimbursement claim listing location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "Medical Reimbursement Claims" },
					],
					separator: "›",
				}}
			/>

			<MedicalClaimListingTable
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
				onViewRow={handleViewRow}
			/>
		</PageSectionLayout>
	);
};

export default MedicalClaimListingPage;
