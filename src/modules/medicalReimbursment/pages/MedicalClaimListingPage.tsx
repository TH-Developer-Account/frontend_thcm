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
		try {
			const blob = await medicalClaimApi.exportListing({
				tab,
				search: search || undefined,
				pageIndex: 0,
				pageSize, // or a dedicated "export all matching filter" param if your backend supports it
				// status: status !== "all" ? status : undefined, // uncomment once backend supports status filtering
			});

			const blobUrl = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = `mediClaim-${tab}-${new Date().toISOString().slice(0, 10)}.xlsx`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(blobUrl);
		} catch (error) {
			showToast({
				type: "error",
				title: "Export failed",
				description: "Failed to export medi-claim records.",
			});
		} finally {
			setIsExporting(false);
		}
	}, [tab, search, pageSize, showToast]);

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
