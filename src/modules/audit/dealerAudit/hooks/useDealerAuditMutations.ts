// modules/audit/dealerAudit/hooks/useDealerAuditMutations.ts
//
// Write-side orchestration: mutations + targeted cache updates + toasts.
// Errors are NOT toasted here — dialogs and forms render `mutation.error`
// inline so the user keeps their entered text and can retry.

import {
	useMutation,
	useQueryClient,
	type QueryClient,
} from "@tanstack/react-query";

import { useToast } from "../../../../context/Auth/AuthContext";
import { dealerAuditApi } from "../dealer-audit.api";
import {
	dealerAuditContent as content,
	formatDealerAuditMessage as format,
} from "../dealer-audit.content";
import { dealerAuditKeys } from "../dealer-audit.queries";
import type {
	AuditVersionVariables,
	CreateDealerAuditFormValues,
	DealerAudit,
	DealerAuditChecklist,
	DealerAuditChecklistItem,
	DeleteEvidenceVariables,
	ReAuditVariables,
	ReassignReviewerVariables,
	RaiseClarificationVariables,
	RejectAuditVariables,
	RespondToClarificationVariables,
	ApproveAuditVariables,
	ReviewAuditItemVariables,
	SaveAuditItemResult,
	SaveAuditItemVariables,
	UploadEvidenceVariables,
} from "../dealer-audit.types";

// ── Cache helpers ─────────────────────────────────────────────────────

const mapChecklistItems = (
	checklist: DealerAuditChecklist,
	itemId: string,
	update: (item: DealerAuditChecklistItem) => DealerAuditChecklistItem,
): DealerAuditChecklist => ({
	...checklist,
	sections: checklist.sections.map((section) => ({
		...section,
		items: section.items.map((item) =>
			item.id === itemId ? update(item) : item,
		),
	})),
});

/** Writes one saved item + the new audit status/version into the cache. */
function patchChecklistFromSave(
	queryClient: QueryClient,
	auditId: string,
	result: SaveAuditItemResult,
): void {
	queryClient.setQueryData<DealerAuditChecklist>(
		dealerAuditKeys.checklist(auditId),
		(current) =>
			current
				? {
						...mapChecklistItems(current, result.item.id, () => result.item),
						status: result.auditStatus,
						version: result.auditVersion,
					}
				: current,
	);
	queryClient.setQueryData<DealerAudit>(
		dealerAuditKeys.detail(auditId),
		(current) =>
			current
				? {
						...current,
						status: result.auditStatus,
						version: result.auditVersion,
						completedItems: result.completedItems,
						totalItems: result.totalItems,
					}
				: current,
	);
}

/** After a workflow transition: replace the detail, refresh the rest. */
function applyAuditTransition(
	queryClient: QueryClient,
	audit: DealerAudit,
): void {
	queryClient.setQueryData<DealerAudit>(
		dealerAuditKeys.detail(audit.id),
		audit,
	);
	// Only the affected families — never the whole app cache.
	void queryClient.invalidateQueries({
		queryKey: dealerAuditKeys.checklist(audit.id),
	});
	void queryClient.invalidateQueries({
		queryKey: dealerAuditKeys.history(audit.id),
	});
	void queryClient.invalidateQueries({
		queryKey: dealerAuditKeys.report(audit.id),
	});
	void queryClient.invalidateQueries({ queryKey: dealerAuditKeys.lists() });
}

type ToastCopy = { title: string; description: string };

function useSuccessToast() {
	const { showToast } = useToast();
	return (copy: ToastCopy) =>
		showToast({
			type: "success",
			title: copy.title,
			description: copy.description,
		});
}

// ── Dealer: self-assessment ───────────────────────────────────────────

export function useSaveAuditItem() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (variables: SaveAuditItemVariables) =>
			dealerAuditApi.saveAuditItem(variables),
		onSuccess: (result, variables) => {
			patchChecklistFromSave(queryClient, variables.auditId, result);
			// Autosave stays silent; only an explicit "mark complete" toasts.
			if (variables.markComplete) toastSuccess(content.toasts.itemSaved);
		},
	});
}

export function useUploadEvidence() {
	return useMutation({
		mutationFn: (variables: UploadEvidenceVariables) =>
			dealerAuditApi.uploadEvidence(variables),
	});
}

export function useDeleteEvidence() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: DeleteEvidenceVariables) =>
			dealerAuditApi.deleteEvidence(variables),
		onSuccess: (_result, variables) => {
			// The server detaches the photo and un-confirms the item.
			queryClient.setQueryData<DealerAuditChecklist>(
				dealerAuditKeys.checklist(variables.auditId),
				(current) =>
					current
						? mapChecklistItems(current, variables.itemId, (item) => ({
								...item,
								self: {
									...item.self,
									isComplete: false,
									evidence: item.self.evidence.filter(
										(evidence) => evidence.id !== variables.evidenceId,
									),
								},
							}))
						: current,
			);
			void queryClient.invalidateQueries({
				queryKey: dealerAuditKeys.detail(variables.auditId),
				exact: true,
			});
		},
	});
}

