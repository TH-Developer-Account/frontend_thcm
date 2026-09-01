import * as React from "react";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { medicalClaimApi } from "../api/medicalClaim.api";
import { medicalClaimKeys } from "../hooks/useMedicalClaimMutations";
import {
	pollExportJob,
	type ExportState,
} from "../../../utils/exportJob.helper";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { useToast } from "../../../context/Auth/AuthContext";
import type {
	MedicalClaimListingParams,
	MedicalClaimListingTab,
} from "../types/medicalClaimListing.types";

const DEFAULT_PAGE_SIZE = 10;
const COMPLETE_LIST_PAGE_SIZE = 10_000;
const DELAYED_THRESHOLD_MS = 4000;

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
	const { showToast } = useToast();

	const [tab, setTab] = useState<MedicalClaimListingTab>(initialTab);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<MedicalClaimStatusFilter>("all");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [exportState, setExportState] = useState<ExportState>({
		status: "idle",
	});

	// Guards against double-fire (rapid clicks, re-renders) independent of
	// React state's async commit timing.
	const isExportingRef = useRef(false);

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

	const handleExport = React.useCallback(async () => {
		if (isExportingRef.current) return;
		isExportingRef.current = true;
		setExportState({ status: "pending" });

		const delayedTimer = setTimeout(() => {
			setExportState((prev) =>
				prev.status === "pending" ? { status: "delayed" } : prev,
			);
		}, DELAYED_THRESHOLD_MS);

		try {
			const queuedExport = await medicalClaimApi.enqueueListingExport({
				tab,
				search: search.trim() || undefined,
				format: "xlsx",
			});

			const downloadUrl = await pollExportJob(
				medicalClaimApi.getExportStatus,
				queuedExport.jobId,
			);

			clearTimeout(delayedTimer);
			setExportState({ status: "ready", downloadUrl });
		} catch (error) {
			clearTimeout(delayedTimer);
			const message = getApiErrorMessage(
				error,
				"Failed to export medical claim records.",
			);
			setExportState({ status: "error", message });
			showToast({
				type: "error",
				title: "Export failed",
				description: message,
			});
		} finally {
			isExportingRef.current = false;
		}
	}, [search, showToast, tab]);

	const dismissExport = React.useCallback(() => {
		setExportState({ status: "idle" });
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
		isExporting:
			exportState.status === "pending" || exportState.status === "delayed",
		exportState,

		refetch: listingQuery.refetch,

		handleTabChange,
		handleSearchChange,
		handleStatusChange,
		handlePageSizeChange,
		handleExport,
		dismissExport,
		setPageIndex,
	};
};
