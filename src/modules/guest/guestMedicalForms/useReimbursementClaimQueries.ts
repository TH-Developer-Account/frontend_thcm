import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { reimbursementClaimApi } from "./reimbursementClaim.api";
import type { ReimbursementClaimListParams } from "./reimbursementClaim.types";

export const reimbursementClaimKeys = {
	all: ["medical-reimbursement"] as const,
	lists: () => [...reimbursementClaimKeys.all, "list"] as const,
	list: (params: ReimbursementClaimListParams) =>
		[...reimbursementClaimKeys.lists(), params] as const,
	details: () => [...reimbursementClaimKeys.all, "detail"] as const,
	detail: (claimId: string) =>
		[...reimbursementClaimKeys.details(), claimId] as const,
	publicSession: (sessionCode: string) =>
		[...reimbursementClaimKeys.all, "public-session", sessionCode] as const,
};

export const useReimbursementClaimListQuery = (
	params: ReimbursementClaimListParams,
) =>
	useQuery({
		queryKey: reimbursementClaimKeys.list(params),
		queryFn: () => reimbursementClaimApi.list(params),
		placeholderData: keepPreviousData,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

export const useReimbursementClaimDetailQuery = (
	claimId: string,
	enabled = true,
) =>
	useQuery({
		queryKey: reimbursementClaimKeys.detail(claimId),
		queryFn: () => reimbursementClaimApi.getById(claimId),
		enabled: enabled && Boolean(claimId),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

export const usePublicClaimSessionQuery = (
	sessionCode: string,
	enabled = true,
) => {
	const normalizedCode = sessionCode.trim();

	return useQuery({
		queryKey: reimbursementClaimKeys.publicSession(normalizedCode),
		queryFn: () => reimbursementClaimApi.getPublicSession(normalizedCode),
		enabled: enabled && Boolean(normalizedCode),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});
};

