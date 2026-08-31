import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { medicalClaimApi } from "../api/medicalClaim.api";
import { medicalClaimKeys } from "../hooks/useMedicalClaimMutations";
import type {
	MedicalClaimListingParams,
	MedicalClaimListingTab,
} from "../types/medicalClaimListing.types";

const DEFAULT_PAGE_SIZE = 10;
const COMPLETE_LIST_PAGE_SIZE = 10_000;

export type MedicalClaimStatusFilter =
	| "all"
	| "PENDING"
	| "IN_PROGRESS"
	| "APPROVED"
	| "REJECTED"
	| "CLOSED";

export type MedicalClaimStatusOption = {
	label: string;
	value: MedicalClaimStatusFilter;
};

export const MEDICAL_CLAIM_STATUS_OPTIONS: MedicalClaimStatusOption[] = [
	{ label: "All statuses", value: "all" },
	{ label: "Pending", value: "PENDING" },
	{ label: "In progress", value: "IN_PROGRESS" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
	{ label: "Closed", value: "CLOSED" },
];

type UseMedicalClaimListingParams = {
	initialTab?: MedicalClaimListingTab;
};

export const useMedicalClaimListing = ({
	initialTab = "claims",
}: UseMedicalClaimListingParams = {}) => {
	const [tab, setTab] = useState<MedicalClaimListingTab>(initialTab);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<MedicalClaimStatusFilter>("all");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	/**
	 * The tab is sent to the backend, but search, status and pagination
	 * are handled locally.
	 */
	const queryParams = useMemo<MedicalClaimListingParams>(
		() => ({
			tab,
			pageIndex: 0,
			pageSize: COMPLETE_LIST_PAGE_SIZE,
		}),
		[tab],
	);

	/**
	 * Including the tab in the query key makes TanStack Query call the
	 * API whenever the selected tab changes.
	 *
	 * staleTime: 0 ensures returning to a previously opened tab fetches
	 * its latest data instead of only serving the cached result.
	 */
	const listingQuery = useQuery({
		queryKey: [...medicalClaimKeys.lists(), tab],
		queryFn: () => medicalClaimApi.listMedicalClaims(queryParams),
		staleTime: 0,
		gcTime: Infinity,
		refetchOnMount: true,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		retry: false,
	});

	const allRows = listingQuery.data?.rows ?? [];

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return allRows.filter((row) => {
			const rowStatus = (row as { status?: string }).status?.toUpperCase();

			const matchesStatus = status === "all" || rowStatus === status;

			const matchesSearch =
				!normalizedSearch ||
				Object.values(row).some((value) =>
					String(value ?? "")
						.toLowerCase()
						.includes(normalizedSearch),
				);

			return matchesStatus && matchesSearch;
		});
	}, [allRows, search, status]);

	const totalCount = filteredRows.length;

	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

	const rows = useMemo(() => {
		const startIndex = pageIndex * pageSize;
		const endIndex = startIndex + pageSize;

		return filteredRows.slice(startIndex, endIndex);
	}, [filteredRows, pageIndex, pageSize]);

	React.useEffect(() => {
		const lastPageIndex = Math.max(0, pageCount - 1);

		if (pageIndex > lastPageIndex) {
			setPageIndex(lastPageIndex);
		}
	}, [pageCount, pageIndex]);

	const handleTabChange = React.useCallback(
		(nextTab: MedicalClaimListingTab) => {
			if (nextTab === tab) return;

			setTab(nextTab);
			setSearch("");
			setStatus("all");
			setPageIndex(0);
		},
		[tab],
	);

	const handleSearchChange = React.useCallback((nextSearch: string) => {
		setSearch(nextSearch);
		setPageIndex(0);
	}, []);

	const handleStatusChange = React.useCallback(
		(nextStatus: MedicalClaimStatusFilter) => {
			setStatus(nextStatus);
			setPageIndex(0);
		},
		[],
	);

	const handlePageSizeChange = React.useCallback((nextPageSize: number) => {
		setPageSize(nextPageSize);
		setPageIndex(0);
	}, []);

	return {
		tab,
		search,
		status,
		pageIndex,
		pageSize,
		pageCount,
		totalCount,
		rows,

		isLoading: listingQuery.isLoading,
		isFetching: listingQuery.isFetching,
		isError: listingQuery.isError,
		error: listingQuery.error,

		refetch: listingQuery.refetch,

		handleTabChange,
		handleSearchChange,
		handleStatusChange,
		handlePageSizeChange,
		setPageIndex,
	};
};
