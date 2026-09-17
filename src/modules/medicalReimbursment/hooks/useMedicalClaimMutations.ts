import {
	useMutation,
	useQuery,
	useQueryClient,
	type QueryClient,
} from "@tanstack/react-query";

import { medicalClaimApi } from "../api/medicalClaim.api";
import { publicReimburseClaimApi } from "../../guest/guestMedicalForms/reimbursementClaim.api";
import type {
	ExportListingParams,
	MedicalClaimDetail,
} from "../types/medicalClaimListing.types";
export const medicalClaimKeys = {
	all: ["medical-claims"] as const,

	lists: () => [...medicalClaimKeys.all, "list"] as const,

	detail: (claimId: string) =>
		[...medicalClaimKeys.all, "detail", claimId] as const,

	publicSession: (token: string) =>
		[...medicalClaimKeys.all, "public-session", token] as const,
};

const invalidateMedicalClaims = (
	queryClient: QueryClient,
	claimId?: string,
) => {
	void queryClient.invalidateQueries({
		queryKey: medicalClaimKeys.lists(),
	});

	if (claimId) {
		void queryClient.invalidateQueries({
			queryKey: medicalClaimKeys.detail(claimId),
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
	return useMutation({
		mutationFn: medicalClaimApi.initiate,
	});
}

export function useResendMedicalClaimLinkMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: medicalClaimApi.resendLink,
		onSuccess: (_data, claimId) => {
			invalidateMedicalClaims(queryClient, claimId);
		},
	});
}

export function useCloseMedicalClaimMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: medicalClaimApi.close,
		onSuccess: (_data, claimId) => {
			invalidateMedicalClaims(queryClient, claimId);
		},
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

		onSuccess: (updatedClaim, variables) => {
			queryClient.setQueryData(
				medicalClaimKeys.detail(variables.claimId),
				updatedClaim,
			);
		},
	});
}

export function usePublicMedicalClaimQuery(token: string, enabled = true) {
	const normalizedToken = token.trim();

	return useQuery({
		queryKey: medicalClaimKeys.publicSession(normalizedToken),
		queryFn: () => publicReimburseClaimApi.getByToken(normalizedToken),
		enabled: enabled && Boolean(normalizedToken),
		retry: false,
		...DETAIL_QUERY_CACHE_OPTIONS,
	});
}

export function useSubmitPublicMedicalClaimMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ token, formData }: { token: string; formData: FormData }) =>
			publicReimburseClaimApi.submit(token, formData),

		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({
				queryKey: medicalClaimKeys.publicSession(variables.token.trim()),
			});
		},
	});
}

export function useSavePublicMedicalClaimDraftMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ token, formData }: { token: string; formData: FormData }) =>
			publicReimburseClaimApi.saveDraft(token, formData),

		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({
				queryKey: medicalClaimKeys.publicSession(variables.token.trim()),
			});
		},
	});
}
export function useMedicalClaimPdfUrlMutation() {
	return useMutation({
		mutationFn: ({ claimId }: { claimId: string }) =>
			medicalClaimApi.getPdfUrl("MEDICAL_CLAIM", claimId),
	});
}

export function useExportMedicalClaimListingMutation() {
	return useMutation({
		mutationFn: (params: ExportListingParams) =>
			medicalClaimApi.enqueueListingExport(params),
	});
}

export function useExportMedicalClaimMutation() {
	return useMutation({
		mutationFn: (claimId: string) => medicalClaimApi.exportOne(claimId),
	});
}

/**
 * Persists one bill's approved amount + remarks. Backend returns no body,
 * so we patch the cached claim detail from the mutation variables directly.
 */
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

		onSuccess: (_data, variables) => {
			queryClient.setQueryData<MedicalClaimDetail>(
				medicalClaimKeys.detail(variables.claimId),
				(current) => {
					if (!current) return current;
					return {
						...current,
						bills: current.bills.map((bill) =>
							bill.id === variables.lineItem.id
								? {
										...bill,
										approved: true,
										approvedClaimAmount: String(
											variables.lineItem.approvedClaimAmount,
										),
										remarks: variables.lineItem.remarks ?? bill.remarks,
									}
								: bill,
						),
					};
				},
			);
		},
	});
}

/**
 * Persists one bill's remarks (flagged/not-approved rows). Backend returns
 * no body, so we patch the cache from variables directly.
 */
export function useSaveMedicalClaimLineItemRemarksMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			claimId,
			lineItem,
		}: {
			claimId: string;
			lineItem: Parameters<typeof medicalClaimApi.saveLineItemRemarks>[1];
		}) => medicalClaimApi.saveLineItemRemarks(claimId, lineItem),

		onSuccess: (_data, variables) => {
			queryClient.setQueryData<MedicalClaimDetail>(
				medicalClaimKeys.detail(variables.claimId),
				(current) => {
					if (!current) return current;
					return {
						...current,
						bills: current.bills.map((bill) =>
							bill.id === variables.lineItem.id
								? { ...bill, remarks: variables.lineItem.remarks ?? null }
								: bill,
						),
					};
				},
			);
		},
	});
}
