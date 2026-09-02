import React from "react";
import { useNavigate } from "react-router-dom";

import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";
import { REPORT_ELIGIBLE_STATUSES } from "../helpers/activityPermissions.helper";
import { getStoredAppId } from "../helpers/localstorage";
import {
	useActivityCommentsQuery,
	useActivityPlannerPdfUrlMutation,
	useClarifyEventReportMutation,
	useEventReportQuery,
	useExportActivityPlannerMutation,
	useValidateEventReportMutation,
} from "../queries/useActivityFormQuery";
import { getApiErrorMessage } from "../../../../utils/apiError.helper";
import { useEpcDetailQuery } from "../queries/useEpcListQuery";
import { useCloseEPC } from "../queries/useEventOutcomeMutation";
import type { EventReportDetail } from "../types/event.report.types";
import { useClarifiedResubmission } from "./useClarifiedResubmission";
import { useDeviationResubmission } from "./useDeviationResubmission";
import { useActivityPermissions } from "./useActivityPermissions";
import { getWorkflowCommentContext } from "../../../../components/ui/comments/comments.helper";
import {
	getWorkflowApproverData,
	workflowApi,
	type ActiveWorkflowLike,
	type WorkflowUserIdentity,
} from "../../../workflows";
import type { ApprovalStageLike } from "../../../workflows/types/types";
import type { WorkflowStage } from "../types/workflow.types";
import { mapEpcWorkflowStage } from "../../../workflows/utils/approvalWorkflow.mapper";

export type ActivityEditingSection = "epc" | "crf" | "epf" | null;
export type ActivityReasonMode = "clarify-workflow" | "clarify-report" | null;

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

			navigate(`/marketing/activity-planner/${createdEpcId}`);
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

	const handleApproveWorkflow = React.useCallback(async () => {
		if (!currentStageId || !canActOnCurrentStage) return;

		try {
			const { message } = await workflowApi.approveStage(currentStageId);
			showToast({ type: "success", title: "Success", description: message });
			await handleWorkflowUpdate();
		} catch (error) {
			showToast({
				type: "error",
				title: "Error",
				description: getApiErrorMessage(error, "Error while approving."),
			});
		}
	}, [currentStageId, canActOnCurrentStage, showToast, handleWorkflowUpdate]);

	const handleReasonConfirm = React.useCallback(
		async (reason: string) => {
			if (!reasonMode) return;

			setReasonModal((current) => ({ ...current, loading: true }));
			try {
				if (reasonMode === "clarify-workflow") {
					if (!currentStageId || !canActOnCurrentStage) {
						throw new Error("No active approval stage found.");
					}
					const { message } = await workflowApi.clarifyStage(
						currentStageId,
						reason,
					);
					showToast({
						type: "success",
						title: "Success",
						description: message,
					});
					await handleWorkflowUpdate();
				} else {
					if (!reportId || !epcId)
						throw new Error("No submitted report found.");
					await clarifyReport({ reportId, epcId, reason });
					showToast({
						type: "success",
						title: "Clarification requested",
						description: "The event report was sent back for clarification.",
					});
				}

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
		[
			reasonMode,
			currentStageId,
			canActOnCurrentStage,
			reportId,
			epcId,
			clarifyReport,
			showToast,
			handleWorkflowUpdate,
			closeReasonModal,
		],
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
