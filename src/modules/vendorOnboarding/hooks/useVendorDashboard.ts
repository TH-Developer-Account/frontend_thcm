import { useQuery } from "@tanstack/react-query";

import {
	vendorOnboardingApi,
	type VendorListingResponse,
	type VendorListingTab,
} from "../api/vendorOnboarding.api";
import { vendorOnboardingKeys } from "../queries/useVendorMutations";

const DASHBOARD_PAGE_SIZE = 100;

const useVendorDashboardList = (
	tab: VendorListingTab,
	pageSize = 1,
) =>
	useQuery<VendorListingResponse>({
		queryKey: [
			...vendorOnboardingKeys.lists(),
			"dashboard",
			tab,
			pageSize,
		],
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

	const queries = [
		onboardingQuery,
		pendingQuery,
		approvedQuery,
		createdQuery,
	];

	const refresh = async (): Promise<void> => {
		await Promise.all(queries.map((query) => query.refetch()));
	};

	return {
		recentOnboardings: onboardingQuery.data?.rows ?? [],
		totalOnboardings: onboardingQuery.data?.totalCount ?? 0,
		pendingOnMe: pendingQuery.data?.totalCount ?? 0,
		approvedByMe: approvedQuery.data?.totalCount ?? 0,
		createdByMe: createdQuery.data?.totalCount ?? 0,
		isLoading: queries.some((query) => query.isLoading),
		isRefreshing: queries.some((query) => query.isFetching),
		error: queries.find((query) => query.error)?.error ?? null,
		refresh,
	};
}
