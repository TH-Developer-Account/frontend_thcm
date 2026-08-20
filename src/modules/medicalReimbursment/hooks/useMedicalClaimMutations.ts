import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { medicalClaimApi } from "../api/medicalClaim.api";
import { guestReimburseClaimApi } from "../../guest/guestMedicalForms/reimbursementClaim.api";

export const medicalClaimKeys = {
	all: ["medical-claims"] as const,
	lists: () => [...medicalClaimKeys.all, "list"] as const,
	detail: (claimId: string) =>
		[...medicalClaimKeys.all, "detail", claimId] as const,
	publicSession: (token: string) =>
		[...medicalClaimKeys.all, "public-session", token] as const,
	guestLists: () => [...medicalClaimKeys.all, "guest-list"] as const,
	guestDetail: (claimId: string) =>
		[...medicalClaimKeys.all, "guest-detail", claimId] as const,
};

const invalidateMedicalClaims = (
	queryClient: ReturnType<typeof useQueryClient>,
	claimId?: string,
) => {
	void queryClient.invalidateQueries({ queryKey: medicalClaimKeys.lists() });
	void queryClient.invalidateQueries({
		queryKey: medicalClaimKeys.guestLists(),
	});
	if (claimId) {
		void queryClient.invalidateQueries({
			queryKey: medicalClaimKeys.detail(claimId),
		});
		void queryClient.invalidateQueries({
			queryKey: medicalClaimKeys.guestDetail(claimId),
		});
	}
};

const DETAIL_QUERY_CACHE_OPTIONS = {
	staleTime: Infinity,
	gcTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

export function useMedicalClaimDetailQuery(claimId: string, enabled = true) {
	return useQuery({
		queryKey: medicalClaimKeys.detail(claimId),
		queryFn: () => medicalClaimApi.getById(claimId),
		enabled: enabled && Boolean(claimId),
		retry: false,
		...DETAIL_QUERY_CACHE_OPTIONS,
	});
}

export function useInitiateMedicalClaimMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: medicalClaimApi.initiate,
		onSuccess: () => invalidateMedicalClaims(queryClient),
	});
}

export function useResendMedicalClaimLinkMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: medicalClaimApi.resendLink,
		onSuccess: (_data, claimId) =>
			invalidateMedicalClaims(queryClient, claimId),
	});
}

export function useCloseMedicalClaimMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: medicalClaimApi.close,
		onSuccess: (_data, claimId) =>
			invalidateMedicalClaims(queryClient, claimId),
	});
}

export function useUpdateMedicalClaimMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			claimId,
			formData,
		}: {
			claimId: string;
			formData: FormData;
		}) => medicalClaimApi.update(claimId, formData),
		onSuccess: (_data, variables) =>
			invalidateMedicalClaims(queryClient, variables.claimId),
	});
}

export function useApproveMedicalClaimLineItemMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			claimId,
			lineItem,
		}: {
			claimId: string;
			lineItem: Parameters<typeof medicalClaimApi.approveLineItem>[1];
		}) => medicalClaimApi.approveLineItem(claimId, lineItem),
		onSuccess: (_data, variables) =>
			invalidateMedicalClaims(queryClient, variables.claimId),
	});
}

export function usePublicMedicalClaimQuery(token: string, enabled = true) {
	const normalizedToken = token.trim();
	return useQuery({
		queryKey: medicalClaimKeys.publicSession(normalizedToken),
		queryFn: () => medicalClaimApi.getPublicByToken(normalizedToken),
		enabled: enabled && Boolean(normalizedToken),
		retry: false,
		...DETAIL_QUERY_CACHE_OPTIONS,
	});
}

export function useSubmitPublicMedicalClaimMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ token, formData }: { token: string; formData: FormData }) =>
			medicalClaimApi.submitPublic(token, formData),
		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({
				queryKey: medicalClaimKeys.publicSession(variables.token.trim()),
			});
			invalidateMedicalClaims(queryClient);
		},
	});
}

export function useSavePublicMedicalClaimDraftMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ token, formData }: { token: string; formData: FormData }) =>
			medicalClaimApi.savePublicDraft(token, formData),

		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({
				queryKey: medicalClaimKeys.publicSession(variables.token.trim()),
			});
		},
	});
}

export function useGuestMedicalClaimsQuery(enabled = true) {
	return useQuery({
		queryKey: medicalClaimKeys.guestLists(),
		queryFn: medicalClaimApi.listGuestClaims,
		enabled,
		retry: false,
	});
}

export function useGuestMedicalClaimDetailQuery(
	claimId: string,
	enabled = true,
) {
	return useQuery({
		queryKey: medicalClaimKeys.guestDetail(claimId),
		queryFn: () => medicalClaimApi.getGuestById(claimId),
		enabled: enabled && Boolean(claimId),
		retry: false,
		...DETAIL_QUERY_CACHE_OPTIONS,
	});
}

export function useResubmitGuestMedicalClaimMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			claimId,
			formData,
		}: {
			claimId: string;
			formData: FormData;
		}) => guestReimburseClaimApi.resubmitGuest(claimId, formData),
		onSuccess: (_data, variables) =>
			invalidateMedicalClaims(queryClient, variables.claimId),
	});
}
