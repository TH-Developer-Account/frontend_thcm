// hooks/useActivityPlanner.ts
// Activity Planner detail-page controller + its sub-hooks
// (permissions, clarified resubmission, deviation resubmission).
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getWorkflowCommentContext } from "../../../../components/ui/comments/comments.helper";
import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";
import {
	getApiErrorMessage,
	showApiErrorToast,
	showSuccessToast,
} from "../../../../utils/apiError.helper";
import {
	getWorkflowApproverData,
	workflowApi,
	type ActiveWorkflowLike,
	type WorkflowUserIdentity,
} from "../../../workflows";
import type {
	ApprovalStageLike,
	WorkflowStage,
} from "../../../workflows/types/types";
import { mapEpcWorkflowStage } from "../../../workflows/utils/approvalWorkflow.mapper";
import {
	getActivityPermissions,
	REPORT_ELIGIBLE_STATUSES,
	type ActivityPermissions,
	type WorkflowEntry,
} from "../utils/activity.helper";
import { EPC_LISTING_PATH } from "../utils/constant";
import { getStoredAppId } from "../utils/localstorage";
import {
	useActivityCommentsQuery,
	useActivityPlannerPdfUrlMutation,
	useClarifyEventReportMutation,
	useCloseEPC,
	useEpcDetailQuery,
	useEventReportQuery,
	useExportActivityPlannerMutation,
	useSubmitClarifiedUpdatedFormMutation,
	useSubmitDeviatedUpdatedFormMutation,
	useValidateEventReportMutation,
} from "../queries/epc.queries";
import type { EpcDetailResponse, EventReportDetail } from "../types/epc.types";

/* ========================================================================== */
/*                               Permissions                                  */
/* ========================================================================== */

type UseActivityPermissionsArgs = {
	epcData?: EpcDetailResponse | null;
	report?: EventReportDetail | null;
	workflowEntries?: WorkflowEntry[];
	hasValidatorPreviewed?: boolean;
};

export const useActivityPermissions = ({
	epcData,
	report,
	workflowEntries = [],
	hasValidatorPreviewed = false,
}: UseActivityPermissionsArgs) => {
	const { user } = useAuth();

	return React.useMemo(
		() =>
			getActivityPermissions({
				epcData,
				report,
				workflowEntries,
				hasValidatorPreviewed,
				userId: user?.id,
			}),
		[epcData, report, workflowEntries, hasValidatorPreviewed, user?.id],
	);
};

/* ========================================================================== */
/*                         Clarified resubmission                             */
/* ========================================================================== */

type UseClarifiedResubmissionArgs = {
	epcData?: EpcDetailResponse | null;
	onRefresh: () => Promise<unknown>;
	permissions: ActivityPermissions;
};

export const useClarifiedResubmission = ({
	epcData,
	onRefresh,
	permissions,
}: UseClarifiedResubmissionArgs) => {
	const { showToast } = useToast();

	const submitClarifiedMutation = useSubmitClarifiedUpdatedFormMutation();
	const workflowId = epcData?.activeWorkflow?.id ?? null;

	const isWorkflowClarifiedPending = permissions.isClarifiedPending;
	const canSubmitClarifiedUpdate = permissions.canSubmitClarifiedUpdate;

	const submitClarifiedUpdate = async () => {
		if (!workflowId) {
			showApiErrorToast(showToast, "No active workflow found.");
			return;
		}

		if (!canSubmitClarifiedUpdate) {
			showApiErrorToast(showToast, "Please update the form before submitting.");
			return;
		}

		try {
			await submitClarifiedMutation.mutateAsync(workflowId);
			showSuccessToast(showToast, "Updated form submitted successfully.");
			await onRefresh();
		} catch (error: unknown) {
			showApiErrorToast(showToast, `Failed to submit updated form ${error}.`);
		}
	};

	return {
		isClarifiedPending: isWorkflowClarifiedPending,
		canSubmitClarifiedUpdate,
		isSubmittingClarifiedUpdate: submitClarifiedMutation.isPending,
		submitClarifiedUpdate,
	};
};

