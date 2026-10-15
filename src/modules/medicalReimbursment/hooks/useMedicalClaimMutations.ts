import {
	useMutation,
	useQuery,
	useQueryClient,
	type QueryClient,
} from "@tanstack/react-query";

import { medicalClaimApi, type ApproveLineItemPayload } from "../api/medicalClaim.api";
import { publicReimburseClaimApi } from "../../guest/guestMedicalForms/reimbursementClaim.api";
import type {
	ExportListingParams,
	MedicalClaimDetail,
	ReviewedBill,
} from "../types/medicalClaimListing.types";

export const medicalClaimKeys = {
	all: ["medical-claims"] as const,

	lists: () => [...medicalClaimKeys.all, "list"] as const,

	detail: (claimId: string) =>
		[...medicalClaimKeys.all, "detail", claimId] as const,

	publicSession: (token: string) =>
		[...medicalClaimKeys.all, "public-session", token] as const,

	grades: (source: string) => [...medicalClaimKeys.all, "grades", source] as const,
};

export const invalidateMedicalClaims = (
	queryClient: QueryClient,
	claimId?: string,
) => {
	void queryClient.invalidateQueries({ queryKey: medicalClaimKeys.lists() });
	if (claimId) {
		void queryClient.invalidateQueries({
			queryKey: medicalClaimKeys.detail(claimId),
		});
	}
};

// The detail is the form's initial state: refetching in the background
// would reset what the user is typing, so it only refreshes when a mutation
// invalidates it (or on explicit refetch).
const DETAIL_QUERY_CACHE_OPTIONS = {
	staleTime: Infinity,
	gcTime: 5 * 60_000,
	refetchOnMount: "always",
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
		// onSettled, not onSuccess: the backend creates the claim before it
		// emails the link, so even a failed request may have added a row.
		onSettled: () => invalidateMedicalClaims(queryClient),
	});
}

export function useResendMedicalClaimLinkMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: medicalClaimApi.resendLink,
		onSuccess: (_data, claimId) => invalidateMedicalClaims(queryClient, claimId),
	});
}

export function useCloseMedicalClaimMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: medicalClaimApi.close,
		onSuccess: (_data, claimId) => invalidateMedicalClaims(queryClient, claimId),
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
		refetchOnMount: false,
	});
}

export function useSubmitPublicMedicalClaimMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ token, formData }: { token: string; formData: FormData }) =>
			publicReimburseClaimApi.submit(token, formData),

		// The token is single-use: refetching it now would fail with "link
		// already used", so mark the cached session as submitted instead of
		// invalidating it.
		onSuccess: (_data, variables) => {
			queryClient.setQueryData<MedicalClaimDetail>(
				medicalClaimKeys.publicSession(variables.token.trim()),
				(current) => (current ? { ...current, status: "IN_PROGRESS" } : current),
			);
		},
	});
}

export function useSavePublicMedicalClaimDraftMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ token, formData }: { token: string; formData: FormData }) =>
			publicReimburseClaimApi.saveDraft(token, formData),

		// After a draft the form must re-sync with the server: new bills now
		// have real ids, so the next save updates them instead of re-creating
		// them (and deleting their attachments). The current backend returns
		// no claim, so refetch — and wait for it, so a second click can't send
		// stale ids.
		onSuccess: async (claim, variables) => {
			const key = medicalClaimKeys.publicSession(variables.token.trim());
			if (claim && typeof claim === "object" && "id" in claim) {
				queryClient.setQueryData(key, claim);
				return;
			}
			await queryClient.refetchQueries({ queryKey: key, exact: true });
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

/** Writes reviewed-bill fields from the server response into the detail cache. */
const patchBillInCache = (
	queryClient: QueryClient,
	claimId: string,
	billId: string,
	patch: Partial<MedicalClaimDetail["bills"][number]>,
) => {
	queryClient.setQueryData<MedicalClaimDetail>(
		medicalClaimKeys.detail(claimId),
		(current) =>
			current
				? {
						...current,
						bills: current.bills.map((bill) =>
							bill.id === billId ? { ...bill, ...patch } : bill,
						),
					}
				: current,
	);
};

const reviewedToPatch = (reviewed: ReviewedBill) => ({
	approved: reviewed.approved,
	approvedClaimAmount: reviewed.approvedClaimAmount,
	remarks: reviewed.remarks,
});

/** Approves one bill; the cache is patched from the server's response. */
export function useApproveMedicalClaimLineItemMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			claimId,
			lineItem,
		}: {
			claimId: string;
			lineItem: ApproveLineItemPayload;
		}) => medicalClaimApi.approveLineItem(claimId, lineItem),

		onSuccess: (reviewed, { claimId, lineItem }) => {
			patchBillInCache(
				queryClient,
				claimId,
				lineItem.id,
				reviewed
					? reviewedToPatch(reviewed)
					: {
							approved: true,
							approvedClaimAmount: lineItem.approvedClaimAmount ?? null,
							remarks: lineItem.remarks ?? null,
						},
			);
		},
	});
}

export function useUnapproveMedicalClaimLineItemMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ claimId, billId }: { claimId: string; billId: string }) =>
			medicalClaimApi.unapproveLineItem(claimId, billId),

		onSuccess: (reviewed, { claimId, billId }) => {
			patchBillInCache(
				queryClient,
				claimId,
				billId,
				reviewed
					? reviewedToPatch(reviewed)
					: { approved: false, approvedClaimAmount: null },
			);
		},
	});
}

/** Persists one bill's remarks (flagged / not-approved rows). */
export function useSaveMedicalClaimLineItemRemarksMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			claimId,
			lineItem,
		}: {
			claimId: string;
			lineItem: { id: string; remarks?: string | null };
		}) => medicalClaimApi.saveLineItemRemarks(claimId, lineItem),

		onSuccess: (_data, { claimId, lineItem }) => {
			patchBillInCache(queryClient, claimId, lineItem.id, {
				remarks: lineItem.remarks?.trim() || null,
			});
		},
	});
}
