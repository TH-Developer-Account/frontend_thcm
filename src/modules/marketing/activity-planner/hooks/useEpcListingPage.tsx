import React, { useCallback, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SortingState } from "@tanstack/react-table";

import { useDebouncedValue } from "./useDebouncedValue";
import { useEpcListQuery } from "../queries/useEpcListQuery";
import type { EpcListFilter } from "../utils/constant";
import type { EpcListParams, EpcFilters } from "../types/epc.types";
import { useToast } from "../../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../../utils/apiError.helper";
import { filesApi } from "../api/file.module.api";
// import {
// 	pollExportJob,
// 	type ExportState,
// } from "../../../../utils/exportJob.helper";

export type EpcListingExportState =
	| { status: "idle" }
	| { status: "pending" }
	| {
			status: "queued";
			message: string;
			jobId: string;
			logId?: string;
	  }
	| { status: "error"; message: string };

// const DELAYED_EXPORT_THRESHOLD_MS = 4000;

const DEFAULT_EPC_FILTER: EpcListFilter = "createdByMe";
const VALID_EPC_FILTERS: EpcListFilter[] = [
	"createdByMe",
	"pendingOnMe",
	"approvedByMe",
];

const toNumber = (value: string | null, fallback: number) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getFilterValue = (value: string | null): EpcListFilter => {
	if (VALID_EPC_FILTERS.includes(value as EpcListFilter))
		return value as EpcListFilter;
	return DEFAULT_EPC_FILTER;
};
const DEFAULT_PAGE_SIZE = 5;
const VALID_PAGE_SIZES = [5, 10, 15, 25, 50, 100];

const getPageSize = (value: string | null): number => {
	const parsed = Number(value);

	return VALID_PAGE_SIZES.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
};

