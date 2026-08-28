import * as React from "react";

import type { MentionableUserInput } from "../../../components/ui/comments";
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
	toMedicalClaimFormValues,
	toMedicalClaimLineItems,
} from "../helpers/medicalClaimListing.mapper";
import type { MedicalClaimDetail } from "../types/medicalClaimListing.types";
import type {
	ClaimHeadRow,
	ReimbursementClaimActor,
	ReimbursementClaimSubmission,
} from "../types/reimbursementClaim.types";
import {
	useApproveMedicalClaimLineItemMutation,
	useMedicalClaimDetailQuery,
	useMedicalClaimPdfUrlMutation,
	useExportMedicalClaimMutation,
	useSaveMedicalClaimLineItemRemarksMutation,
} from "./useMedicalClaimMutations";
import {
	useGuestReimbursementClaimDetailQuery,
	useResubmitGuestMedicalClaimMutation,
} from "../../guest/guestMedicalForms/useReimbursementClaimQueries";
import { getWorkflowCommentContext } from "../../../components/ui/comments/comments.helper";

type MedicalClaimViewDetail = MedicalClaimDetail & {
	status?: string | null;
	activeWorkflow?: ActiveWorkflowLike<ApprovalStageLike> | null;
	grade?: string | null;
	createdBy?: MentionableUserInput | null;
	created_by?: MentionableUserInput | null;
	initiatedBy?: MentionableUserInput | null;
};

type MedicalClaimContext = "internal" | "guest";

type UseMedicalClaimViewArgs = {
	claimId: string;
	context?: MedicalClaimContext;
};

const GUEST_EDITABLE_STATUSES = new Set([
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
	"THCM_CLARIFICATION_REQUESTED",
]);

const appendText = (
	formData: FormData,
	name: string,
	value: string | number | boolean | null | undefined,
) => {
	if (value !== undefined && value !== null) {
		formData.append(name, String(value));
	}
};

const buildMedicalClaimFormData = (
	submission: ReimbursementClaimSubmission,
): FormData => {
	const { values } = submission;
	const formData = new FormData();

	appendText(formData, "grade", values.grade);
	appendText(formData, "location", values.location);
	appendText(formData, "claimCover", values.coverageType);
	appendText(formData, "spouseName", values.spouseName);
	appendText(formData, "signatureDate", values.claimDate);
	appendText(formData, "declarationAccepted", values.declarationAccepted);
	appendText(
		formData,
		"signatureName",
		values.employeeSignature?.trim() || values.employeeName.trim(),
	);

	const files: File[] = [];

	const bills = submission.lineItems.map((item) => ({
		id: item.id,
		claimHead: item.claimHead,
		billNo: item.billNumber.trim(),
		billName: item.billName.trim(),
		billDate: item.billDate || undefined,
		amount: Number(item.amount) || 0,
		attachmentIndex: item.file ? files.push(item.file) - 1 : null,
	}));

	formData.append("bills", JSON.stringify(bills));

	files.forEach((file) => formData.append("billAttachments", file, file.name));

	return formData;
};

const getClaimCreator = (
	detail?: MedicalClaimViewDetail,
): MentionableUserInput | null => {
	const creator =
		detail?.created_by ?? detail?.createdBy ?? detail?.initiatedBy;

	return creator?.id ? creator : null;
};

