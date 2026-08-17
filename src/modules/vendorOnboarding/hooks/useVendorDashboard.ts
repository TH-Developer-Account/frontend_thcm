import { useQuery } from "@tanstack/react-query";

import {
	vendorOnboardingApi,
	type VendorListingResponse,
	type VendorListingTab,
} from "../api/vendorOnboarding.api";
import { vendorOnboardingKeys } from "../queries/useVendorMutations";

const DASHBOARD_PAGE_SIZE = 100;

const useVendorDashboardList = (tab: VendorListingTab, pageSize = 1) =>
	useQuery<VendorListingResponse>({
		queryKey: [...vendorOnboardingKeys.lists(), "dashboard", tab, pageSize],
		queryFn: () =>
			vendorOnboardingApi.listVendorOnboardings({
				tab,
				pageIndex: 0,
				pageSize,
			}),
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

export function useVendorDashboard() {
	const onboardingQuery = useVendorDashboardList(
		"onboarding",
		DASHBOARD_PAGE_SIZE,
	);
	const pendingQuery = useVendorDashboardList("pendingOnMe");
	const approvedQuery = useVendorDashboardList("approvedByMe");
	const createdQuery = useVendorDashboardList("createdByMe");

	const queries = [onboardingQuery, pendingQuery, approvedQuery, createdQuery];

	const refresh = async (): Promise<void> => {
		await Promise.all(queries.map((query) => query.refetch()));
	};

	return {
		recentOnboardings: onboardingQuery.data?.rows ?? [],

		// Each metric now carries its own success/error/value —
		// a failed metric no longer hides the ones that succeeded.
		metrics: {
			total: {
				value: onboardingQuery.data?.totalCount ?? 0,
				isLoading: onboardingQuery.isLoading,
				isError: onboardingQuery.isError,
			},
			pending: {
				value: pendingQuery.data?.totalCount ?? 0,
				isLoading: pendingQuery.isLoading,
				isError: pendingQuery.isError,
			},
			approved: {
				value: approvedQuery.data?.totalCount ?? 0,
				isLoading: approvedQuery.isLoading,
				isError: approvedQuery.isError,
			},
			created: {
				value: createdQuery.data?.totalCount ?? 0,
				isLoading: createdQuery.isLoading,
				isError: createdQuery.isError,
			},
		},
		// The table only actually depends on the onboarding query —
		// scope its loading/error state to that query alone.
		isTableLoading: onboardingQuery.isLoading,
		isTableError: onboardingQuery.isError,

		// Only block the *entire* page on first load, when nothing has data yet.
		isInitialLoading: queries.every((q) => q.isLoading),
		isRefreshing: queries.some((query) => query.isFetching),

		refresh,
	};
}
