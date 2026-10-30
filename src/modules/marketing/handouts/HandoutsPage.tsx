// handouts/HandoutsPage.tsx
// Handouts list. One page, up to three queues by permission:
//   My requests (requesters) · To approve (approver) · To deliver (delivery team)
// Server-paginated through the same useServerPagination + ManagementTable
// pair the admin lists use.

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import SelectInput, {
	type BaseOption,
} from "../../../components/forms/SelectInput";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import { PageHeader } from "../../../components/ui/PageHeader";
import ManagementTable from "../../../components/ui/tables/ManagementTable/ManagementTable";
import type { ManagementTableColumn } from "../../../components/ui/tables/ManagementTable/ManagementTable.types";
import {
	toTablePagination,
	useClampPageToTotal,
	useServerPagination,
} from "../../../hooks/useServerPagination";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { formatCrfQuantity } from "../crf";

import { useHandoutsQuery } from "./handouts.api";
import {
	HANDOUT_STATUS_LABEL, // MOCK-LAYER: used by the list Badge below
	HANDOUT_STATUS_OPTIONS,
	HANDOUT_STATUS_TONE, // MOCK-LAYER: used by the list Badge below
	HANDOUT_VIEW_LABEL,
	HANDOUTS_BASE_PATH,
} from "./handouts.constants";
import { formatHandoutDate, pluralItems } from "./handouts.format";
import type {
	HandoutStatus,
	HandoutSummary,
	HandoutView,
} from "./handouts.types";
import { Badge } from "../../../components/common/Badge";

import HandoutMockToggle from "./HandoutMockToggle"; // MOCK-LAYER
import { useHandoutPermissions } from "./useHandoutPermissions";
import "./handouts.css";

// Same {value,label} pairs the native <select> used, typed for SelectInput.
const STATUS_FILTER_OPTIONS: BaseOption[] = HANDOUT_STATUS_OPTIONS.map(
	({ value, label }) => ({ value, label }),
);

