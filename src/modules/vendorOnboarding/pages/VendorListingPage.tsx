import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorListingTable from "../components/VendorListingTable";
import type {
	VendorListingFilter,
	VendorListingRow,
} from "../types/vendorListing.types";

const DUMMY_VENDOR_ROWS: VendorListingRow[] = [
	{
		id: "vendor-request-001",
		vendorCode: "VND-1001",
		vendorName: "ABC Industrial Suppliers",
		vendorType: "PO Based",
		companyCode: "0080 - BLR",
		region: "South 1",
		status: "PENDING",
		createdBy: "External Vendor",
		createdDate: "2026-07-01",
	},
	{
		id: "vendor-request-002",
		vendorCode: "VND-1002",
		vendorName: "Shakti Engineering Works",
		vendorType: "Non PO Based",
		companyCode: "0070 - KGP",
		region: "East",
		status: "APPROVED",
		createdBy: "THCM Employee",
		approvedBy: "Current User",
		createdDate: "2026-07-02",
	},
	{
		id: "vendor-request-003",
		vendorCode: "VND-1003",
		vendorName: "Dharwad Logistics Partner",
		vendorType: "PO Based",
		companyCode: "0091 - DWD",
		region: "Dharwad",
		status: "PENDING",
		createdBy: "Current User",
		createdDate: "2026-07-03",
	},
];

const PAGE_SIZE = 10;

const VendorListingPage = () => {
	const navigate = useNavigate();

	const [selectedFilter, setSelectedFilter] =
		useState<VendorListingFilter>("pending");
	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(PAGE_SIZE);

	const filteredVendors = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return DUMMY_VENDOR_ROWS.filter((vendor) => {
			const matchesFilter =
				selectedFilter === "pending"
					? vendor.status === "PENDING"
					: selectedFilter === "approvedByMe"
						? vendor.approvedBy === "Current User"
						: vendor.createdBy === "Current User";

			const matchesSearch =
				!normalizedSearch ||
				vendor.vendorName.toLowerCase().includes(normalizedSearch) ||
				vendor.vendorCode.toLowerCase().includes(normalizedSearch) ||
				vendor.companyCode.toLowerCase().includes(normalizedSearch) ||
				vendor.region.toLowerCase().includes(normalizedSearch);

			return matchesFilter && matchesSearch;
		});
	}, [selectedFilter, search]);

	const paginatedVendors = useMemo(() => {
		const start = pageIndex * pageSize;
		const end = start + pageSize;

		return filteredVendors.slice(start, end);
	}, [filteredVendors, pageIndex, pageSize]);

	const pageCount = Math.max(1, Math.ceil(filteredVendors.length / pageSize));

	const handleFilterChange = (value: VendorListingFilter) => {
		setSelectedFilter(value);
		setPageIndex(0);
	};

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPageIndex(0);
	};

	const handlePageSizeChange = (value: number) => {
		setPageSize(value);
		setPageIndex(0);
	};

	const handleViewVendor = (row: VendorListingRow) => {
		navigate(`/vendor/onboarding/${row.id}`);
	};

	const handleExport = () => {
		console.log("Export vendor rows:", filteredVendors);
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
				vendors={paginatedVendors}
				isLoading={false}
				isFetching={false}
				pageIndex={pageIndex}
				pageSize={pageSize}
				pageCount={pageCount}
				onPageChange={setPageIndex}
				onPageSizeChange={handlePageSizeChange}
				onExport={handleExport}
				onView={handleViewVendor}
			/>
		</PageSectionLayout>
	);
};

export default VendorListingPage;
