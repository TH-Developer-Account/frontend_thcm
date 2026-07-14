import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorListingTable from "../components/VendorListingTable";
import {
	DUMMY_INITIATION_ROWS,
	DUMMY_ONBOARDING_ROWS,
} from "../utils/vendor.constant";
import type {
	VendorInitiationListingRow,
	VendorListingFilter,
	VendorOnboardingListingRow,
} from "../types/vendorListing.types";

const DEFAULT_PAGE_SIZE = 10;

const VendorListingPage = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const tab = searchParams.get("tab");
	const initialFilter: VendorListingFilter =
		tab === "onboarding" ? "onboarding" : "initiation";

	const [selectedFilter, setSelectedFilter] =
		useState<VendorListingFilter>(initialFilter);

	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	const normalizedSearch = search.trim().toLowerCase();

	const filteredInitiationVendors = useMemo(() => {
		return DUMMY_INITIATION_ROWS.filter((vendor) => {
			if (!normalizedSearch) {
				return true;
			}

			return (
				vendor.vendorName.toLowerCase().includes(normalizedSearch) ||
				vendor.vendorEmail.toLowerCase().includes(normalizedSearch) ||
				vendor.vendorPhone.toLowerCase().includes(normalizedSearch) ||
				vendor.createdBy?.toLowerCase().includes(normalizedSearch) ||
				vendor.status?.toLowerCase().includes(normalizedSearch)
			);
		});
	}, [normalizedSearch]);

	const filteredOnboardingVendors = useMemo(() => {
		return DUMMY_ONBOARDING_ROWS.filter((vendor) => {
			if (!normalizedSearch) {
				return true;
			}

			return (
				vendor.vendorName.toLowerCase().includes(normalizedSearch) ||
				vendor.vendorCode?.toLowerCase().includes(normalizedSearch) ||
				vendor.vendorType?.toLowerCase().includes(normalizedSearch) ||
				vendor.companyCode?.toLowerCase().includes(normalizedSearch) ||
				vendor.region?.toLowerCase().includes(normalizedSearch) ||
				vendor.createdBy?.toLowerCase().includes(normalizedSearch) ||
				vendor.status?.toLowerCase().includes(normalizedSearch)
			);
		});
	}, [normalizedSearch]);

	const paginatedInitiationVendors = useMemo(() => {
		const startIndex = pageIndex * pageSize;
		const endIndex = startIndex + pageSize;

		return filteredInitiationVendors.slice(startIndex, endIndex);
	}, [filteredInitiationVendors, pageIndex, pageSize]);

	const paginatedOnboardingVendors = useMemo(() => {
		const startIndex = pageIndex * pageSize;
		const endIndex = startIndex + pageSize;

		return filteredOnboardingVendors.slice(startIndex, endIndex);
	}, [filteredOnboardingVendors, pageIndex, pageSize]);

	const isInitiationTab = selectedFilter === "initiation";

	const activeRowCount = isInitiationTab
		? filteredInitiationVendors.length
		: filteredOnboardingVendors.length;

	const pageCount = Math.max(1, Math.ceil(activeRowCount / pageSize));

	const handleFilterChange = (value: VendorListingFilter) => {
		setSelectedFilter(value);
		setPageIndex(0);
		setSearch("");

		setSearchParams({
			tab: value === "initiation" ? "initiation" : "onboarding",
		});
	};

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPageIndex(0);
	};

	const handlePageSizeChange = (value: number) => {
		setPageSize(value);
		setPageIndex(0);
	};

	const handleViewInitiation = (row: VendorInitiationListingRow) => {
		navigate(`/vendor/initiation/${row.id}`);
	};

	const handleViewOnboarding = (row: VendorOnboardingListingRow) => {
		navigate(`/vendor/onboarding/${row.id}`);
	};

	const handleExport = () => {
		if (isInitiationTab) {
			console.log("Export vendor initiation rows:", filteredInitiationVendors);

			return;
		}

		console.log("Export vendor onboarding rows:", filteredOnboardingVendors);
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
				selectedFilter={selectedFilter}
				onFilterChange={handleFilterChange}
				search={search}
				onSearchChange={handleSearchChange}
				initiationVendors={paginatedInitiationVendors}
				onboardingVendors={paginatedOnboardingVendors}
				isLoading={false}
				isFetching={false}
				pageIndex={pageIndex}
				pageSize={pageSize}
				pageCount={pageCount}
				onPageChange={setPageIndex}
				onPageSizeChange={handlePageSizeChange}
				onExport={handleExport}
				onViewInitiation={handleViewInitiation}
				onViewOnboarding={handleViewOnboarding}
			/>
		</PageSectionLayout>
	);
};

export default VendorListingPage;
