import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import { PageHeader } from "../../../components/ui/PageHeader";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import type { VendorOnboardingListingRow } from "../../vendorOnboarding/types/vendorListing.types";
import { getVendorOnboardingColumns } from "../../vendorOnboarding/utils/vendorOnboardingListing.columns";

import { useGuestVendorSubmissionsListing } from "./useGuestVendorSubmissionsListing";

const SKELETON_ROW_COUNT = 8;

export default function VendorSubmissionsListingPage() {
	const navigate = useNavigate();

	const {
		rows,
		search,
		setSearch,
		canGuestEdit,
		isLoading,
		isFetching,
		isError,
	} = useGuestVendorSubmissionsListing();

	const handleView = useCallback(
		(row: VendorOnboardingListingRow) => {
			navigate(`/guest/medi-claim/create/${row.id}`);
		},
		[navigate],
	);

	const handleEdit = useCallback(
		(row: VendorOnboardingListingRow) => {
			navigate(`/guest/medi-claim/create/${row.id}/edit`);
		},
		[navigate],
	);

	const columns = useMemo(
		() =>
			getVendorOnboardingColumns({
				onView: handleView,
				onEdit: handleEdit,
				getViewPath: (row) => `/guest/medi-claim/medi-claim/create/${row.id}`,
				canEdit: canGuestEdit,
			}),
		[canGuestEdit, handleEdit, handleView],
	);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Onboarding Form"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendor Onboarding Form",
					breadcrumbs: [
						{
							label: "Vendor Onboarding Form",
						},
					],
					separator: "›",
				}}
			/>

			<Card
				className="vendor-listing-card"
				title="Vendor Onboarding"
				actions={
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search vendor submissions"
					/>
				}
			>
				<section
					className="vendor-listing-table"
					aria-busy={isLoading || isFetching}
				>
					{isLoading ? (
						<DataTableSkeleton
							rows={SKELETON_ROW_COUNT}
							columns={columns.length}
							showPagination={false}
						/>
					) : isError ? (
						<div className="vendor-listing-error" role="alert">
							Unable to load your vendor submissions.
						</div>
					) : (
						<DataTable<VendorOnboardingListingRow>
							data={rows}
							columns={columns}
							loading={false}
							manualPagination={false}
							scrollTargetId="guest-vendor-onboarding-table-scroll"
							emptyTitle={
								search ? "No matching submissions" : "No submissions yet"
							}
							emptyDescription={
								search
									? "Try a different vendor name, reference number, company code or status."
									: "You don't have any vendor onboarding submissions yet."
							}
						/>
					)}
				</section>
			</Card>
		</PageSectionLayout>
	);
}
