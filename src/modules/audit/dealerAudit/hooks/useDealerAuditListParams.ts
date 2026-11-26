// modules/audit/dealerAudit/hooks/useDealerAuditListParams.ts
//
// Filter / search / paging state for the audit list. The search box updates
// immediately; the request only follows after a short pause.

import { useCallback, useMemo, useState } from "react";

import { useDebounce } from "../../../../hooks/useDebounce";
import { DEFAULT_AUDIT_LIST_PARAMS, normalizeAuditListParams } from "../dealer-audit.mappers";
import type {
	DealerAuditListParams,
	DealerAuditQuarter,
	DealerAuditSortField,
	DealerAuditStatus,
} from "../dealer-audit.types";

const SEARCH_DEBOUNCE_MS = 400;

export function useDealerAuditListParams() {
	const [searchInput, setSearchInputState] = useState("");
	const [status, setStatusState] = useState<DealerAuditStatus | null>(null);
	const [year, setYearState] = useState<number | null>(null);
	const [quarter, setQuarterState] = useState<DealerAuditQuarter | null>(null);
	const [page, setPage] = useState(DEFAULT_AUDIT_LIST_PARAMS.page);
	const [pageSize, setPageSizeState] = useState(
		DEFAULT_AUDIT_LIST_PARAMS.pageSize,
	);
	const [sortBy, setSortBy] = useState<DealerAuditSortField>(
		DEFAULT_AUDIT_LIST_PARAMS.sortBy,
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
		DEFAULT_AUDIT_LIST_PARAMS.sortOrder,
	);

	const search = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

	const listParams = useMemo<DealerAuditListParams>(
		() =>
			normalizeAuditListParams({
				page,
				pageSize,
				search,
				statuses: status ? [status] : [],
				periodType: quarter !== null ? "QUARTERLY" : null,
				year,
				quarter,
				sortBy,
				sortOrder,
			}),
		[page, pageSize, quarter, search, sortBy, sortOrder, status, year],
	);

	// Every filter change returns to the first page.
	const setSearchInput = useCallback((value: string) => {
		setSearchInputState(value);
		setPage(1);
	}, []);
	const setStatus = useCallback((value: DealerAuditStatus | null) => {
		setStatusState(value);
		setPage(1);
	}, []);
	const setYear = useCallback((value: number | null) => {
		setYearState(value);
		setPage(1);
	}, []);
	const setQuarter = useCallback((value: DealerAuditQuarter | null) => {
		setQuarterState(value);
		setPage(1);
	}, []);
	const setPageSize = useCallback((value: number) => {
		setPageSizeState(value);
		setPage(1);
	}, []);
	const setSort = useCallback(
		(field: DealerAuditSortField, order: "asc" | "desc") => {
			setSortBy(field);
			setSortOrder(order);
			setPage(1);
		},
		[],
	);
	const clearFilters = useCallback(() => {
		setSearchInputState("");
		setStatusState(null);
		setYearState(null);
		setQuarterState(null);
		setPage(1);
	}, []);

	const hasActiveFilters =
		searchInput !== "" || status !== null || year !== null || quarter !== null;

	return {
		listParams,
		searchInput,
		status,
		year,
		quarter,
		hasActiveFilters,
		setSearchInput,
		setStatus,
		setYear,
		setQuarter,
		/** zero-based, as DataTable expects */
		setPageIndex: (index: number) => setPage(index + 1),
		setPageSize,
		setSort,
		clearFilters,
	};
}
