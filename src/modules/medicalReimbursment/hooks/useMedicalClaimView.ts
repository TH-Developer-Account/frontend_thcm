import * as React from "react";
import { useNavigate } from "react-router-dom";

import {
	getWorkflowCommentContext,
	type MentionableUserInput,
} from "../../../components/ui/comments";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import {
	useApproveWorkflowStageMutation,
	useClarifyWorkflowStageMutation,
} from "../../workflows/context/useWorkflowMutations";
import {
	getWorkflowApproverData,
	type ActiveWorkflowLike,
	type ApprovalStageLike,
} from "../../workflows";
import {
	deriveAnnualCap,
	toMedicalClaimFormValues,
	toMedicalClaimLineItems,
	toEligibilityHoldProps,
} from "../helpers/medicalClaimListing.mapper";
import type { MedicalClaimDetail } from "../types/medicalClaimListing.types";
import type { ClaimHeadRow } from "../types/reimbursementClaim.types";
import {
	useApproveMedicalClaimLineItemMutation,
	useCloseMedicalClaimMutation,
	useExportMedicalClaimMutation,
	useMedicalClaimDetailQuery,
	useMedicalClaimPdfUrlMutation,
	useSaveMedicalClaimBillRemarksMutation,
	useSaveMedicalClaimLineItemRemarksMutation,
	useUnapproveMedicalClaimLineItemMutation,
} from "./useMedicalClaimMutations";
import { useMedicalClaimPermissions } from "./useMedicalClaimPermissions";
import { useGradeOptions } from "./useGradeOptions";
import { resolveApprovedAmount } from "./useReimbursementClaimForm";
import { MEDICLAIM_BACKEND } from "../utils/mediclaimBackend.config";

type MedicalClaimViewDetail = MedicalClaimDetail & {
	activeWorkflow?: ActiveWorkflowLike<ApprovalStageLike> | null;
	createdBy?: MentionableUserInput | null;
	created_by?: MentionableUserInput | null;
	initiatedBy?: MentionableUserInput | null;
};

type UseMedicalClaimViewArgs = {
	claimId: string;
};

type WorkflowActionResponse = { message?: string } | undefined;

/** Where an approver lands after approving a claim. */
export const AFTER_APPROVE_PATH = "/medi-claim/listing?tab=approvedByMe";

/** Once the last approver has approved, the claim's chat is read-only. */
const COMMENTS_LOCKED_STATUSES = new Set(["APPROVED", "CLOSED"]);

const getClaimCreator = (
	detail?: MedicalClaimViewDetail,
): MentionableUserInput | null => {
	const creator =
		detail?.created_by ?? detail?.createdBy ?? detail?.initiatedBy;
	return creator?.id ? creator : null;
};

/** Triggers a browser download for a blob or same-origin URL. */
const triggerDownload = (href: string, fileName: string, newTab = false) => {
	const link = document.createElement("a");
	link.href = href;
	link.download = fileName;
	if (newTab) {
		link.target = "_blank";
		link.rel = "noopener noreferrer";
	}
	document.body.appendChild(link);
	link.click();
	link.remove();
};

/**
 * THCM (internal) claim detail: data, permissions and every action on the
 * claim page. Guest-portal claims use useGuestMedicalClaimView instead.
 *
 * Toast convention: this hook toasts for workflow/claim-level actions
 * (approve, clarify, close, export, PDF). Form-level actions (submit, draft,
 * line items) are toasted by useReimbursementClaimForm.
 */
