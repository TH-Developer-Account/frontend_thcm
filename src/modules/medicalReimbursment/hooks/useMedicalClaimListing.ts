import * as React from "react";
import { useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { medicalClaimApi } from "../api/medicalClaim.api";
import { medicalClaimKeys } from "./useMedicalClaimMutations";
import { useDebouncedValue } from "./useDebouncedValue";
import { pollExportJob, type ExportState } from "../../../utils/exportJob.helper";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { useToast } from "../../../context/Auth/AuthContext";
import type {
	MedicalClaimListingParams,
	MedicalClaimListingTab,
} from "../types/medicalClaimListing.types";
import { MEDICLAIM_BACKEND } from "../utils/mediclaimBackend.config";
import { downloadMedicalClaimListingXlsx } from "../helpers/medicalClaimListingExport";
import {
	getStatusOptionsForTab,
	type MedicalClaimStatusFilter,
	type MedicalClaimStatusOption,
} from "../utils/medicalClaimListing.constants";

export type { MedicalClaimStatusFilter, MedicalClaimStatusOption };

const DEFAULT_PAGE_SIZE = 10;
const DELAYED_THRESHOLD_MS = 4000;

type UseMedicalClaimListingParams = {
	initialTab?: MedicalClaimListingTab;
};

/**
 * Staff listing. Tab, search and pagination are sent to the backend (it caps
 * page_size at 100). The current backend has no status filter, so with a
 * status selected the API layer fetches the tab and filters/paginates here
 * (see MEDICLAIM_BACKEND.listingStatusFilter). Search is debounced.
 */
export const useMedicalClaimListing = ({
	initialTab = "pendingOnMe",
}: UseMedicalClaimListingParams = {}) => {
	const { showToast } = useToast();

	const [tab, setTab] = useState<MedicalClaimListingTab>(initialTab);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<MedicalClaimStatusFilter>("all");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [exportState, setExportState] = useState<ExportState>({ status: "idle" });

	const debouncedSearch = useDebouncedValue(search.trim());

	// Guards against double-fire independent of React's async state commits.
	const isExportingRef = useRef(false);

	const queryParams = useMemo<MedicalClaimListingParams>(
		() => ({
			tab,
			search: debouncedSearch || undefined,
			status: status === "all" ? undefined : status,
			pageIndex,
			pageSize,
		}),
		[debouncedSearch, pageIndex, pageSize, status, tab],
	);

	const listingQuery = useQuery({
		queryKey: [...medicalClaimKeys.lists(), queryParams],
		queryFn: () => medicalClaimApi.listMedicalClaims(queryParams),
		placeholderData: keepPreviousData,
		staleTime: 15_000,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const totalCount = listingQuery.data?.totalCount ?? 0;
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
	const rows = listingQuery.data?.rows ?? [];

	// Search changes reset to the first page once the debounced value lands.
	React.useEffect(() => {
		setPageIndex(0);
	}, [debouncedSearch]);

	React.useEffect(() => {
		const lastPageIndex = Math.max(0, pageCount - 1);
		if (!listingQuery.isFetching && pageIndex > lastPageIndex) {
			setPageIndex(lastPageIndex);
		}
	}, [listingQuery.isFetching, pageCount, pageIndex]);

	const statusOptions = useMemo(() => getStatusOptionsForTab(tab), [tab]);

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
		setSearch(nextSearch.slice(0, 100));
	}, []);

	const handleStatusChange = React.useCallback((nextStatus: MedicalClaimStatusFilter) => {
		setStatus(nextStatus || "all");
		setPageIndex(0);
	}, []);

	const handlePageSizeChange = React.useCallback((nextPageSize: number) => {
		setPageSize(nextPageSize);
		setPageIndex(0);
	}, []);

	const handleExport = React.useCallback(async () => {
		if (isExportingRef.current) return;
		isExportingRef.current = true;
		setExportState({ status: "pending" });

		const delayedTimer = setTimeout(() => {
			setExportState((prev) => (prev.status === "pending" ? { status: "delayed" } : prev));
		}, DELAYED_THRESHOLD_MS);

		try {
			// The backend export ignores `status`, so with a status filter on,
			// build the file here from the same rows the table shows.
			if (status !== "all" && !MEDICLAIM_BACKEND.listingStatusFilter) {
				const claims = await medicalClaimApi.listAllByStatus(
					{ tab, search: search.trim() || undefined },
					status,
				);
				clearTimeout(delayedTimer);
				if (!claims.length) {
					setExportState({ status: "idle" });
					showToast({
						type: "error",
						title: "Nothing to export",
						description: "No claims match the current filters.",
					});
					return;
				}
				const date = new Date().toISOString().slice(0, 10);
				downloadMedicalClaimListingXlsx(
					claims,
					`medical-claims-${tab}-${status.toLowerCase()}-${date}.xlsx`,
				);
				setExportState({ status: "idle" });
				showToast({
					type: "success",
					title: "Export ready",
					description: `${claims.length} claim${claims.length === 1 ? "" : "s"} downloaded.`,
				});
				return;
			}

			// Export exactly what is on screen: same tab and search.
			const queuedExport = await medicalClaimApi.enqueueListingExport({
				tab,
				search: search.trim() || undefined,
				status: status === "all" ? undefined : status,
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
			const message = getApiErrorMessage(error, "Failed to export medical claim records.");
			setExportState({ status: "error", message });
			showToast({ type: "error", title: "Export failed", description: message });
		} finally {
			isExportingRef.current = false;
		}
	}, [search, showToast, status, tab]);

	const dismissExport = React.useCallback(() => {
		setExportState({ status: "idle" });
	}, []);

	return {
		tab,
		search,
		status,
		statusOptions,
		pageIndex,
		pageSize,
		pageCount,
		totalCount,
		rows,

		isLoading: listingQuery.isLoading,
		isFetching: listingQuery.isFetching,
		isError: listingQuery.isError,
		error: listingQuery.error,
		isExporting: exportState.status === "pending" || exportState.status === "delayed",
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
