import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { vendorOnboardingApi } from "../api/vendorOnboarding.api";

export const vendorOnboardingKeys = {
	all: ["vendor-onboarding"] as const,
	lists: () => [...vendorOnboardingKeys.all, "list"] as const,
	details: () => [...vendorOnboardingKeys.all, "detail"] as const,
	detail: (vendorRequestId: string) =>
		[...vendorOnboardingKeys.details(), vendorRequestId] as const,
	publicSession: (token: string) =>
		[...vendorOnboardingKeys.all, "public-session", token] as const,
};

export type SubmitPublicVendorFormVariables = {
	token: string;
	formData: FormData;
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

export function useVendorOnboardingDetailQuery(
	vendorRequestId: string,
	enabled = true,
) {
	return useQuery({
		queryKey: vendorOnboardingKeys.detail(vendorRequestId),
		queryFn: () => vendorOnboardingApi.getById(vendorRequestId),
		enabled: enabled && Boolean(vendorRequestId),
		retry: false,
		staleTime: 0,
		refetchOnMount: "always",
		refetchOnWindowFocus: false,
	});
}

export function useUpdateVendorFormOneMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.updateFormOne,
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(variables.vendorRequestId),
			});

			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.lists(),
			});
		},
	});
}

export function useUpdateVendorFormTwoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: vendorOnboardingApi.updateFormTwo,
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(variables.vendorRequestId),
			});

			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.lists(),
			});
		},
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

export function usePublicVendorSessionQuery(token: string, enabled = true) {
	const normalizedToken = token.trim();

	return useQuery({
		queryKey: vendorOnboardingKeys.publicSession(normalizedToken),
		queryFn: () => vendorOnboardingApi.getByToken(normalizedToken),
		enabled: enabled && normalizedToken.length > 0,
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});
}

export function useSubmitPublicVendorFormMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ token, formData }: SubmitPublicVendorFormVariables) =>
			vendorOnboardingApi.submitVendorForm(token, formData),

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.lists(),
			});
		},
	});
}