/* ========================================================================== */
/*                         Deviation resubmission                             */
/* ========================================================================== */

type UseDeviationResubmissionArgs = {
	epcData?: EpcDetailResponse | null;
	permissions: ActivityPermissions;
	onRefresh: () => Promise<unknown>;
	appId?: string | null;
};

export const useDeviationResubmission = ({
	epcData,
	onRefresh,
	permissions,
	appId,
}: UseDeviationResubmissionArgs) => {
	const { showToast } = useToast();
	const { workspaceId } = useAuth();

	const submitDeviationMutation = useSubmitDeviatedUpdatedFormMutation();
	const workflowId = epcData?.activeWorkflow?.id ?? null;
	const isDeviationPending = permissions.isDeviationPending;
	const canSubmitDeviationUpdate = permissions.canSubmitDeviationUpdate;

	const submitDeviationUpdate = async () => {
		if (!workflowId) {
			showApiErrorToast(showToast, "No active workflow found.");
			return;
		}

		if (!isDeviationPending) {
			showApiErrorToast(showToast, "No pending deviation clarification found.");
			return;
		}
		if (!canSubmitDeviationUpdate) {
			showApiErrorToast(showToast, "Please update the form before submitting.");
			return;
		}
		try {
			const payload = {
				workflowId,
				eventProposalId: epcData?.id,
				workspaceId: workspaceId ?? undefined,
				appId: appId ?? undefined,
				newBudget: epcData?.epf?.eventBudget,
			};

			await submitDeviationMutation.mutateAsync(payload);
			showSuccessToast(
				showToast,
				"Updated deviation form submitted successfully.",
			);
			await onRefresh();
		} catch (error: unknown) {
			showApiErrorToast(
				showToast,
				error,
				"Failed to submit updated deviation form.",
			);
		}
	};
	return {
		submitDeviationUpdate,
		isDeviationPending,
		isSubmittingDeviationUpdate: submitDeviationMutation.isPending,
		canSubmitDeviationUpdate,
	};
};

/* ========================================================================== */
/*                          Activity planner (main)                           */
/* ========================================================================== */

export type ActivityEditingSection = "epc" | "crf" | "epf" | null;
/** Router state accepted by the detail page (sent by the listing "Edit" action). */
export type ActivityPlannerLocationState = {
	editSection?: "epc";
};
// Workflow approve/clarify now go through ApprovalActionsBar (reason typed
// inline in the footer). The modal is only used for report clarification.
export type ActivityReasonMode = "clarify-report" | null;

// Which workflow action the approver bar is currently running.
type WorkflowActionInFlight = "approve" | "clarify" | null;

type UseActivityPlannerOptions = {
	onOpenReportBuilder?: () => void;
	onOpenReportPreview?: () => void;
};

type CreatedEpcResult = {
	id?: string;
	epcId?: string;
	eventProposal?: { id?: string };
	epc?: { id?: string };
};

export type ActivityExportState =
	| { status: "idle" }
	| { status: "pending" }
	| {
			status: "queued";
			message: string;
			jobId: string;
			logId?: string;
	  }
	| { status: "error"; message: string };

const normalizeReportForView = (
	report: EventReportDetail | null | undefined,
): EventReportDetail | null => {
	if (!report) return null;

	return {
		...report,
		images:
			report.images?.map((image) => ({
				...image,
				url: image.url ?? image.fileUrl ?? "",
			})) ?? [],
	} as EventReportDetail;
};