export function useMedicalClaimView({ claimId }: UseMedicalClaimViewArgs) {
	const { user } = useAuth();
	const { showToast } = useToast();
	const navigate = useNavigate();

	const detailQuery = useMedicalClaimDetailQuery(claimId);

	const lineItemMutation = useApproveMedicalClaimLineItemMutation();
	const unapproveMutation = useUnapproveMedicalClaimLineItemMutation();
	const lineItemRemarksMutation = useSaveMedicalClaimLineItemRemarksMutation();
	const remarksBatchMutation = useSaveMedicalClaimBillRemarksMutation();
	const closeMutation = useCloseMedicalClaimMutation();
	const approveStageMutation = useApproveWorkflowStageMutation();
	const clarifyStageMutation = useClarifyWorkflowStageMutation();

	const pdfUrlMutation = useMedicalClaimPdfUrlMutation();
	const exportClaimMutation = useExportMedicalClaimMutation();

	const detail = detailQuery.data as MedicalClaimViewDetail | undefined;
	const activeWorkflow = detail?.activeWorkflow ?? null;

	const workflowData = React.useMemo(
		() => getWorkflowApproverData(activeWorkflow, user),
		[activeWorkflow, user],
	);
	const workflowStages = workflowData.stages;
	const creator = React.useMemo(() => getClaimCreator(detail), [detail]);

	const isInitiator =
		Boolean(user?.id) &&
		(detail?.initiatedById === user?.id || creator?.id === user?.id);

	const permissions = useMedicalClaimPermissions({
		context: "internal",
		status: detail?.status,
		workflow: workflowData,
		isInitiator,
	});

	const { gradeOptions } = useGradeOptions(
		{ kind: "internal" },
		{ grade: detail?.grade, derivedCap: deriveAnnualCap(detail) },
		Boolean(detail),
	);

	// After the last approver approves (APPROVED) or the claim is closed, the
	// chat stays visible as history but nobody can add to it.
	const isCommentingLocked = COMMENTS_LOCKED_STATUSES.has(
		permissions.normalizedStatus,
	);
	const canComment = permissions.canComment && !isCommentingLocked;

	const commentContext = React.useMemo(
		() =>
			getWorkflowCommentContext({
				activeWorkflow,
				currentUser: user,
				creator,
				canComment,
			}),
		[activeWorkflow, canComment, creator, user],
	);

	const initialValues = React.useMemo(
		() => (detail ? toMedicalClaimFormValues(detail) : undefined),
		[detail],
	);
	const initialLineItems = React.useMemo(
		() => (detail ? toMedicalClaimLineItems(detail) : []),
		[detail],
	);

	const refresh = React.useCallback(async () => {
		const result = await detailQuery.refetch();
		return result.data as MedicalClaimViewDetail | undefined;
	}, [detailQuery]);

	/**
	 * Re-reads the claim after a line-item action so the page shows what the
	 * server saved (e.g. the default approved amount). This is a React Query
	 * refetch, not a page reload — the form merges the fresh data and keeps
	 * any amounts/remarks still being typed on other rows. A failed refetch
	 * doesn't undo the action that already succeeded.
	 */
	const syncWithServer = React.useCallback(async () => {
		try {
			await detailQuery.refetch();
		} catch {
			/* the cache was already patched from the request */
		}
	}, [detailQuery]);

	/* ---------------------------- Line items ---------------------------- */

	const approveLineItem = React.useCallback(
		async (lineItem: ClaimHeadRow) => {
			if (!permissions.canReviewLineItems) {
				throw new Error(
					"Only the current internal workflow approver can approve claim line items.",
				);
			}
			// The remark is already saved: the form flushes it (auto-save)
			// right before calling this, since the field locks once approved.
			await lineItemMutation.mutateAsync({
				claimId,
				lineItem: {
					id: lineItem.id,
					approvedClaimAmount: resolveApprovedAmount(lineItem),
					remarks: lineItem.remarks,
				},
			});
			await syncWithServer();
		},
		[
			claimId,
			lineItemMutation,
			permissions.canReviewLineItems,
			syncWithServer,
		],
	);

	const unapproveLineItem = React.useCallback(
		async (lineItem: ClaimHeadRow) => {
			if (!permissions.canReviewLineItems) {
				throw new Error(
					"Only the current internal workflow approver can change line items.",
				);
			}
			await unapproveMutation.mutateAsync({ claimId, billId: lineItem.id });
			await syncWithServer();
		},
		[
			claimId,
			permissions.canReviewLineItems,
			syncWithServer,
			unapproveMutation,
		],
	);

	const saveLineItemRemarks = React.useCallback(
		async (lineItem: ClaimHeadRow) => {
			if (!permissions.canReviewLineItems) {
				throw new Error(
					"Only the current internal workflow approver can update remarks.",
				);
			}
			await lineItemRemarksMutation.mutateAsync({
				claimId,
				lineItem: { id: lineItem.id, remarks: lineItem.remarks },
			});
			await syncWithServer();
		},
		[
			claimId,
			lineItemRemarksMutation,
			permissions.canReviewLineItems,
			syncWithServer,
		],
	);

	/**
	 * Saves the remarks of several lines in one request (auto-save on blur,
	 * and the flush before Approve / Send for Clarification). No refetch: the
	 * cache is patched from what was sent, so text still being typed on other
	 * rows is never overwritten.
	 */
	const saveLineItemRemarksBatch = React.useCallback(
		async (lineItems: ClaimHeadRow[]) => {
			if (!permissions.canReviewLineItems) {
				throw new Error(
					"Only the current internal workflow approver can update remarks.",
				);
			}
			if (lineItems.length === 0) return;
			await remarksBatchMutation.mutateAsync({
				claimId,
				items: lineItems.map((item) => ({
					id: item.id,
					remarks: item.remarks,
				})),
			});
		},
		[claimId, permissions.canReviewLineItems, remarksBatchMutation],
	);

	/* ------------------------------ Close -------------------------------- */

	const closeClaim = React.useCallback(async () => {
		try {
			const response = await closeMutation.mutateAsync(claimId);
			showToast({
				type: "success",
				title: "Claim closed",
				description: response?.message ?? "The medical claim has been closed.",
			});
			await refresh();
		} catch (error) {
			showToast({
				type: "error",
				title: "Unable to close the claim",
				description: getApiErrorMessage(error, "Please try again."),
			});
			throw error;
		}
	}, [claimId, closeMutation, refresh, showToast]);

	/* ---------------------------- Workflow ------------------------------ */

	const approveCurrentStage = React.useCallback(
		async (reason: string) => {
			const stageId = workflowData.currentStage?.id;
			if (!permissions.canApprove || !stageId) return;

			try {
				// The workflow module's approve accepts an optional comment as
				// its 2nd argument (same shape as clarify); extra args are
				// ignored if it doesn't, so the reason is never silently lost
				// on newer versions.
				const approve = approveStageMutation.mutateAsync as unknown as (
					id: string,
					comment?: string,
				) => Promise<WorkflowActionResponse>;
				const response = await approve(stageId, reason);

				const refreshed = await refresh();
				const isFinalApproval = refreshed?.status === "APPROVED";

				// External approver's "OK and Close": the final OK moves the claim
				// to APPROVED, so close it in the same click. The approval has
				// already been saved, so a failed close (e.g. the backend still
				// restricts closing to the initiator) is not an error — the claim
				// just stays APPROVED for the initiator to close.
				let closed = false;
				if (permissions.isExternalApprover && isFinalApproval) {
					try {
						await closeMutation.mutateAsync(claimId);
						closed = true;
						await refresh();
					} catch {
						/* approved, but not closed — handled by the toast below */
					}
				}

				showToast({
					type: "success",
					title: closed ? "Claim approved and closed" : "Claim approved",
					description: closed
						? "The medical claim has been approved and closed."
						: permissions.isExternalApprover && isFinalApproval
							? "Your approval has been recorded. The initiator will close the claim."
							: (response?.message ?? "Your approval has been recorded."),
				});
				// Done with this claim — show it under "Approved by me".
				navigate(AFTER_APPROVE_PATH);
			} catch (error) {
				showToast({
					type: "error",
					title: "Approval failed",
					description: getApiErrorMessage(
						error,
						"Unable to approve this claim.",
					),
				});
				throw error;
			}
		},
		[
			approveStageMutation,
			claimId,
			closeMutation,
			navigate,
			permissions.canApprove,
			permissions.isExternalApprover,
			refresh,
			showToast,
			workflowData.currentStage?.id,
		],
	);

	const clarifyCurrentStage = React.useCallback(
		async (reason: string) => {
			const stageId = workflowData.currentStage?.id;
			if (!permissions.canClarify || !stageId) return;

			try {
				const clarify = clarifyStageMutation.mutateAsync as unknown as (
					id: string,
					reason: string,
				) => Promise<WorkflowActionResponse>;
				const response = await clarify(stageId, reason);
				showToast({
					type: "success",
					title: "Clarification requested",
					description:
						response?.message ??
						"The claimant has been emailed and can resubmit from the guest portal.",
				});
				await refresh();
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to send for clarification",
					description: getApiErrorMessage(error, "Please try again."),
				});
				throw error;
			}
		},
		[
			clarifyStageMutation,
			permissions.canClarify,
			refresh,
			showToast,
			workflowData.currentStage?.id,
		],
	);

	/* ------------------------- Excel + PDF ------------------------------- */

	const detailReferenceNumber = detail?.referenceNumber;

	const handleExport = React.useCallback(async () => {
		if (!claimId || !permissions.canExport) return;
		let blobUrl: string | undefined;
		try {
			const blob = await exportClaimMutation.mutateAsync(claimId);
			blobUrl = window.URL.createObjectURL(blob);
			triggerDownload(
				blobUrl,
				`medical-claim-${detailReferenceNumber ?? claimId}.xlsx`,
			);
		} catch (error) {
			showToast({
				type: "error",
				title: "Export failed",
				description: getApiErrorMessage(
					error,
					"Failed to download the Excel file.",
				),
			});
		} finally {
			if (blobUrl) {
				const url = blobUrl;
				window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
			}
		}
	}, [
		claimId,
		detailReferenceNumber,
		exportClaimMutation,
		permissions.canExport,
		showToast,
	]);

	const handleDownloadPdf = React.useCallback(async () => {
		if (!claimId) return;
		const fileName = `medical-claim-${detailReferenceNumber ?? claimId}.pdf`;
		try {
			const url = await pdfUrlMutation.mutateAsync({ claimId });
			// `download` is ignored for cross-origin signed URLs, so fetch the
			// blob first; fall back to opening the URL if CORS blocks it.
			try {
				const response = await fetch(url);
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const blobUrl = window.URL.createObjectURL(await response.blob());
				triggerDownload(blobUrl, fileName);
				window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
			} catch {
				triggerDownload(url, fileName, true);
			}
		} catch (error) {
			showToast({
				type: "error",
				title: "Download failed",
				description: getApiErrorMessage(
					error,
					"Failed to download the medical claim PDF.",
				),
			});
		}
	}, [claimId, detailReferenceNumber, pdfUrlMutation, showToast]);

	const workflowActionLoading = Boolean(
		(approveStageMutation as unknown as { loading?: boolean }).loading ||
		(clarifyStageMutation as unknown as { loading?: boolean }).loading,
	);

	return {
		detail,
		isLoading: detailQuery.isLoading,
		isError: detailQuery.isError,
		error: detailQuery.error,

		// Form
		mode: permissions.mode,
		referenceNumber: detail?.referenceNumber,
		actionText: "Save Changes",
		initialValues,
		initialLineItems,
		gradeOptions,
		correctionReason: detail?.correctionReason ?? null,

		...toEligibilityHoldProps(detail),

		// Context
		activeWorkflow,
		workflowStages,
		workflowData,
		commentContext,
		currentUserId: user?.id,
		creator,
		actorRole: permissions.actorRole,

		// Permissions
		permissions,
		canEdit: permissions.canEditClaim,
		canComment,
		/** Chat tab: for active commenters, and as read-only history once the claim is approved/closed. */
		canShowCommentSection:
			Boolean(activeWorkflow) && (canComment || isCommentingLocked),
		canApprove: permissions.canApprove,
		canClarify: permissions.canClarify,
		canApproveLineItems: permissions.canReviewLineItems,
		canClose: permissions.canClose,
		isExternalApprover: permissions.isExternalApprover,

		// Loading
		isWorkflowActionLoading: workflowActionLoading,
		isClosing: closeMutation.isPending,

		// Actions
		approveLineItem,
		/** undefined when the backend can't un-approve (the row reopens locally instead). */
		unapproveLineItem: MEDICLAIM_BACKEND.unapproveLineItem
			? unapproveLineItem
			: undefined,
		saveLineItemRemarks,
		saveLineItemRemarksBatch,
		approveCurrentStage,
		clarifyCurrentStage,
		closeClaim,
		refresh,

		// PDF + export
		claimId,
		isDownloadingPdf: pdfUrlMutation.isPending,
		handleDownloadPdf,
		isExportingExcel: exportClaimMutation.isPending,
		handleExport,
	};
}
