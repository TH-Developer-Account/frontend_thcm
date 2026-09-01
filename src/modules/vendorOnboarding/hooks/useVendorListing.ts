import * as React from "react";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { vendorOnboardingApi } from "../api/vendorOnboarding.api";
import type {
	VendorListingParams,
	VendorListingTab,
} from "../api/vendorOnboarding.api";
import { vendorOnboardingKeys } from "../queries/useVendorMutations";
import {
	pollExportJob,
	type ExportState,
} from "../../../utils/exportJob.helper";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { useToast } from "../../../context/Auth/AuthContext";

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;
const DELAYED_THRESHOLD_MS = 4000;

const useDebouncedValue = <T>(value: T, delayMs: number): T => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	React.useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedValue(value);
		}, delayMs);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [delayMs, value]);

	return debouncedValue;
};

type UseVendorListingParams = {
	initialTab: VendorListingTab;
};

export const useVendorListing = ({ initialTab }: UseVendorListingParams) => {
	const { showToast } = useToast();

	const [tab, setTab] = useState<VendorListingTab>(initialTab);
	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [exportState, setExportState] = useState<ExportState>({
		status: "idle",
	});

	// Guards against double-fire (rapid clicks, re-renders) independent of
	// React state's async commit timing.
	const isExportingRef = useRef(false);

	const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

	const queryParams = useMemo<VendorListingParams>(
		() => ({
			tab,
			search: debouncedSearch || undefined,
			pageIndex,
			pageSize,
		}),
		[debouncedSearch, pageIndex, pageSize, tab],
	);

	const listingQuery = useQuery({
		queryKey: [...vendorOnboardingKeys.lists(), queryParams],
		queryFn: () => vendorOnboardingApi.listVendorOnboardings(queryParams),
		placeholderData: (previousData) => previousData,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

	const totalCount = listingQuery.data?.totalCount ?? 0;

	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

	const handleTabChange = React.useCallback((nextTab: VendorListingTab) => {
		setTab(nextTab);
		setPageIndex(0);
		setSearch("");
	}, []);

	const handleSearchChange = React.useCallback((nextSearch: string) => {
		setSearch(nextSearch);
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
			setExportState((prev) =>
				prev.status === "pending" ? { status: "delayed" } : prev,
			);
		}, DELAYED_THRESHOLD_MS);

		try {
			const queued = await vendorOnboardingApi.enqueueBulkExport({
				tab,
				search: debouncedSearch || undefined,
			});

			const downloadUrl = await pollExportJob(
				vendorOnboardingApi.getExportStatus,
				queued.jobId,
			);

			clearTimeout(delayedTimer);
			setExportState({ status: "ready", downloadUrl });
		} catch (error) {
			clearTimeout(delayedTimer);
			const message = getApiErrorMessage(
				error,
				"Failed to export vendor onboarding records.",
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
	}, [tab, debouncedSearch, showToast]);

	const dismissExport = React.useCallback(() => {
		setExportState({ status: "idle" });
	}, []);

	return {
		tab,
		search,
		pageIndex,
		pageSize,
		pageCount,
		totalCount,
		isExporting:
			exportState.status === "pending" || exportState.status === "delayed",
		exportState,

		rows: listingQuery.data?.rows ?? [],

		isLoading: listingQuery.isLoading,
		isFetching: listingQuery.isFetching,
		isError: listingQuery.isError,
		error: listingQuery.error,

		handleTabChange,
		handleSearchChange,
		handlePageSizeChange,
		handleExport,
		dismissExport,
		setPageIndex,
	};
};
