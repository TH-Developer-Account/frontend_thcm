import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import MedicalClaimListingTable from "../components/MedicalClaimListingTable";
import { useMedicalClaimListing } from "../hooks/useMedicalClaimListing";
import type { MedicalClaimListingRow } from "../types/medicalClaimListing.types";
import { toMedicalClaimListingRow } from "../helpers/medicalClaimListing.mapper";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { medicalClaimApi } from "../api/medicalClaim.api";
import { useToast } from "../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { waitForMedicalClaimExport } from "../helpers/reimbursementClaimForm.helper";

const MedicalClaimListingPage = () => {
	const { showToast } = useToast();
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
		handleTabChange,
		handleSearchChange,
		handleStatusChange,
		handlePageSizeChange,
		setPageIndex,
	} = useMedicalClaimListing({ initialTab: "claims" });
	const [isExporting, setIsExporting] = useState(false);
	const rowsForTable = useMemo(
		() => rows.map(toMedicalClaimListingRow),
		[rows],
	);
	const handleExport = useCallback(async () => {
		setIsExporting(true);

		let blobUrl: string | null = null;
		let downloadLink: HTMLAnchorElement | null = null;

		try {
			const queuedExport = await medicalClaimApi.enqueueListingExport({
				tab,
				search: search.trim() || undefined,
				format: "xlsx",
			});

			const downloadUrl = await waitForMedicalClaimExport(queuedExport.jobId);

			const blob = await medicalClaimApi.downloadExportFile(downloadUrl);

			blobUrl = window.URL.createObjectURL(blob);

			downloadLink = document.createElement("a");
			downloadLink.href = blobUrl;
			downloadLink.download = `medical-claims-${tab}-${new Date()
				.toISOString()
				.slice(0, 10)}.xlsx`;

			document.body.appendChild(downloadLink);
			downloadLink.click();

			showToast({
				type: "success",
				title: "Export completed",
				description: "Medical claim records were exported successfully.",
			});
		} catch (error) {
			showToast({
				type: "error",
				title: "Export failed",
				description: getApiErrorMessage(
					error,
					"Failed to export medical claim records.",
				),
			});
		} finally {
			downloadLink?.remove();

			if (blobUrl) {
				window.URL.revokeObjectURL(blobUrl);
			}

			setIsExporting(false);
		}
	}, [search, showToast, tab]);

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
