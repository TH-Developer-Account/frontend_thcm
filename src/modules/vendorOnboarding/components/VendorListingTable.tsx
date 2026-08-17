import { useMemo } from "react";
import { FileDown, Plus, type LucideIcon } from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";

import {
	getOnboardingEmptyContent,
	getOnboardingSearchPlaceholder,
	getInitiationSearchPlaceholder,
	getInitiationEmptyContent,
} from "../helpers/vendor.onboarding.helper";
import type {
	VendorInitiationListingRow,
	VendorListingFilter,
	VendorOnboardingListingRow,
} from "../types/vendorListing.types";
import {
	VENDOR_INITIATION_FILTER_TABS,
	VENDOR_ONBOARDING_FILTER_TABS,
} from "../utils/vendor.constant";
import { getVendorInitiationColumns } from "../utils/vendorListing.columns";
import { getVendorOnboardingColumns } from "../utils/vendorOnboardingListing.columns";

export type VendorListingFilterTab = {
	value: VendorListingFilter;
	label: string;
	shortLabel?: string;
	tooltipLabel: string;
	Icon: LucideIcon;
};

type VendorListingCommonProps = {
	filterTabs?: readonly VendorListingFilterTab[];

	selectedFilter: VendorListingFilter;
	onFilterChange: (value: VendorListingFilter) => void;

	search: string;
	onSearchChange: (value: string) => void;

	isLoading?: boolean;
	isFetching?: boolean;

	pageIndex: number;
	pageSize: number;
	pageCount: number;

	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;

	onExport: () => void;
	isExporting?: boolean;
};

type VendorInitiationListingTableProps = VendorListingCommonProps & {
	listingType: "initiation";
	rows?: VendorInitiationListingRow[];
	onViewRow: (row: VendorInitiationListingRow) => void;
};

type VendorOnboardingListingTableProps = VendorListingCommonProps & {
	listingType: "onboarding";
	rows?: VendorOnboardingListingRow[];
	onViewRow: (row: VendorOnboardingListingRow) => void;
};

type VendorListingTableProps =
	| VendorInitiationListingTableProps
	| VendorOnboardingListingTableProps;

const SKELETON_ROW_COUNT = 8;

export default function VendorListingTable(props: VendorListingTableProps) {
	const {
		selectedFilter,
		onFilterChange,
		search,
		onSearchChange,
		isLoading = false,
		isFetching = false,
		pageIndex,
		pageSize,
		pageCount,
		onPageChange,
		onPageSizeChange,
		onExport,
		isExporting,
	} = props;

	const isInitiationListing = props.listingType === "initiation";

	const resolvedFilterTabs =
		props.filterTabs ??
		(isInitiationListing
			? VENDOR_INITIATION_FILTER_TABS
			: VENDOR_ONBOARDING_FILTER_TABS);

	const normalizedFilterTabs = useMemo(
		() =>
			resolvedFilterTabs.map((option) => ({
				value: option.value,
				label: option.label,
				shortLabel: option.shortLabel,
				tooltipLabel: option.tooltipLabel,
				Icon: option.Icon,
			})),
		[resolvedFilterTabs],
	);

	const initiationColumns = useMemo(() => {
		if (props.listingType !== "initiation") {
			return [];
		}

		return getVendorInitiationColumns({
			onView: props.onViewRow,
		});
	}, [props.listingType, props.onViewRow]);

	const onboardingColumns = useMemo(() => {
		if (props.listingType !== "onboarding") {
			return [];
		}

		return getVendorOnboardingColumns({
			onView: props.onViewRow,
		});
	}, [props.listingType, props.onViewRow]);

	const searchPlaceholder = isInitiationListing
		? getInitiationSearchPlaceholder(selectedFilter)
		: getOnboardingSearchPlaceholder(selectedFilter);

	const emptyContent = isInitiationListing
		? getInitiationEmptyContent(selectedFilter)
		: getOnboardingEmptyContent(selectedFilter);

	return (
		<Card
			className="vendor-listing-card"
			title={
				<FilterTabs
					id={`${props.listingType}-vendor-listing-filter-tabs`}
					ariaLabel={
						isInitiationListing
							? "Filter vendor initiation listings"
							: "Filter vendor onboarding listings"
					}
					items={normalizedFilterTabs}
					value={selectedFilter}
					onChange={onFilterChange}
					className="border-b-none px-0 py-0"
				/>
			}
			// actions={
			// 	<Button
			// 		path="/vendor/initiation/create"
			// 		text="Create Onboarding"
			// 		appearance="standard"
			// 		variant="brand"
			// 		Icon={Plus}
			// 		size="sm"
			// 		iconSize={18}
			// 	/>
			// }
			actions={
				<>
					<SearchInput
						value={search}
						onChange={onSearchChange}
						placeholder={`${searchPlaceholder} by name`}
					/>

					<Button
						type="button"
						text={isExporting ? "Exporting..." : "Export"}
						Icon={FileDown}
						iconPosition="left"
						iconSize={16}
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={onExport}
					/>
				</>
			}
		>
			<section
				className="vendor-listing-table"
				aria-labelledby={`${props.listingType}-vendor-listing-filter-tabs`}
				aria-busy={isLoading || isFetching}
			>
				{isLoading ? (
					<DataTableSkeleton
						rows={SKELETON_ROW_COUNT}
						columns={
							isInitiationListing
								? initiationColumns.length
								: onboardingColumns.length
						}
						showPagination
					/>
				) : props.listingType === "initiation" ? (
					<DataTable<VendorInitiationListingRow>
						data={props.rows ?? []}
						columns={initiationColumns}
						loading={false}
						manualPagination
						pageIndex={pageIndex}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={onPageChange}
						onPageSizeChange={onPageSizeChange}
						scrollTargetId={`vendor-initiation-${selectedFilter}-table-scroll`}
						emptyTitle={emptyContent.title}
						emptyDescription={emptyContent.description}
					/>
				) : (
					<DataTable<VendorOnboardingListingRow>
						data={props.rows ?? []}
						columns={onboardingColumns}
						loading={false}
						manualPagination
						pageIndex={pageIndex}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={onPageChange}
						onPageSizeChange={onPageSizeChange}
						scrollTargetId={`vendor-onboarding-${selectedFilter}-table-scroll`}
						emptyTitle={emptyContent.title}
						emptyDescription={emptyContent.description}
					/>
				)}

				{isFetching && !isLoading ? (
					<span className="sr-only" role="status" aria-live="polite">
						Refreshing vendor records
					</span>
				) : null}
			</section>
		</Card>
	);
}
