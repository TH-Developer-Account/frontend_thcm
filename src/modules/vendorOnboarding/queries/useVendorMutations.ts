import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	vendorInitationApi,
	vendorOnboardingApi,
	type ActivateFirstStageEdit,
} from "../api/vendorOnboarding.api";
import type { VendorOnboardingResponse } from "../types/vendorOnboarding.types";
import type { VendorOnboardingInitiationPayload } from "../types/vendorListing.types";

export const vendorOnboardingKeys = {
	all: ["vendor-onboarding"] as const,
	lists: () => [...vendorOnboardingKeys.all, "list"] as const,
	detail: (id: string) => [...vendorOnboardingKeys.all, "detail", id] as const,
	publicSession: (token: string) =>
		[...vendorOnboardingKeys.all, "public-session", token] as const,
};

const invalidateVendor = (
	queryClient: ReturnType<typeof useQueryClient>,
	vendorRequestId?: string,
) => {
	queryClient.invalidateQueries({ queryKey: vendorOnboardingKeys.lists() });
	if (vendorRequestId) {
		queryClient.invalidateQueries({
			queryKey: vendorOnboardingKeys.detail(vendorRequestId),
		});
	}
};

export function useVendorOnboardingDetailQuery(
	vendorRequestId: string,
	enabled = true,
) {
	return useQuery<VendorOnboardingResponse>({
		queryKey: vendorOnboardingKeys.detail(vendorRequestId),
		queryFn: () => vendorOnboardingApi.getById(vendorRequestId),
		enabled: enabled && Boolean(vendorRequestId),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});
}

export function useVendorInitiationDetailQuery(
	vendorRequestId: string,
	enabled = true,
) {
	return useQuery<VendorOnboardingInitiationPayload>({
		queryKey: vendorOnboardingKeys.detail(vendorRequestId),
		queryFn: () => vendorInitationApi.getById(vendorRequestId),
		enabled: enabled && Boolean(vendorRequestId),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});
}

export function usePublicVendorSessionQuery(token: string, enabled = true) {
	const normalizedToken = token.trim();
	return useQuery({
		queryKey: vendorOnboardingKeys.publicSession(normalizedToken),
		queryFn: () => vendorOnboardingApi.getByToken(normalizedToken),
		enabled: enabled && Boolean(normalizedToken),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});
}

export function useCreateVendorMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: vendorOnboardingApi.create,
		onSuccess: () => invalidateVendor(queryClient),
	});
}

export function useUpdateVendorMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: vendorOnboardingApi.update,
		onSuccess: (_data, variables) =>
			invalidateVendor(queryClient, variables.vendorRequestId),
	});
}

export function useSubmitVendorMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: vendorOnboardingApi.submit,
		onSuccess: (_data, vendorRequestId) =>
			invalidateVendor(queryClient, vendorRequestId),
	});
}

export function useAcceptAndCloseVendorMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: vendorOnboardingApi.acceptAndClose,
		onSuccess: (_data, vendorRequestId) =>
			invalidateVendor(queryClient, vendorRequestId),
	});
}

export function useSubmitPublicVendorFormMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ token, formData }: { token: string; formData: FormData }) =>
			vendorOnboardingApi.submitPublic(token, formData),
		onSuccess: () => invalidateVendor(queryClient),
	});
}

export function useDraftSubmitPublicVendorFormMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ token, formData }: { token: string; formData: FormData }) =>
			vendorOnboardingApi.draftSubmitPublic(token, formData),
		onSuccess: () => invalidateVendor(queryClient),
	});
}
export const useSubmitClarifiedUpdatedFormMutation = () => {
	return useMutation({
		mutationFn: ({
			workflowId,
			stageEdits,
		}: {
			workflowId: string;
			stageEdits?: ActivateFirstStageEdit[];
		}) => vendorOnboardingApi.activateFirstStage(workflowId, stageEdits),
	});
};

export function useSendBackToVendorMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (vendorRequestId: string) =>
			vendorOnboardingApi.sendBackToVendor(vendorRequestId),

		onSuccess: (_data, vendorRequestId) =>
			invalidateVendor(queryClient, vendorRequestId),
	});
}