export const useActivityPlanner = (
	id: string | undefined,
	options: UseActivityPlannerOptions = {},
) => {
	const navigate = useNavigate();
	const { user, workspaceId } = useAuth();
	const { showToast } = useToast();
	const [editingSection, setEditingSection] =
		React.useState<ActivityEditingSection>(null);
	const [deviationPreviewStages, setDeviationPreviewStages] = React.useState<
		ApprovalStageLike[]
	>([]);
	const [commentsRefreshKey, setCommentsRefreshKey] = React.useState(0);
	const [reasonModal, setReasonModal] = React.useState<{
		mode: ActivityReasonMode;
		loading: boolean;
	}>({ mode: null, loading: false });
	const reasonMode = reasonModal.mode;

	const [workflowAction, setWorkflowAction] =
		React.useState<WorkflowActionInFlight>(null);
	// Ref guard so a fast double-click can't fire two approve/clarify calls
	// before the state update re-renders the bar as disabled.
	const workflowActionRef = React.useRef<WorkflowActionInFlight>(null);

	const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
	const [hasValidatorPreviewed, setHasValidatorPreviewed] =
		React.useState(false);
	const [exportState, setExportState] = React.useState<ActivityExportState>({
		status: "idle",
	});

	const isExportingRef = React.useRef(false);

	const {
		data: epcData,
		isLoading,
		isFetching,
		refetch,
	} = useEpcDetailQuery(id);

	const normalizedEpcStatus = String(epcData?.status ?? "")
		.trim()
		.toUpperCase();

	const canHaveEventReport =
		Boolean(epcData?.report?.id) ||
		REPORT_ELIGIBLE_STATUSES.has(normalizedEpcStatus);

	const reportQuery = useEventReportQuery(
		id,
		Boolean(id) && canHaveEventReport,
	);

	const reportData = React.useMemo(
		() => normalizeReportForView(reportQuery.data ?? epcData?.report ?? null),
		[reportQuery.data, epcData?.report],
	);

	const epcId = epcData?.id ?? "";
	const reportId = reportData?.id ?? "";

	const { data: workflowEntries = [], refetch: refetchWorkflowEntries } =
		useActivityCommentsQuery(epcId || null);

	const validateReportMutation = useValidateEventReportMutation();
	const clarifyReportMutation = useClarifyEventReportMutation();
	const closeEPCMutation = useCloseEPC();
	const pdfUrlMutation = useActivityPlannerPdfUrlMutation();
	const exportMutation = useExportActivityPlannerMutation();

	const { mutateAsync: validateReport } = validateReportMutation;
	const { mutateAsync: clarifyReport } = clarifyReportMutation;
	const { mutateAsync: closeEPC } = closeEPCMutation;

	const { mutateAsync: getActivityPlannerPdfUrl, isPending: isPreparingPdf } =
		pdfUrlMutation;

	const { mutateAsync: exportActivityPlanner } = exportMutation;

	const permissions = useActivityPermissions({
		epcData: epcData ?? null,
		report: reportData,
		workflowEntries,
		hasValidatorPreviewed,
	});

	const workflowStages = React.useMemo<ApprovalStageLike[]>(
		() => (epcData?.activeWorkflow?.stages ?? []).map(mapEpcWorkflowStage),
		[epcData?.activeWorkflow?.stages],
	);

	const activeWorkflow =
		React.useMemo<ActiveWorkflowLike<ApprovalStageLike> | null>(() => {
			const workflow = epcData?.activeWorkflow;
			if (!workflow) return null;

			return {
				id: workflow.id,
				iteration: workflow.iteration,
				isActive: workflow.isActive,
				status: workflow.status,
				currentStage: workflow.currentStage,
				stages: workflowStages,
			};
		}, [epcData?.activeWorkflow, workflowStages]);

	const currentWorkflowUser = React.useMemo<WorkflowUserIdentity | null>(
		() =>
			user?.id || user?.email
				? { id: user?.id ?? null, email: user?.email ?? null }
				: null,
		[user?.id, user?.email],
	);

	const workflowData = React.useMemo(
		() => getWorkflowApproverData(activeWorkflow, currentWorkflowUser),
		[activeWorkflow, currentWorkflowUser],
	);
	const currentStageId = workflowData.currentStage?.id ?? null;
	const canActOnCurrentStage = workflowData.canActNow;

	const commentContext = React.useMemo(
		() =>
			getWorkflowCommentContext({
				activeWorkflow,
				currentUser: currentWorkflowUser,
				creator: epcData?.created_by,
			}),
		[activeWorkflow, currentWorkflowUser, epcData?.created_by],
	);

	const canComment = !permissions.isClosed && commentContext.canComment;

	const isProposer = permissions.isProposer;
	const isValidator = permissions.isValidator;

	const createdByName = [
		epcData?.created_by?.first_name,
		epcData?.created_by?.last_name,
	]
		.filter(Boolean)
		.join(" ")
		.trim();

	const loggedInUserName = [user?.first_name, user?.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();

	const proposerName = epcData
		? createdByName || loggedInUserName || "--"
		: isProposer
			? loggedInUserName || "--"
			: "--";

	const handleRefresh = React.useCallback(async () => {
		await Promise.all([refetch(), refetchWorkflowEntries()]);
	}, [refetch, refetchWorkflowEntries]);

	const refreshComments = React.useCallback(() => {
		setCommentsRefreshKey((current) => current + 1);
	}, []);

	const handleWorkflowUpdate = React.useCallback(async () => {
		await handleRefresh();
		refreshComments();
	}, [handleRefresh, refreshComments]);

	const handleCreatedEpc = React.useCallback(
		(savedEpc: CreatedEpcResult) => {
			const createdEpcId =
				savedEpc?.id ??
				savedEpc?.eventProposal?.id ??
				savedEpc?.epcId ??
				savedEpc?.epc?.id;

			if (!createdEpcId) {
				showToast({
					type: "error",
					title: "Unable to continue",
					description: "Created EPC ID was not returned.",
				});
				return;
			}

			// CRF / EPF are added later from the listing action menu.
			// (useCreateEpcMutation already invalidates the list query.)
			navigate(EPC_LISTING_PATH);
		},
		[navigate, showToast],
	);

	const startEditing = React.useCallback(
		(section: Exclude<ActivityEditingSection, null>) => {
			setEditingSection(section);
		},
		[],
	);
	const cancelEditing = React.useCallback(() => setEditingSection(null), []);
	const finishEditing = React.useCallback(async () => {
		setEditingSection(null);
		await handleRefresh();
	}, [handleRefresh]);

	const handleOpenReportPreview = React.useCallback(() => {
		if (isValidator) {
			setHasValidatorPreviewed(true);
		}
		options.onOpenReportPreview?.();
	}, [isValidator, options.onOpenReportPreview]);

	const handleOpenReportBuilder = React.useCallback(() => {
		options.onOpenReportBuilder?.();
	}, [options.onOpenReportBuilder]);

	const handleValidateReport = React.useCallback(async () => {
		if (!reportId || !epcId) {
			showToast({
				type: "error",
				title: "Not allowed",
				description: "No submitted report found.",
			});
			return;
		}

		try {
			await validateReport({
				reportId,
				epcId,
			});

			showToast({
				type: "success",
				title: "Success",
				description: "Report validated successfully.",
			});
		} catch (error) {
			showToast({
				type: "error",
				title: "Validation failed",
				description:
					error instanceof Error
						? error.message
						: "Failed to validate the event report.",
			});
		}
	}, [reportId, epcId, validateReport, showToast]);

	const handleClarifyReport = React.useCallback(
		async (reason: string) => {
			if (!reportId || !epcId) {
				showToast({
					type: "error",
					title: "Not allowed",
					description: "No submitted report found.",
				});
				return;
			}

			try {
				await clarifyReport({
					reportId,
					epcId,
					reason,
				});

				showToast({
					type: "success",
					title: "Clarification requested",
					description: "The event report was sent back for clarification.",
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Clarification failed",
					description:
						error instanceof Error
							? error.message
							: "Failed to request clarification.",
				});
			}
		},
		[reportId, epcId, clarifyReport, showToast],
	);

	const handleCloseEPC = React.useCallback(async () => {
		if (!epcId) {
			showToast({
				type: "error",
				title: "Not allowed",
				description: "No EPC found.",
			});
			return;
		}

		try {
			await closeEPC({ epcId });

			showToast({
				type: "success",
				title: "Success",
				description: "EPC closed successfully.",
			});

			await handleRefresh();
		} catch (error) {
			showToast({
				type: "error",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to close EPC.",
			});
		}
	}, [epcId, closeEPC, showToast, handleRefresh]);

	const pdfFileName = `${epcData?.proposal_number || "activity-planner"}.pdf`;

	const handleDownloadPdf = React.useCallback(async () => {
		if (!epcId) {
			showToast({
				type: "error",
				title: "Unable to download",
				description: "Activity planner ID is missing.",
			});
			return;
		}

		setIsDownloadingPdf(true);

		try {
			const pdfUrl = await getActivityPlannerPdfUrl({ epcId });

			const anchor = document.createElement("a");
			anchor.href = pdfUrl;
			anchor.download = pdfFileName;
			anchor.rel = "noopener noreferrer";

			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
		} catch (error) {
			showToast({
				type: "error",
				title: "Download failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to download the activity planner PDF.",
			});
		} finally {
			setIsDownloadingPdf(false);
		}
	}, [epcId, pdfFileName, getActivityPlannerPdfUrl, showToast]);

	const handleExport = React.useCallback(async () => {
		if (isExportingRef.current) return;

		isExportingRef.current = true;
		setExportState({ status: "pending" });

		try {
			const queuedExport = await exportActivityPlanner();

			setExportState({
				status: "queued",
				message:
					queuedExport.message ??
					"EPC export job queued. This may take several minutes.",
				jobId: queuedExport.jobId,
				logId: queuedExport.logId,
			});
		} catch (error) {
			const message = getApiErrorMessage(
				error,
				"Failed to export the activity planner.",
			);

			setExportState({
				status: "error",
				message,
			});

			showToast({
				type: "error",
				title: "Export failed",
				description: message,
			});
		} finally {
			isExportingRef.current = false;
		}
	}, [exportActivityPlanner, showToast]);

	const dismissExport = React.useCallback(() => {
		setExportState({ status: "idle" });
	}, []);

	const isExportingExcel = exportState.status === "pending";

	const clarifiedResubmission = useClarifiedResubmission({
		epcData: epcData ?? null,
		permissions,
		onRefresh: handleRefresh,
	});

	const appId = React.useMemo(() => getStoredAppId(), []);

	const handleDeviationPreviewSuccess = React.useCallback(
		(stages: WorkflowStage[]) => {
			setDeviationPreviewStages(stages.map(mapEpcWorkflowStage));
		},
		[],
	);

	const openReasonModal = React.useCallback(
		(mode: Exclude<ActivityReasonMode, null>) => {
			setReasonModal({ mode, loading: false });
		},
		[],
	);

	const closeReasonModal = React.useCallback(() => {
		setReasonModal({ mode: null, loading: false });
	}, []);

	/* ---------------------------------------------------------------------- */
	/*            Approver actions (wired to ApprovalActionsBar)               */
	/* ---------------------------------------------------------------------- */

	// Shared runner for approve/clarify. Errors are toasted here and NOT
	// re-thrown — ApprovalActionsBar calls these with `void` and has no catch,
	// so a throw would surface as an unhandled promise rejection.
	const runWorkflowAction = React.useCallback(
		async (action: Exclude<WorkflowActionInFlight, null>, reason: string) => {
			if (workflowActionRef.current) return;

			const trimmedReason = reason.trim();

			if (!currentStageId || !canActOnCurrentStage) {
				showToast({
					type: "error",
					title: "Not allowed",
					description: "No active approval stage found.",
				});
				return;
			}

			if (!trimmedReason) {
				showToast({
					type: "error",
					title: "Reason required",
					description: "Please enter a reason before continuing.",
				});
				return;
			}

			workflowActionRef.current = action;
			setWorkflowAction(action);

			try {
				const { message } =
					action === "approve"
						? await workflowApi.approveStage(currentStageId, trimmedReason)
						: await workflowApi.clarifyStage(currentStageId, trimmedReason);

				showToast({
					type: "success",
					title: "Success",
					description:
						message ||
						(action === "approve"
							? "Approved successfully."
							: "Sent for clarification."),
				});

				await handleWorkflowUpdate();
			} catch (error) {
				showToast({
					type: "error",
					title: "Error",
					description: getApiErrorMessage(
						error,
						action === "approve"
							? "Error while approving."
							: "Error while sending for clarification.",
					),
				});
			} finally {
				workflowActionRef.current = null;
				setWorkflowAction(null);
			}
		},
		[currentStageId, canActOnCurrentStage, showToast, handleWorkflowUpdate],
	);

	const handleApproveWorkflow = React.useCallback(
		(reason: string) => runWorkflowAction("approve", reason),
		[runWorkflowAction],
	);

	const handleClarifyWorkflow = React.useCallback(
		(reason: string) => runWorkflowAction("clarify", reason),
		[runWorkflowAction],
	);

	/* ---------------------------------------------------------------------- */
	/*                 Reason modal (report clarification only)                */
	/* ---------------------------------------------------------------------- */

	const handleReasonConfirm = React.useCallback(
		async (reason: string) => {
			if (reasonMode !== "clarify-report") return;

			setReasonModal((current) => ({ ...current, loading: true }));
			try {
				if (!reportId || !epcId) throw new Error("No submitted report found.");

				await clarifyReport({ reportId, epcId, reason });
				showToast({
					type: "success",
					title: "Clarification requested",
					description: "The event report was sent back for clarification.",
				});

				closeReasonModal();
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to complete action",
					description: getApiErrorMessage(
						error,
						"Unable to complete this action.",
					),
				});
			} finally {
				setReasonModal((current) => ({ ...current, loading: false }));
			}
		},
		[reasonMode, reportId, epcId, clarifyReport, showToast, closeReasonModal],
	);

	const deviationResubmission = useDeviationResubmission({
		epcData: epcData ?? null,
		permissions,
		onRefresh: handleRefresh,
		appId,
	});

	return {
		epcData,
		workflowEntries,
		reportData,
		reportQuery,

		permissions,

		isLoading,
		isFetching,
		isProposer,
		isValidator,

		proposerName,
		hasValidatorPreviewed,
		currentUserId: user?.id,
		workspaceId,
		appId,
		eventStatus: epcData?.status ?? "unknown",

		editingSection,
		startEditing,
		cancelEditing,
		finishEditing,
		handleCreatedEpc,

		workflowStages,
		deviationPreviewStages,
		workflowData,
		commentContext,
		canComment,
		commentsRefreshKey,
		refreshComments,

		reasonModal,
		openReasonModal,
		closeReasonModal,
		handleReasonConfirm,

		handleApproveWorkflow,
		handleClarifyWorkflow,
		isApprovingWorkflow: workflowAction === "approve",
		isClarifyingWorkflow: workflowAction === "clarify",

		handleDeviationPreviewSuccess,

		isValidatingReport: validateReportMutation.isPending,
		isClarifyingReport: clarifyReportMutation.isPending,
		isClosingEPC: closeEPCMutation.isPending,

		isPreparingPdf,
		isDownloadingPdf,
		isExportingExcel,
		exportState,

		handleDownloadPdf,
		handleExport,
		dismissExport,

		handleRefresh,
		handleOpenReportPreview,
		handleOpenReportBuilder,
		handleValidateReport,
		handleClarifyReport,
		handleCloseEPC,

		...clarifiedResubmission,
		...deviationResubmission,
	};
};

export type ActivityPlannerController = ReturnType<typeof useActivityPlanner>;
