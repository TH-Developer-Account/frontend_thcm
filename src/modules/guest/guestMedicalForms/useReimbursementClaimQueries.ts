import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { guestReimburseClaimApi } from "./reimbursementClaim.api";
import { MEDICLAIM_BACKEND } from "../../medicalReimbursment/utils/mediclaimBackend.config";

import type { ReimbursementClaimListParams } from "./reimbursementClaim.types";

export const reimbursementClaimKeys = {
	all: ["medi-claim"] as const,

	guestLists: () => [...reimbursementClaimKeys.all, "guest-list"] as const,

	guestList: (params: ReimbursementClaimListParams) =>
		[...reimbursementClaimKeys.guestLists(), params] as const,

	guestDetail: (claimId: string) =>
		[...reimbursementClaimKeys.all, "guest-detail", claimId] as const,

	guestProfile: () => [...reimbursementClaimKeys.all, "guest-profile"] as const,
};

export function useGuestClaimProfileQuery(enabled = true) {
	return useQuery({
		queryKey: reimbursementClaimKeys.guestProfile(),
		queryFn: () => guestReimburseClaimApi.getProfile(),
		enabled: enabled && MEDICLAIM_BACKEND.guestCreateClaim,
		staleTime: 60_000,
		refetchOnWindowFocus: false,
	});
}

export const useReimbursementClaimListQuery = (
	params: ReimbursementClaimListParams,
	enabled = true,
) =>
	useQuery({
		queryKey: reimbursementClaimKeys.guestList(params),
		queryFn: () => guestReimburseClaimApi.guestList(params),
		enabled,
		placeholderData: keepPreviousData,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

export function useGuestReimbursementClaimDetailQuery(
	claimId: string,
	enabled = true,
) {
	return useQuery({
		queryKey: reimbursementClaimKeys.guestDetail(claimId),
		queryFn: () => guestReimburseClaimApi.guestGetById(claimId),
		enabled: enabled && Boolean(claimId),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});
}

export function useCreateGuestMedicalClaimMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (formData: FormData) => guestReimburseClaimApi.createGuest(formData),

		onSuccess: (claim) => {
			if (claim?.id) {
				queryClient.setQueryData(reimbursementClaimKeys.guestDetail(claim.id), claim);
			}
			void queryClient.invalidateQueries({
				queryKey: reimbursementClaimKeys.guestLists(),
			});
			void queryClient.invalidateQueries({
				queryKey: reimbursementClaimKeys.guestProfile(),
			});
		},
	});
}

export function useResubmitGuestMedicalClaimMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ claimId, formData }: { claimId: string; formData: FormData }) =>
			guestReimburseClaimApi.resubmitGuest(claimId, formData),

		// Use the returned claim when present; otherwise refetch. Never write
		// `undefined` into the cache (that wiped the detail → "Unable to load").
		onSuccess: (claim, variables) => {
			const key = reimbursementClaimKeys.guestDetail(variables.claimId);
			if (claim?.id) {
				queryClient.setQueryData(key, claim);
			} else {
				void queryClient.invalidateQueries({ queryKey: key });
			}
			void queryClient.invalidateQueries({
				queryKey: reimbursementClaimKeys.guestLists(),
			});
		},
	});
}
