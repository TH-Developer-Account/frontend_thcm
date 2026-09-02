import React from "react";

import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";
import {
	getActivityPermissions,
	REPORT_ELIGIBLE_STATUSES,
} from "../helpers/activityPermissions.helper";
import { getStoredAppId } from "../helpers/localstorage";
import {
	useActivityCommentsQuery,
	useActivityPlannerPdfUrlMutation,
	useClarifyEventReportMutation,
	useEventReportQuery,
	useExportActivityPlannerMutation,
	useValidateEventReportMutation,
} from "../queries/useActivityFormQuery";
import {
	pollExportJob,
	type ExportState,
} from "../../../../utils/exportJob.helper";
import { getApiErrorMessage } from "../../../../utils/apiError.helper";
import { useEpcDetailQuery } from "../queries/useEpcListQuery";
import { useCloseEPC } from "../queries/useEventOutcomeMutation";
import type { EventReportDetail } from "../types/event.report.types";
import { useClarifiedResubmission } from "./useClarifiedResubmission";
import { useDeviationResubmission } from "./useDeviationResubmission";
import { filesApi } from "../api/file.module.api";

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

const DELAYED_EXPORT_THRESHOLD_MS = 4000;

export const useActivityPlanner = (id: string | undefined) => {
	const { user } = useAuth();
	const { showToast } = useToast();

	const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
	const [hasValidatorPreviewed, setHasValidatorPreviewed] =
		React.useState(false);
	const [exportState, setExportState] = React.useState<ExportState>({
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

	const permissions = React.useMemo(
		() =>
			getActivityPermissions({
				epcData: epcData ?? null,
				report: reportData,
				workflowEntries,
				hasValidatorPreviewed,
				userId: user?.id,
			}),
		[epcData, reportData, workflowEntries, hasValidatorPreviewed, user?.id],
	);

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

	const handleOpenReportPreview = React.useCallback(() => {
		if (isValidator) {
			setHasValidatorPreviewed(true);
		}
	}, [isValidator]);

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

			await handleRefresh();
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
	}, [reportId, epcId, validateReport, showToast, handleRefresh]);

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

				await handleRefresh();
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
		[reportId, epcId, clarifyReport, showToast, handleRefresh],
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
			const pdfUrl = await getActivityPlannerPdfUrl(epcId);

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

		const delayedTimer = window.setTimeout(() => {
			setExportState((current) =>
				current.status === "pending" ? { status: "delayed" } : current,
			);
		}, DELAYED_EXPORT_THRESHOLD_MS);

		try {
			const queuedExport = await exportActivityPlanner();

			const downloadUrl = await pollExportJob(
				filesApi.getExportStatus,
				queuedExport.jobId,
			);

			window.clearTimeout(delayedTimer);

			setExportState({
				status: "ready",
				downloadUrl,
			});
		} catch (error) {
			window.clearTimeout(delayedTimer);

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

	const isExportingExcel =
		exportState.status === "pending" || exportState.status === "delayed";

	const clarifiedResubmission = useClarifiedResubmission({
		epcData: epcData ?? null,
		permissions,
		onRefresh: handleRefresh,
	});

	const appId = React.useMemo(() => getStoredAppId(), []);

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
		handleValidateReport,
		handleClarifyReport,
		handleCloseEPC,

		...clarifiedResubmission,
		...deviationResubmission,
	};
};