export default function HandoutsPage() {
	const navigate = useNavigate();
	const permissions = useHandoutPermissions();

	// Only the queues this user may use.
	const tabs = useMemo(() => {
		const allowed: HandoutView[] = [];
		if (permissions.canRequest) allowed.push("mine");
		if (permissions.canApprove) allowed.push("approve");
		if (permissions.canDeliver) allowed.push("deliver");
		// Read-only users still get their own list.
		if (allowed.length === 0 && permissions.canOpenHandouts) {
			allowed.push("mine");
		}
		return allowed.map((value) => ({
			value,
			label: HANDOUT_VIEW_LABEL[value],
		}));
	}, [permissions]);

	const [selectedView, setSelectedView] = useState<HandoutView | null>(null);
	const view =
		selectedView && tabs.some((tab) => tab.value === selectedView)
			? selectedView
			: (tabs[0]?.value ?? "mine");

	const [status, setStatus] = useState<HandoutStatus | "">("");
	const pagination = useServerPagination(10);

	const query = useHandoutsQuery({
		view,
		status: status || undefined,
		search: pagination.debouncedSearch || undefined,
		page: pagination.pageIndex + 1,
		pageSize: pagination.pageSize,
	});
	const total = query.data?.total ?? 0;
	useClampPageToTotal(pagination, query.data?.total);

	const openRequest = (row: HandoutSummary) =>
		navigate(`${HANDOUTS_BASE_PATH}/${row.id}`);

	const columns = useMemo<ManagementTableColumn<HandoutSummary>[]>(
		() => [
			{
				key: "requestNumber",
				header: "Request no.",
				render: (row) => row.requestNumber,
			},
			{
				key: "purpose",
				header: "Purpose",
				render: (row) => row.purpose,
			},
			...(view === "mine"
				? []
				: [
						{
							key: "requestedBy",
							header: "Requested by",
							hideBelow: "md" as const,
							render: (row: HandoutSummary) => row.requestedByName,
						},
					]),
			{
				key: "items",
				header: "Items",
				hideBelow: "md",
				render: (row) =>
					`${pluralItems(row.itemCount)} · ${formatCrfQuantity(row.totalQuantity)} pcs`,
			},
			{
				key: "requiredBy",
				header: "Required by",
				render: (row) => formatHandoutDate(row.requiredBy),
			},
			{
				key: "createdAt",
				header: "Requested on",
				hideBelow: "lg",
				render: (row) => formatHandoutDate(row.createdAt),
			},
			{
				key: "status",
				header: "Status",
				// MOCK-LAYER: same props the detail page already gives Badge, so the
				// list shows the label and tone instead of a bare status.
				render: (row) => (
					<Badge
						status={row.status}
						variant={HANDOUT_STATUS_TONE[row.status]}
						text={HANDOUT_STATUS_LABEL[row.status]}
					/>
				),
			},
		],
		[view],
	);

	if (!permissions.canOpenHandouts) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="Handouts"
					subtitleText="You do not have access to Handouts."
				/>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout>
			<div className="handout-page">
				<PageHeader
					headerText="Handouts"
					subtitleText="Souvenir handouts for premises use. One approver, then hand delivery by the delivery team."
					navigation={{
						variant: "breadcrumbs",
						ariaLabel: "Handouts page location",
						breadcrumbs: [
							{ label: "Home Screen", href: "/" },
							{
								label: "EPC Listing",
								href: "/marketing/activity-planner/listing",
							},
							{ label: "Handouts" },
						],
						separator: "›",
					}}
				>
					<HandoutMockToggle /> {/* MOCK-LAYER */}
				</PageHeader>

				<Card
					padding="none"
					actions={
						permissions.canRequest ? (
							<Button
								type="button"
								appearance="cta"
								variant="brand"
								size="sm"
								Icon={Plus}
								iconSize={16}
								iconPosition="left"
								text="New handout request"
								onClick={() => navigate(`${HANDOUTS_BASE_PATH}/new`)}
							/>
						) : null
					}
					title={
						tabs.length > 1 ? (
							<FilterTabs
								id="handout-view-tabs"
								ariaLabel="Handout queues"
								items={tabs}
								value={view}
								onChange={(next) => {
									setSelectedView(next);
									pagination.resetPage();
								}}
								className="p-0"
							/>
						) : null
					}
					secondaryHeader={
						<>
							<SearchInput
								value={pagination.search}
								onChange={pagination.setSearch}
								placeholder="Search by request no. or purpose"
							/>
							<div className="w-48">
								<SelectInput
									inputId="handout-status-filter"
									aria-label="Filter by status"
									options={STATUS_FILTER_OPTIONS}
									value={
										STATUS_FILTER_OPTIONS.find(
											(option) => option.value === status,
										) ?? null
									}
									isClearable
									placeholder="All statuses"
									onChange={(option) => {
										// Cleared → "" (all statuses), same as the old <select>.
										setStatus(
											((option as BaseOption | null)?.value ?? "") as
												| HandoutStatus
												| "",
										);
										pagination.resetPage();
									}}
								/>
							</div>
						</>
					}
				>
					<ManagementTable
						// MOCK-LAYER: was `rows={[]}`, which hid every row, mock or real.
						rows={query.data?.items ?? []}
						columns={columns}
						getRowId={(row) => row.id}
						ariaLabel="Handout requests"
						// loading={query.isLoading}
						onRowClick={openRequest}
						rowActions={(row) => (
							<Button
								type="button"
								text="View"
								appearance="standard"
								variant="outline"
								size="sm"
								onClick={() => openRequest(row)}
							/>
						)}
						emptyTitle="No handout requests"
						emptyDescription={
							view === "mine"
								? "Requests you raise will appear here."
								: "Nothing is waiting for you right now."
						}
						{...toTablePagination(pagination, total)}
					/>
				</Card>
			</div>
		</PageSectionLayout>
	);
}
