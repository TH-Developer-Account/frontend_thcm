import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reimbursementClaimApi } from "./reimbursementClaim.api";
import { reimbursementClaimKeys } from "./useReimbursementClaimQueries";

const useInvalidateClaim = () => {
	const queryClient = useQueryClient();

	return (claimId?: string) => {
		queryClient.invalidateQueries({ queryKey: reimbursementClaimKeys.lists() });
		if (claimId) {
			queryClient.invalidateQueries({
				queryKey: reimbursementClaimKeys.detail(claimId),
			});
		}
	};
};

export const useCreateReimbursementDraftMutation = () => {
	const invalidateClaim = useInvalidateClaim();
	return useMutation({
		mutationFn: reimbursementClaimApi.createDraft,
		onSuccess: (claim) => invalidateClaim(claim.id),
	});
};

export const useUpdateReimbursementClaimMutation = () => {
	const invalidateClaim = useInvalidateClaim();
	return useMutation({
		mutationFn: reimbursementClaimApi.update,
		onSuccess: (claim) => invalidateClaim(claim.id),
	});
};

export const useSubmitReimbursementClaimMutation = () => {
	const invalidateClaim = useInvalidateClaim();
	return useMutation({
		mutationFn: reimbursementClaimApi.submit,
		onSuccess: (claim) => invalidateClaim(claim.id),
	});
};

export const useSavePublicReimbursementDraftMutation = () => {
	const invalidateClaim = useInvalidateClaim();
	return useMutation({
		mutationFn: reimbursementClaimApi.savePublicDraft,
		onSuccess: (claim) => invalidateClaim(claim.id),
	});
};

export const useSubmitPublicReimbursementClaimMutation = () => {
	const invalidateClaim = useInvalidateClaim();
	return useMutation({
		mutationFn: reimbursementClaimApi.submitPublic,
		onSuccess: (claim) => invalidateClaim(claim.id),
	});
};

