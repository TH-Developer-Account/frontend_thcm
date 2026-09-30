import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	vendorInitationApi,
	vendorOnboardingApi,
} from "../api/vendorOnboarding.api";
import type { VendorOnboardingResponse } from "../types/vendorOnboarding.types";
import type { VendorOnboardingInitiationPayload } from "../types/vendorListing.types";
import {
	workflowApi,
	type ActivateFirstStagePayload,
} from "../../workflows/api/workflow.api";
import { auditKeys } from "../../../components/ui/audit/audit.keys";

const VENDOR_AUDIT_SUBJECT_TYPE = "VENDOR_ONBOARDING";

export const vendorOnboardingKeys = {
	all: ["vendor-onboarding"] as const,
	lists: () => [...vendorOnboardingKeys.all, "list"] as const,
	detail: (id: string) => [...vendorOnboardingKeys.all, "detail", id] as const,
	publicSession: (token: string) =>
		[...vendorOnboardingKeys.all, "public-session", token] as const,
};

export const invalidateVendor = (
	queryClient: ReturnType<typeof useQueryClient>,
	vendorRequestId?: string,
): Promise<unknown> => {
	const tasks: Promise<unknown>[] = [
		queryClient.invalidateQueries({ queryKey: vendorOnboardingKeys.lists() }),
	];

	if (vendorRequestId) {
		tasks.push(
			queryClient.invalidateQueries({
				queryKey: vendorOnboardingKeys.detail(vendorRequestId),
			}),
			queryClient.invalidateQueries({
				queryKey: auditKeys.log(VENDOR_AUDIT_SUBJECT_TYPE, vendorRequestId),
				refetchType: "all",
			}),
		);
	}

	return Promise.all(tasks);
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
		refetchOnMount: "always",
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

type UpdateVendorVariables = Parameters<typeof vendorOnboardingApi.update>[0];

export function useUpdateVendorMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		// skipInvalidate is a client-only flag — strip it before the API call.
		mutationFn: ({
			skipInvalidate: _skipInvalidate,
			...variables
		}: UpdateVendorVariables & { skipInvalidate?: boolean }) =>
			vendorOnboardingApi.update(variables),
		onSuccess: (_data, variables) =>
			variables.skipInvalidate
				? undefined
				: invalidateVendor(queryClient, variables.vendorRequestId),
	});
}

export function useUpdateVendorWithDocumentsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: vendorOnboardingApi.updateWithDocuments,
		// Same refresh as a plain update — the refetched detail brings the
		// new documents back with their URLs, so Form One shows them again
		// when the user navigates back to step 1.
		onSuccess: (_data, variables) =>
			invalidateVendor(queryClient, variables.vendorRequestId),
	});
}

export function useSubmitVendorMutation({
	invalidateOnSuccess = true,
}: { invalidateOnSuccess?: boolean } = {}) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: vendorOnboardingApi.submit,
		onSuccess: (_data, vendorRequestId) =>
			invalidateOnSuccess
				? invalidateVendor(queryClient, vendorRequestId)
				: undefined,
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
		mutationFn: (payload: ActivateFirstStagePayload) =>
			workflowApi.activateFirstStage(payload),
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
