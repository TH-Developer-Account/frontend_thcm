// modules/audit/dealerAudit/hooks/useDealerChecklistLibraryParams.ts
//
// Library list state lives in the URL (?page=2&status=DRAFT&facility=…)
// so View → Back, refresh and shared links keep the same page / filters.

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useDebounce } from "../../../../hooks/useDebounce";
import { isSortableTemplateColumn } from "../../shared/checklist/checklistTemplate.columns";
import type { TemplateStatusTab } from "../../shared/checklist/ChecklistLibrary";
import type { TemplateLifecycleStatus } from "../../shared/templates/audit.template.types";
import {
	DEFAULT_DEALER_TEMPLATE_LIST_PARAMS,
	mapFiltersToListParams,
} from "../templates/dealer-template.mappers";
import type {
	DealerChecklistLibraryFilters,
	DealerChecklistTemplateListParams,
} from "../templates/dealer-template.types";

const SEARCH_DEBOUNCE_MS = 350;
const STATUS_VALUES: readonly TemplateLifecycleStatus[] = [
	"DRAFT",
	"PUBLISHED",
	"ARCHIVED",
];

const PARAM = {
	page: "page",
	pageSize: "size",
	search: "q",
	status: "status",
	facility: "facility",
	category: "category",
	sortBy: "sort",
	sortOrder: "order",
} as const;

const isTemplateStatus = (value: string): value is TemplateLifecycleStatus =>
	STATUS_VALUES.some((status) => status === value);

const readList = (value: string | null): string[] =>
	value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

const readPositiveInt = (value: string | null, fallback: number): number => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function useDealerChecklistLibraryParams() {
	const [searchParams, setSearchParams] = useSearchParams();

	const statusParam = searchParams.get(PARAM.status) ?? "";
	const statusTab: TemplateStatusTab = isTemplateStatus(statusParam)
		? statusParam
		: "ALL";

	const filters: DealerChecklistLibraryFilters = {
		facilityTypes: readList(searchParams.get(PARAM.facility)),
		auditCategories: readList(searchParams.get(PARAM.category)),
	};

	const sortByParam = searchParams.get(PARAM.sortBy) ?? "";
	const sortBy = isSortableTemplateColumn(sortByParam)
		? sortByParam
		: DEFAULT_DEALER_TEMPLATE_LIST_PARAMS.sortBy;
	const sortOrder =
		searchParams.get(PARAM.sortOrder) === "asc"
			? "asc"
			: searchParams.get(PARAM.sortOrder) === "desc"
				? "desc"
				: DEFAULT_DEALER_TEMPLATE_LIST_PARAMS.sortOrder;

	const committedSearch = searchParams.get(PARAM.search) ?? "";

	const listParams: DealerChecklistTemplateListParams = {
		page: readPositiveInt(
			searchParams.get(PARAM.page),
			DEFAULT_DEALER_TEMPLATE_LIST_PARAMS.page,
		),
		pageSize: readPositiveInt(
			searchParams.get(PARAM.pageSize),
			DEFAULT_DEALER_TEMPLATE_LIST_PARAMS.pageSize,
		),
		search: committedSearch,
		statuses: statusTab === "ALL" ? [] : [statusTab],
		...mapFiltersToListParams(filters),
		sortBy,
		sortOrder,
	};

	/** Writes a patch to the URL; any filter change resets to page 1. */
	const updateParams = (
		patch: Partial<Record<keyof typeof PARAM, string | null>>,
		options: { resetPage?: boolean } = { resetPage: true },
	) => {
		setSearchParams(
			(current) => {
				const next = new URLSearchParams(current);
				(Object.keys(patch) as Array<keyof typeof PARAM>).forEach((key) => {
					const value = patch[key];
					if (value === null || value === undefined || value === "") {
						next.delete(PARAM[key]);
					} else {
						next.set(PARAM[key], value);
					}
				});
				if (options.resetPage) next.delete(PARAM.page);
				return next;
			},
			{ replace: true },
		);
	};

	// Search box is local for instant typing; the URL (and query) follows
	// after a debounce so we don't fire a request per keystroke.
	const [searchInput, setSearchInput] = useState(committedSearch);
	const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

	useEffect(() => {
		if (debouncedSearch.trim() === committedSearch.trim()) return;
		updateParams({ search: debouncedSearch.trim() || null });
		// updateParams is recreated each render; the comparison guards loops.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch, committedSearch]);

	return {
		listParams,
		searchInput,
		setSearchInput,
		statusTab,
		setStatusTab: (value: TemplateStatusTab) =>
			updateParams({ status: value === "ALL" ? null : value }),
		filters,
		setFilters: (patch: Partial<DealerChecklistLibraryFilters>) =>
			updateParams({
				...(patch.facilityTypes
					? { facility: patch.facilityTypes.join(",") || null }
					: {}),
				...(patch.auditCategories
					? { category: patch.auditCategories.join(",") || null }
					: {}),
			}),
		clearFilters: () => updateParams({ facility: null, category: null }),
		setSort: (
			nextSortBy: DealerChecklistTemplateListParams["sortBy"] | null,
			nextOrder: DealerChecklistTemplateListParams["sortOrder"],
		) =>
			updateParams({
				sortBy: nextSortBy,
				sortOrder: nextSortBy ? nextOrder : null,
			}),
		/** 0-based index from the DataTable → 1-based page in the URL. */
		setPageIndex: (pageIndex: number) =>
			updateParams({ page: String(pageIndex + 1) }, { resetPage: false }),
		setPageSize: (pageSize: number) => updateParams({ pageSize: String(pageSize) }),
	};
}
