// artworks/ArtworksPage.tsx
// Marketing team's listing: one row per approved event that asked for
// artwork. Soonest event first in "To do", so the urgent ones are on top.
// Server-paginated through the same useServerPagination + ManagementTable
// pair Handouts and the admin lists use. Read-only: opening a row goes to
// the detail page, where the links are shared.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
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

import { useArtworksQuery } from "./artworks.api";
import { ArtworkDaysBadge, ArtworkStatusBadge } from "./ArtworkBadges";
import { ARTWORK_VIEW_LABEL, ARTWORKS_BASE_PATH } from "./artworks.constants";
import { formatArtworkDateRange, pluralArtworks } from "./artworks.format";
import type { ArtworkSummary, ArtworkView } from "./artworks.types";
import { ArtworkMockToggle } from "./artworks.mock"; // MOCK-LAYER
import { useArtworkPermissions } from "./useArtworkPermissions";
import "./artworks.css";

const VIEWS: ArtworkView[] = ["pending", "shared", "all"];

export default function ArtworksPage() {
	const navigate = useNavigate();
	const { canOpenArtworks } = useArtworkPermissions();

	const [view, setView] = useState<ArtworkView>("pending");
	const pagination = useServerPagination(10);

	const query = useArtworksQuery(
		{
			view,
			search: pagination.debouncedSearch || undefined,
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
		},
		canOpenArtworks,
	);
	const total = query.data?.total ?? 0;
	useClampPageToTotal(pagination, query.data?.total);

	const openRequest = (row: ArtworkSummary) =>
		navigate(`${ARTWORKS_BASE_PATH}/${row.id}`);

	const tabs = useMemo(
		() => VIEWS.map((value) => ({ value, label: ARTWORK_VIEW_LABEL[value] })),
		[],
	);

	const columns = useMemo<ManagementTableColumn<ArtworkSummary>[]>(
		() => [
			{
				key: "event",
				header: "Event",
				render: (row) => (
					<div className="artwork-event-cell">
						<strong>{row.epcNumber ?? "EPC"}</strong>
						{row.eventName ? <small>{row.eventName}</small> : null}
					</div>
				),
			},
			{
				key: "eventDate",
				header: "Event date",
				hideBelow: "md",
				render: (row) =>
					formatArtworkDateRange(row.eventFromDate, row.eventToDate),
			},
			{
				key: "timing",
				header: "Starts",
				render: (row) => (
					<ArtworkDaysBadge
						eventState={row.eventState}
						daysUntil={row.daysUntil}
					/>
				),
			},
			{
				key: "artworks",
				header: "Artworks",
				hideBelow: "md",
				render: (row) =>
					`${pluralArtworks(row.itemCount)} · ${row.sharedCount} of ${row.itemCount} links`,
			},
			{
				key: "requestedBy",
				header: "Requested by",
				hideBelow: "lg",
				render: (row) => row.requestedByName ?? "--",
			},
			{
				key: "status",
				header: "Status",
				render: (row) => <ArtworkStatusBadge status={row.status} />,
			},
		],
		[],
	);

	if (!canOpenArtworks) {
		return (
			<PageSectionLayout>
				<PageHeader
					headerText="Artworks"
					subtitleText="You do not have access to Artworks."
				>
					<ArtworkMockToggle /> {/* MOCK-LAYER */}
				</PageHeader>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout>
			<div className="artwork-page">
				<PageHeader
					headerText="Artworks"
					subtitleText="Artwork requested on approved events. Share a link for each artwork before the event."
					navigation={{
						variant: "breadcrumbs",
						ariaLabel: "Artworks page location",
						breadcrumbs: [
							{ label: "Home Screen", href: "/" },
							{ label: "Artworks" },
						],
						separator: "›",
					}}
				>
					<ArtworkMockToggle /> {/* MOCK-LAYER */}
				</PageHeader>

				<Card
					padding="none"
					title={
						<FilterTabs
							id="artwork-view-tabs"
							ariaLabel="Artwork queues"
							items={tabs}
							value={view}
							onChange={(next) => {
								setView(next);
								pagination.resetPage();
							}}
							className="p-0"
						/>
					}
					secondaryHeader={
						<SearchInput
							value={pagination.search}
							onChange={pagination.setSearch}
							placeholder="Search by EPC number or event name"
						/>
					}
				>
					<ManagementTable
						rows={query.data?.items ?? []}
						columns={columns}
						getRowId={(row) => row.id}
						ariaLabel="Artwork requests"
						loading={query.isLoading}
						onRowClick={openRequest}
						rowActions={(row) => (
							<Button
								type="button"
								text={row.canShare ? "Open" : "View"}
								appearance="standard"
								variant="outline"
								size="sm"
								onClick={() => openRequest(row)}
							/>
						)}
						emptyTitle="No artwork requests"
						emptyDescription={
							view === "pending"
								? "Nothing is waiting for artwork links right now."
								: "Nothing to show here yet."
						}
						{...toTablePagination(pagination, total)}
					/>
				</Card>
			</div>
		</PageSectionLayout>
	);
}
