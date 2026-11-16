import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FilePlusCorner } from "lucide-react";

import CppListingTable from "../components/CppListingTable";
import { useCppListing } from "../hooks/useCppListing";
import { toCppListingRow } from "../helpers/cpp.mapper";
import { getCppRowRoute } from "../utils/cpp.columns";
import { CPP_LISTING_TABS, DEFAULT_CPP_TAB } from "../utils/cpp.constants";
import type { CppListingRow, CppListingTab } from "../types/cpp.types";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import Button from "../../../components/common/Button";
import { getApiErrorMessage } from "../../../utils/apiError.helper";

const toTab = (value: string | null): CppListingTab =>
	value && CPP_LISTING_TABS.includes(value as CppListingTab)
		? (value as CppListingTab)
		: DEFAULT_CPP_TAB;

const CppListingPage = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = searchParams.get("tab");
	const urlTab = toTab(tabParam);

	const listing = useCppListing({ initialTab: urlTab });
	const { tab: currentTab, handleTabChange: changeListingTab } = listing;

	// URL is the source of truth for the tab (same pattern as medical claims).
	useEffect(() => {
		if (tabParam !== urlTab) {
			setSearchParams(
				(current) => {
					const next = new URLSearchParams(current);
					next.set("tab", urlTab);
					return next;
				},
				{ replace: true },
			);
		}
		if (urlTab !== currentTab) changeListingTab(urlTab);
	}, [changeListingTab, currentTab, setSearchParams, tabParam, urlTab]);

	const rowsForTable = useMemo(
		() => listing.rows.map(toCppListingRow),
		[listing.rows],
	);

	const handleTabChange = useCallback(
		(tab: CppListingTab) => {
			listing.handleTabChange(tab);
			setSearchParams({ tab }, { replace: true });
		},
		[listing, setSearchParams],
	);

	const handleViewRow = useCallback(
		(row: CppListingRow) => navigate(getCppRowRoute(row)),
		[navigate],
	);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Contract Price Procurement"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "CPP listing location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "Contract Price Procurement" },
					],
					separator: "›",
				}}
			>
				<Button
					type="button"
					text="Create CPP Request"
					Icon={FilePlusCorner}
					iconPosition="left"
					iconSize={16}
					size="sm"
					variant="brand"
					onClick={() => navigate("/cpp/requests/create")}
				/>
			</PageHeader>

			<CppListingTable
				selectedFilter={listing.tab}
				onFilterChange={handleTabChange}
				search={listing.search}
				onSearchChange={listing.handleSearchChange}
				status={listing.status}
				statusOptions={listing.statusOptions}
				onStatusChange={listing.handleStatusChange}
				rows={rowsForTable}
				isLoading={listing.isLoading}
				isFetching={listing.isFetching}
				isError={listing.isError}
				errorMessage={getApiErrorMessage(
					listing.error,
					"Unable to load CPP requests.",
				)}
				onRetry={() => void listing.refetch()}
				pageIndex={listing.pageIndex}
				pageSize={listing.pageSize}
				pageCount={listing.pageCount}
				onPageChange={listing.setPageIndex}
				onPageSizeChange={listing.handlePageSizeChange}
				onViewRow={handleViewRow}
			/>
		</PageSectionLayout>
	);
};

export default CppListingPage;