export function useMedicalClaimView({
	claimId,
	context = "internal",
}: UseMedicalClaimViewArgs) {
	const { user } = useAuth();
	const { showToast } = useToast();

	const isGuestRoute = context === "guest";
	/*
	 * Query selection is based on the route context supplied to the hook.
	 * No pathname inspection happens here.
	 */
	const internalQuery = useMedicalClaimDetailQuery(claimId, !isGuestRoute);

	const guestQuery = useGuestReimbursementClaimDetailQuery(
		claimId,
		isGuestRoute,
	);

	const guestResubmitMutation = useResubmitGuestMedicalClaimMutation();

	const lineItemMutation = useApproveMedicalClaimLineItemMutation();
	const lineItemRemarksMutation = useSaveMedicalClaimLineItemRemarksMutation();

	const approveStageMutation = useApproveWorkflowStageMutation();

	const clarifyStageMutation = useClarifyWorkflowStageMutation();

	// --- PDF (view/download) + Excel export ---
	const pdfUrlMutation = useMedicalClaimPdfUrlMutation();
	const exportClaimMutation = useExportMedicalClaimMutation();
	const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
	// Tracks which PDF button triggered the shared mutation, so "view" and
	// "download" loading states don't light up together.
	const [pdfAction, setPdfAction] = React.useState<"view" | "download" | null>(
		null,
	);

	const detail = (isGuestRoute ? guestQuery.data : internalQuery.data) as
		| MedicalClaimViewDetail
		| undefined;

	const activeWorkflow = detail?.activeWorkflow ?? null;

	const workflowData = React.useMemo(
		() => getWorkflowApproverData(activeWorkflow, user),
		[activeWorkflow, user],
	);

	const workflowStages = workflowData.stages;

	const creator = React.useMemo(() => getClaimCreator(detail), [detail]);

	const isCurrentApprover = workflowData.isCurrentStageApprover;

	const isExternalApprover =
		workflowData.isExternalApprover || workflowData.wasExternalApprover;

	const isCurrentInternalApprover = isCurrentApprover && !isExternalApprover;

	const canActNow = isCurrentInternalApprover && workflowData.canActNow;

	const normalizedStatus = detail?.status?.toUpperCase() ?? "";

	/*
	 * --------------------------------------------------------------------------
	 * Actor
	 * --------------------------------------------------------------------------
	 */

	const actorRole: ReimbursementClaimActor = isGuestRoute
		? "creator"
		: isExternalApprover
			? "externalApprover"
			: isCurrentInternalApprover
				? "approver"
				: "creator";

	/*
	 * --------------------------------------------------------------------------
	 * Permissions
	 * --------------------------------------------------------------------------
	 *
	 * No pathname-based permission logic.
	 *
	 * The route only tells us whether this is the guest/external flow.
	 * The actual edit permission is determined from the claim state.
	 */

	const canEdit = isGuestRoute && GUEST_EDITABLE_STATUSES.has(normalizedStatus);

	const canApprove = !isGuestRoute && canActNow;

	const canApproveLineItems = canApprove;

	const canClarify = canApprove;

	/*
	 * --------------------------------------------------------------------------
	 * Form mode / action
	 * --------------------------------------------------------------------------
	 */

	const mode = canEdit ? "edit" : "view";

	const actionText = isGuestRoute ? "Resubmit Claim" : "Save Changes";

	/*
	 * --------------------------------------------------------------------------
	 * Comments
	 * --------------------------------------------------------------------------
	 */

	const workflowCommentContext = React.useMemo(
		() =>
			getWorkflowCommentContext({
				activeWorkflow,
				currentUser: user,

				// No proposer role exists in this module.
				creator: null,

				canComment:
					!isGuestRoute && !isExternalApprover && isCurrentInternalApprover,
			}),
		[
			activeWorkflow,
			isCurrentInternalApprover,
			isExternalApprover,
			isGuestRoute,
			user,
		],
	);

	/*
	 * --------------------------------------------------------------------------
	 * Initial form data
	 * --------------------------------------------------------------------------
	 */

	const initialValues = React.useMemo(
		() => (detail ? toMedicalClaimFormValues(detail) : undefined),
		[detail],
	);

	const initialLineItems = React.useMemo(
		() => (detail ? toMedicalClaimLineItems(detail) : []),
		[detail],
	);
	/*
	 * --------------------------------------------------------------------------
	 * Refresh
	 * --------------------------------------------------------------------------
	 */

	const refresh = React.useCallback(async () => {
		if (isGuestRoute) {
			await guestQuery.refetch();
		} else {
			await internalQuery.refetch();
		}
	}, [guestQuery.refetch, internalQuery.refetch, isGuestRoute]);

	/*
	 * --------------------------------------------------------------------------
	 * Claim submission
	 * --------------------------------------------------------------------------
	 */

	const saveClaim = React.useCallback(
		async (submission: ReimbursementClaimSubmission) => {
			if (!canEdit) {
				throw new Error("This claim form is read-only for the current user.");
			}

			const formData = buildMedicalClaimFormData(submission);

			await guestResubmitMutation.mutateAsync({
				claimId,
				formData,
			});
		},
		[canEdit, claimId, guestResubmitMutation],
	);

	/*
	 * --------------------------------------------------------------------------
	 * Line item approval
	 * --------------------------------------------------------------------------
	 */

	const approveLineItem = React.useCallback(
		async (lineItem: ClaimHeadRow) => {
			if (!canApproveLineItems) {
				throw new Error(
					"Only the current internal workflow approver can approve claim line items.",
				);
			}

			await lineItemMutation.mutateAsync({
				claimId,
				lineItem,
			});
		},
		[canApproveLineItems, claimId, lineItemMutation],
	);

	const saveLineItemRemarks = React.useCallback(
		async (lineItem: ClaimHeadRow) => {
			if (!canApproveLineItems) {
				throw new Error(
					"Only the current internal workflow approver can update remarks.",
				);
			}

			await lineItemRemarksMutation.mutateAsync({
				claimId,
				lineItem,
			});
		},
		[canApproveLineItems, claimId, lineItemRemarksMutation],
	);

	/*
	 * --------------------------------------------------------------------------
	 * Workflow approval
	 * --------------------------------------------------------------------------
	 */

	const approveCurrentStage = React.useCallback(async () => {
		if (!canApprove) return;

		const stageId = workflowData.currentStage?.id;

		if (!stageId) return;

		const response = await approveStageMutation.mutateAsync(stageId);

		showToast({
			type: "success",
			title: "Claim approved",
			description: response.message,
		});

		await refresh();
	}, [
		approveStageMutation,
		canApprove,
		refresh,
		showToast,
		workflowData.currentStage?.id,
	]);

	/*
	 * --------------------------------------------------------------------------
	 * Workflow clarification
	 * --------------------------------------------------------------------------
	 */

	const clarifyCurrentStage = React.useCallback(
		async (reason: string) => {
			if (!canClarify) return;

			const stageId = workflowData.currentStage?.id;

			if (!stageId) return;

			const response = await clarifyStageMutation.mutateAsync(stageId, reason);

			showToast({
				type: "success",
				title: "Clarification requested",
				description: response.message,
			});

			await refresh();
		},
		[
			canClarify,
			clarifyStageMutation,
			refresh,
			showToast,
			workflowData.currentStage?.id,
		],
	);

	/*
	 * --------------------------------------------------------------------------
	 * Excel export (single claim)
	 * --------------------------------------------------------------------------
	 */

	const detailReferenceNumber = detail?.referenceNumber;

	const handleExport = React.useCallback(async () => {
		if (!claimId) return;

		let blobUrl: string | undefined;
		let downloadLink: HTMLAnchorElement | undefined;

		try {
			const blob = await exportClaimMutation.mutateAsync(claimId);

			blobUrl = window.URL.createObjectURL(blob);
			downloadLink = document.createElement("a");
			downloadLink.href = blobUrl;
			downloadLink.download = `medical-claim-${detailReferenceNumber ?? claimId}.xlsx`;

			document.body.appendChild(downloadLink);
			downloadLink.click();
		} catch {
			showToast({
				type: "error",
				title: "Request failed",
				description: "Failed to download the Excel file.",
			});
		} finally {
			if (blobUrl) window.URL.revokeObjectURL(blobUrl);
			downloadLink?.remove();
		}
	}, [claimId, detailReferenceNumber, exportClaimMutation, showToast]);

	/*
	 * --------------------------------------------------------------------------
	 * PDF view
	 * --------------------------------------------------------------------------
	 */

	const handleViewPdf = React.useCallback(async () => {
		if (!claimId) return;

		setPdfAction("view");
		try {
			const url = await pdfUrlMutation.mutateAsync({ claimId });
			setPdfUrl(url);
			// open your pdf preview modal here, e.g. setPdfPreviewOpen(true)
		} catch (error) {
			showToast({
				type: "error",
				title: "PDF preview failed",
				description: getApiErrorMessage(
					error,
					"Unable to prepare the claim PDF.",
				),
			});
		} finally {
			setPdfAction(null);
		}
	}, [claimId, pdfUrlMutation, showToast]);

	/*
	 * --------------------------------------------------------------------------
	 * PDF download
	 * --------------------------------------------------------------------------
	 */

	const handleDownloadPdf = React.useCallback(async () => {
		if (!claimId) return;

		setPdfAction("download");

		try {
			const url = await pdfUrlMutation.mutateAsync({
				claimId,
			});

			const link = document.createElement("a");

			link.href = url;
			link.download = `medical-claim-${detailReferenceNumber ?? claimId}.pdf`;
			link.target = "_blank";
			link.rel = "noopener noreferrer";

			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch {
			showToast({
				type: "error",
				title: "Download failed",
				description: "Failed to download the medical claim PDF.",
			});
		} finally {
			setPdfAction(null);
		}
	}, [claimId, detailReferenceNumber, pdfUrlMutation, showToast]);

	const isPreparingPdf = pdfUrlMutation.isPending && pdfAction === "view";
	const isDownloadingPdf = pdfUrlMutation.isPending && pdfAction === "download";

	return {
		detail,

		isLoading: isGuestRoute ? guestQuery.isLoading : internalQuery.isLoading,

		isError: isGuestRoute ? guestQuery.isError : internalQuery.isError,

		// Form
		mode,
		referenceNumber: detail?.referenceNumber,
		actionText,
		initialValues,
		initialLineItems,

		// Context
		activeWorkflow,
		workflowStages,
		workflowData,
		workflowCommentContext,
		creator,
		actorRole,
		isGuestRoute,

		// Permissions
		canEdit,
		canComment: workflowCommentContext.canComment,
		canShowCommentSection:
			Boolean(activeWorkflow) && workflowCommentContext.canComment,
		canApprove,
		canClarify,
		canApproveLineItems,
		isExternalApprover,

		// Loading
		isSaving: guestResubmitMutation.isPending,

		isWorkflowActionLoading:
			approveStageMutation.loading || clarifyStageMutation.loading,

		// Actions
		saveClaim,
		approveLineItem,
		saveLineItemRemarks,
		approveCurrentStage,
		clarifyCurrentStage,

		// PDF + export
		claimId,
		pdfUrl,
		isPreparingPdf,
		isDownloadingPdf,
		handleViewPdf,
		handleDownloadPdf,
		isExportingExcel: exportClaimMutation.isPending,
		handleExport,
	};
}
