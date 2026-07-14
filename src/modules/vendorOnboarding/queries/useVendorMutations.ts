import { useMutation, useQueryClient } from "@tanstack/react-query";

import { vendorOnboardingApi } from "../api/vendorOnboarding.api";

export const vendorOnboardingKeys = {
	all: ["vendor-onboarding"] as const,
	lists: () => [...vendorOnboardingKeys.all, "list"] as const,
};

export function useCreateVendorFormOneMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.createFormOne,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.lists(),
			});
		},
	});
}

export function useUpdateVendorFormOneMutation() {
	return useMutation({
		mutationFn: vendorOnboardingApi.updateFormOne,
	});
}

export function useUpdateVendorFormTwoMutation() {
	return useMutation({
		mutationFn: vendorOnboardingApi.updateFormTwo,
	});
}

export function useSubmitVendorSummaryMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.submitSummary,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.lists(),
			});
		},
	});
}

export function useAcceptAndCloseVendorMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.acceptAndClose,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.lists(),
			});
		},
	});
}
