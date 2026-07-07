import { useMemo, useState } from "react";
import {
	FileDown,
	ListChecks,
	ShieldCheck,
	UserRoundCheck,
} from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import DataTable from "../../../components/ui/DataTable";
import DataTableSkeleton from "../../../components/ui/DataTableSkeleton";
import { FilterTabs } from "../../../components/ui/FilterTabs";

import { getVendorListingColumns } from "../utils/vendorListing.columns";
import type {
	VendorListingFilter,
	VendorListingRow,
} from "../types/vendorListing.types";

type VendorListingTableProps = {
	selectedFilter: VendorListingFilter;
	onFilterChange: (value: VendorListingFilter) => void;

	search: string;
	onSearchChange: (value: string) => void;

	vendors: VendorListingRow[];

	isLoading?: boolean;
	isFetching?: boolean;

	pageIndex: number;
	pageSize: number;
	pageCount: number;

	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;

	onExport: () => void;
	onView: (row: VendorListingRow) => void;
};

const VENDOR_FILTER_TABS = [
	{
		value: "pending",
		label: "Pending",
		tooltipLabel: "Vendor requests pending for action",
		Icon: ListChecks,
	},
	{
		value: "approvedByMe",
		label: "Approved By Me",
		tooltipLabel: "Vendor requests approved by me",
		Icon: ShieldCheck,
	},
	{
		value: "createdByMe",
		label: "Created By Me",
		tooltipLabel: "Vendor requests created by me",
		Icon: UserRoundCheck,
	},
] as const;

const SKELETON_ROW_COUNT = 8;

export default function VendorListingTable({
	selectedFilter,
	onFilterChange,

	search,
	onSearchChange,

	vendors,

	isLoading = false,
	isFetching = false,

	pageIndex,
	pageSize,
	pageCount,

	onPageChange,
	onPageSizeChange,

	onExport,
	onView,
}: VendorListingTableProps) {
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const visibleIds = useMemo(
		() => vendors.map((vendor) => vendor.id),
		[vendors],
	);

	const isAllSelected =
		visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

	const handleToggleRow = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id)
				? prev.filter((selectedId) => selectedId !== id)
				: [...prev, id],
		);
	};

	const handleToggleAll = () => {
		setSelectedIds((prev) => {
			const allSelected =
				visibleIds.length > 0 && visibleIds.every((id) => prev.includes(id));

			if (allSelected) {
				return prev.filter((id) => !visibleIds.includes(id));
			}

			return Array.from(new Set([...prev, ...visibleIds]));
		});
	};

	const columns = useMemo(
		() =>
			getVendorListingColumns({
				selectedIds,
				onToggleRow: handleToggleRow,
				onToggleAll: handleToggleAll,
				isAllSelected,
				onView,
			}),
		[selectedIds, isAllSelected, onView],
	);

	const emptyTitle =
		selectedFilter === "approvedByMe"
			? "No vendors approved by you"
			: selectedFilter === "createdByMe"
				? "No vendors created by you"
				: "No pending vendors found";

	const emptyDescription =
		selectedFilter === "approvedByMe"
			? "Approved vendor requests will appear here."
			: selectedFilter === "createdByMe"
				? "Vendor requests created by you will appear here."
				: "Pending vendor requests will appear here.";

	return (
		<Card
			className="vendor-listing-card"
			title={
				<FilterTabs
					id="vendor-listing-tabs"
					ariaLabel="Filter vendor listings"
					items={VENDOR_FILTER_TABS}
					value={selectedFilter}
					onChange={onFilterChange}
					className="border-b-none px-0 py-0"
				/>
			}
			secondaryHeader={
				<>
					<SearchInput
						value={search}
						onChange={onSearchChange}
						placeholder="Search vendors"
					/>

					<Button
						type="button"
						text="Export"
						Icon={FileDown}
						iconPosition="left"
						iconSize={16}
						appearance="cta"
						variant="brand"
						size="sm"
						onClick={onExport}
					/>
				</>
			}
		>
			<section
				className="vendor-listing"
				aria-labelledby="vendor-listing-tabs"
				aria-busy={isLoading || isFetching}
			>
				<div className="vendor-listing-table">
					{isLoading ? (
						<DataTableSkeleton
							rows={SKELETON_ROW_COUNT}
							columns={columns.length}
							showPagination
						/>
					) : (
						<DataTable<VendorListingRow>
							data={vendors}
							columns={columns}
							manualPagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							pageCount={pageCount}
							onPageChange={onPageChange}
							onPageSizeChange={onPageSizeChange}
							emptyTitle={emptyTitle}
							emptyDescription={emptyDescription}
							scrollTargetId="tableScroll"
						/>
					)}
				</div>

				{isFetching && !isLoading ? (
					<span className="sr-only" role="status" aria-live="polite">
						Refreshing vendor list
					</span>
				) : null}
			</section>
		</Card>
	);
}
