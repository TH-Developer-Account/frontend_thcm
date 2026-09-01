import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import MedicalClaimListingTable from "../components/MedicalClaimListingTable";
import { useMedicalClaimListing } from "../hooks/useMedicalClaimListing";
import type { MedicalClaimListingRow } from "../types/medicalClaimListing.types";
import { toMedicalClaimListingRow } from "../helpers/medicalClaimListing.mapper";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Alert } from "../../../components/common/Alert";
import { navigateToDownloadUrl } from "../../../utils/exportJob.helper";

const MedicalClaimListingPage = () => {
	const navigate = useNavigate();
	const {
		tab,
		search,
		status,
		pageIndex,
		pageSize,
		pageCount,
		rows,
		isLoading,
		isFetching,
		isExporting,
		exportState,
		handleTabChange,
		handleSearchChange,
		handleStatusChange,
		handlePageSizeChange,
		handleExport,
		dismissExport,
		setPageIndex,
	} = useMedicalClaimListing({ initialTab: "claims" });

	const rowsForTable = useMemo(
		() => rows.map(toMedicalClaimListingRow),
		[rows],
	);

	const handleViewRow = useCallback(
		(row: MedicalClaimListingRow) => {
			navigate(`/medi-claim/${row.id}/view`, {
				state: {
					actorRole:
						tab === "pendingOnMe" || tab === "approvedByMe"
							? "approver"
							: "creator",
				},
			});
		},
		[navigate, tab],
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

			{exportState.status === "delayed" && (
				<Alert
					type="banner"
					variant="info"
					title="Still exporting…"
					description="This is taking longer than usual. We'll let you know the moment it's ready."
				/>
			)}

			{exportState.status === "ready" && (
				<Alert
					type="banner"
					variant="success"
					title="Export ready"
					description="Your medical claims export is ready to download."
					primaryAction={{
						label: "Download",
						onClick: () => navigateToDownloadUrl(exportState.downloadUrl),
					}}
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
					primaryAction={{
						label: "Retry",
						onClick: handleExport,
					}}
					secondaryAction={{
						label: "Dismiss",
						onClick: dismissExport,
					}}
				/>
			)}

			<MedicalClaimListingTable
				selectedFilter={tab}
				onFilterChange={handleTabChange}
				search={search}
				onSearchChange={handleSearchChange}
				status={status}
				onStatusChange={handleStatusChange}
				rows={rowsForTable}
				isLoading={isLoading}
				isFetching={isFetching}
				pageIndex={pageIndex}
				pageSize={pageSize}
				pageCount={pageCount}
				onExport={handleExport}
				isExporting={isExporting}
				onPageChange={setPageIndex}
				onPageSizeChange={handlePageSizeChange}
				onViewRow={handleViewRow}
			/>
		</PageSectionLayout>
	);
};

export default MedicalClaimListingPage;