export const useEpcListingPage = () => {
	const { showToast } = useToast();
	const [exportState, setExportState] = useState<EpcListingExportState>({
		status: "idle",
	});
	const [searchParams, setSearchParams] = useSearchParams();
	const [sorting, setSorting] = useState<SortingState>([]);
	const isExportingRef = useRef(false);

	const page = toNumber(searchParams.get("page"), 1);
	const limit = getPageSize(searchParams.get("limit"));
	const urlSearch = searchParams.get("search") || "";
	const selectedFilter = getFilterValue(searchParams.get("filter"));

	// ✅ All filters read from URL
	const filters = React.useMemo<EpcFilters>(
		() => ({
			status: searchParams.get("status")?.split(",").filter(Boolean) ?? [],
			zone: searchParams.get("zone")?.split(",").filter(Boolean) ?? [],
			eventType:
				searchParams.get("eventType")?.split(",").filter(Boolean) ?? [],
			eventDateFrom: searchParams.get("eventDateFrom") ?? "",
			eventDateTo: searchParams.get("eventDateTo") ?? "",
			createdDate: searchParams.get("createdDate") ?? "",
		}),
		[searchParams],
	);

	const [searchInput, setSearchInput] = useState(urlSearch);
	const debouncedSearch = useDebouncedValue(searchInput, 350);

	const sortBy = sorting[0]?.id || "created_at";
	const sortOrder: "asc" | "desc" =
		sorting.length === 0 ? "desc" : sorting[0]?.desc ? "desc" : "asc";

	React.useEffect(() => {
		const trimmedSearch = debouncedSearch.trim();
		if (trimmedSearch === urlSearch) return;
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (trimmedSearch) next.set("search", trimmedSearch);
				else next.delete("search");
				next.set("page", "1");
				return next;
			},
			{ replace: true },
		);
	}, [debouncedSearch, urlSearch, setSearchParams]);

	const queryParams = React.useMemo<EpcListParams>(
		() => ({
			page,
			limit,
			search: urlSearch || undefined,
			sortBy,
			sortOrder,
			createdByMe: selectedFilter === "createdByMe" ? true : undefined,
			pendingOnMe: selectedFilter === "pendingOnMe" ? true : undefined,
			approvedByMe: selectedFilter === "approvedByMe" ? true : undefined,
			// ✅ spread all filters into query params
			status: filters.status.length ? filters.status : undefined,
			zone: filters.zone.length ? filters.zone : undefined,
			eventType: filters.eventType.length ? filters.eventType : undefined,
			eventDateFrom: filters.eventDateFrom || undefined,
			eventDateTo: filters.eventDateTo || undefined,
			createdDate: filters.createdDate || undefined,
		}),
		[page, limit, urlSearch, sortBy, sortOrder, selectedFilter, filters],
	);

	const query = useEpcListQuery(queryParams);

	const handleFilterChange = (value: EpcListFilter) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("filter", value);
			next.set("page", "1");
			return next;
		});
	};

	// ✅ Single handler for all advanced filters
	const handleAdvancedFilterChange = (updated: Partial<EpcFilters>) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				const merged = { ...filters, ...updated };

				// array filters
				for (const key of ["status", "zone", "eventType"] as const) {
					if (merged[key].length) next.set(key, merged[key].join(","));
					else next.delete(key);
				}

				// date filters
				for (const key of [
					"eventDateFrom",
					"eventDateTo",
					"createdDate",
				] as const) {
					if (merged[key]) next.set(key, merged[key]);
					else next.delete(key);
				}

				next.set("page", "1");
				return next;
			},
			{ replace: true },
		);
	};

	const handleClearAllFilters = () => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				for (const key of [
					"status",
					"zone",
					"eventType",
					"eventDateFrom",
					"eventDateTo",
					"createdDate",
				]) {
					next.delete(key);
				}
				next.set("page", "1");
				return next;
			},
			{ replace: true },
		);
	};

	const handlePageChange = (nextPageIndex: number) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("page", String(nextPageIndex + 1));
			return next;
		});
	};

	const handlePageSizeChange = (nextPageSize: number) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("limit", String(nextPageSize));
			next.set("page", "1");
			return next;
		});
	};

	// const handleExport = useCallback(async () => {
	// 	if (isExportingRef.current) return;

	// 	isExportingRef.current = true;
	// 	setExportState({ status: "pending" });

	// 	const delayedTimer = window.setTimeout(() => {
	// 		setExportState((current) =>
	// 			current.status === "pending" ? { status: "delayed" } : current,
	// 		);
	// 	}, DELAYED_EXPORT_THRESHOLD_MS);

	// 	try {
	// 		const queuedExport = await filesApi.enqueueExport({
	// 			format: "xlsx",

	// 			search: urlSearch.trim() || undefined,
	// 			sortBy,
	// 			sortOrder,

	// 			createdByMe: selectedFilter === "createdByMe" ? true : undefined,

	// 			pendingOnMe: selectedFilter === "pendingOnMe" ? true : undefined,

	// 			approvedByMe: selectedFilter === "approvedByMe" ? true : undefined,

	// 			status: filters.status.length ? filters.status : undefined,

	// 			zone: filters.zone.length ? filters.zone : undefined,

	// 			eventType: filters.eventType.length ? filters.eventType : undefined,

	// 			eventDateFrom: filters.eventDateFrom || undefined,

	// 			eventDateTo: filters.eventDateTo || undefined,

	// 			createdDate: filters.createdDate || undefined,
	// 		});

	// 		const downloadUrl = await pollExportJob(
	// 			filesApi.getExportStatus,
	// 			queuedExport.jobId,
	// 		);

	// 		window.clearTimeout(delayedTimer);

	// 		setExportState({
	// 			status: "ready",
	// 			downloadUrl,
	// 		});
	// 	} catch (error) {
	// 		window.clearTimeout(delayedTimer);

	// 		const message = getApiErrorMessage(
	// 			error,
	// 			"Failed to export EPC records.",
	// 		);

	// 		setExportState({
	// 			status: "error",
	// 			message,
	// 		});

	// 		showToast({
	// 			type: "error",
	// 			title: "Export failed",
	// 			description: message,
	// 		});
	// 	} finally {
	// 		isExportingRef.current = false;
	// 	}
	// }, [
	// 	filters.createdDate,
	// 	filters.eventDateFrom,
	// 	filters.eventDateTo,
	// 	filters.eventType,
	// 	filters.status,
	// 	filters.zone,
	// 	selectedFilter,
	// 	showToast,
	// 	sortBy,
	// 	sortOrder,
	// 	urlSearch,
	// ]);
	const handleExport = useCallback(async () => {
		if (isExportingRef.current) return;

		isExportingRef.current = true;
		setExportState({ status: "pending" });

		try {
			const queuedExport = await filesApi.enqueueExport({
				format: "xlsx",
				search: urlSearch.trim() || undefined,
				sortBy,
				sortOrder,
				createdByMe: selectedFilter === "createdByMe" ? true : undefined,
				pendingOnMe: selectedFilter === "pendingOnMe" ? true : undefined,
				approvedByMe: selectedFilter === "approvedByMe" ? true : undefined,
				status: filters.status.length ? filters.status : undefined,
				zone: filters.zone.length ? filters.zone : undefined,
				eventType: filters.eventType.length ? filters.eventType : undefined,
				eventDateFrom: filters.eventDateFrom || undefined,
				eventDateTo: filters.eventDateTo || undefined,
				createdDate: filters.createdDate || undefined,
			});

			setExportState({
				status: "queued",
				message:
					queuedExport.message ??
					"EPC export job queued. This may take several minutes.",
				jobId: queuedExport.jobId,
				logId: queuedExport.logId,
			});
		} catch (error) {
			const message = getApiErrorMessage(
				error,
				"Failed to export EPC records.",
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
	}, [
		filters.createdDate,
		filters.eventDateFrom,
		filters.eventDateTo,
		filters.eventType,
		filters.status,
		filters.zone,
		selectedFilter,
		showToast,
		sortBy,
		sortOrder,
		urlSearch,
	]);

	const dismissExport = useCallback(() => {
		setExportState({ status: "idle" });
	}, []);

	const activeFilterCount = [
		filters.status.length > 0,
		filters.zone.length > 0,
		filters.eventType.length > 0,
		!!filters.eventDateFrom || !!filters.eventDateTo,
		!!filters.createdDate,
	].filter(Boolean).length;

	return {
		data: query.data,
		isLoading: query.isLoading,
		isFetching: query.isFetching,

		searchInput,
		setSearchInput,

		selectedFilter,
		handleFilterChange,

		filters,
		handleAdvancedFilterChange,
		handleClearAllFilters,
		activeFilterCount,

		sorting,
		setSorting,

		pageIndex: page - 1,
		pageSize: limit,
		pageCount: query.data?.totalPages ?? 1,

		// isExporting:
		// 	exportState.status === "pending" || exportState.status === "delayed",

		isExporting: exportState.status === "pending",
		exportState,
		handleExport,
		dismissExport,

		handlePageChange,
		handlePageSizeChange,
	};
};