export function useSubmitAudit() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (variables: AuditVersionVariables) =>
			dealerAuditApi.submitAudit(variables),
		onSuccess: (audit) => {
			applyAuditTransition(queryClient, audit);
			toastSuccess(content.toasts.auditSubmitted);
		},
	});
}

export function useRespondToClarification() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (variables: RespondToClarificationVariables) =>
			dealerAuditApi.respondToClarification(variables),
		onSuccess: (item, variables) => {
			queryClient.setQueryData<DealerAuditChecklist>(
				dealerAuditKeys.checklist(variables.auditId),
				(current) =>
					current ? mapChecklistItems(current, item.id, () => item) : current,
			);
			// Status and the open-clarification count changed server-side.
			void queryClient.invalidateQueries({
				queryKey: dealerAuditKeys.detail(variables.auditId),
				exact: true,
			});
			toastSuccess(content.toasts.clarificationResponded);
		},
	});
}

// ── Reviewer ──────────────────────────────────────────────────────────

export function useStartReview() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (auditId: string) => dealerAuditApi.startReview(auditId),
		onSuccess: (audit) => {
			applyAuditTransition(queryClient, audit);
			toastSuccess(content.toasts.reviewStarted);
		},
	});
}

export function useReviewAuditItem() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (
			variables: ReviewAuditItemVariables & { selfScore: number | null },
		) => dealerAuditApi.reviewAuditItem(variables),
		onSuccess: (result, variables) => {
			patchChecklistFromSave(queryClient, variables.auditId, result);
			toastSuccess(content.toasts.itemReviewed);
		},
	});
}

export function useRaiseClarification() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (variables: RaiseClarificationVariables) =>
			dealerAuditApi.raiseClarification(variables),
		onSuccess: (audit) => {
			applyAuditTransition(queryClient, audit);
			toastSuccess(content.toasts.clarificationRaised);
		},
	});
}

export function useSubmitReview() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (variables: AuditVersionVariables) =>
			dealerAuditApi.submitReview(variables),
		onSuccess: (audit) => {
			applyAuditTransition(queryClient, audit);
			toastSuccess(content.toasts.reviewSubmitted);
		},
	});
}

// ── Approver ──────────────────────────────────────────────────────────

export function useApproveAudit() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (variables: ApproveAuditVariables) =>
			dealerAuditApi.approveAudit(variables),
		onSuccess: (audit) => {
			applyAuditTransition(queryClient, audit);
			toastSuccess(content.toasts.approved);
		},
	});
}

export function useRejectAudit() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (variables: RejectAuditVariables) =>
			dealerAuditApi.rejectAudit(variables),
		onSuccess: (audit) => {
			applyAuditTransition(queryClient, audit);
			toastSuccess(content.toasts.rejected);
		},
	});
}

// ── Admin / manager ───────────────────────────────────────────────────

export function useReassignReviewer() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (variables: ReassignReviewerVariables) =>
			dealerAuditApi.reassignReviewer(variables),
		onSuccess: (audit) => {
			applyAuditTransition(queryClient, audit);
			toastSuccess(content.toasts.reassigned);
		},
	});
}

export function useReAudit() {
	const queryClient = useQueryClient();
	const toastSuccess = useSuccessToast();

	return useMutation({
		mutationFn: (variables: ReAuditVariables) =>
			dealerAuditApi.reAudit(variables),
		onSuccess: (audit, variables) => {
			queryClient.setQueryData<DealerAudit>(
				dealerAuditKeys.detail(audit.id),
				audit,
			);
			void queryClient.invalidateQueries({
				queryKey: dealerAuditKeys.history(variables.auditId),
			});
			void queryClient.invalidateQueries({ queryKey: dealerAuditKeys.lists() });
			toastSuccess(content.toasts.reAuditCreated);
		},
	});
}

export function useCreateDealerAudits() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	return useMutation({
		mutationFn: (values: CreateDealerAuditFormValues) =>
			dealerAuditApi.createAudits(values),
		onSuccess: (audits) => {
			void queryClient.invalidateQueries({ queryKey: dealerAuditKeys.lists() });
			showToast({
				type: "success",
				title: content.toasts.auditsCreated.title,
				description: format(content.toasts.auditsCreated.description, {
					count: audits.length,
				}),
			});
		},
	});
}
