import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorOnboardingApi } from "../api/vendorOnboarding.api";

export const vendorOnboardingKeys = {
	all: ["vendor-onboarding"] as const,
	lists: () => [...vendorOnboardingKeys.all, "list"] as const,
	detail: (vendorRequestId?: string) =>
		[...vendorOnboardingKeys.all, "detail", vendorRequestId] as const,
};

export function useVendorOnboardingDetailQuery(vendorRequestId?: string) {
	return useQuery({
		queryKey: vendorOnboardingKeys.detail(vendorRequestId),
		queryFn: () => vendorOnboardingApi.getById(vendorRequestId || ""),
		enabled: Boolean(vendorRequestId),
	});
}

export function useCreateVendorFormOneMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.createFormOne,

		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.lists(),
			});

			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(data.id),
			});
		},
	});
}

export function useUpdateVendorFormOneMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.updateFormOne,

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(variables.vendorRequestId),
			});
		},
	});
}

export function useCreateVendorFormTwoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.createFormTwo,

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(variables.vendorRequestId),
			});
		},
	});
}

export function useUpdateVendorFormTwoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.updateFormTwo,

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(variables.vendorRequestId),
			});
		},
	});
}

export function useSubmitVendorSummaryMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.submitSummary,

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(variables.vendorRequestId),
			});
		},
	});
}

export function useApproveVendorMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.approve,

		onSuccess: (_, vendorRequestId) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(vendorRequestId),
			});
		},
	});
}

export function useClarifyVendorMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.clarify,

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(variables.vendorRequestId),
			});
		},
	});
}

export function useAcceptAndCloseVendorMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.acceptAndClose,

		onSuccess: (_, vendorRequestId) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(vendorRequestId),
			});
		},
	});
}

export function useAddVendorCommentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.addComment,

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(variables.vendorRequestId),
			});
		},
	});
}

export function useDeleteVendorMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.delete,

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.lists(),
			});

			queryClient.removeQueries({
				queryKey: vendorOnboardingKeys.detail(variables.vendorRequestId),
			});
		},
	});
}
