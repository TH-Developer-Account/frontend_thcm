import React from "react";
import { useAuth } from "../../../../context/Auth/useAuth";
import { useEpcDetailQuery } from "../queries/useEpcListQuery";
import {
	useActivityCommentsQuery,
	useClarifyEventReportMutation,
	useEventReportQuery,
	useValidateEventReportMutation,
} from "../queries/useActivityFormQuery";
import { useCloseEPC } from "../queries/useEventOutcomeMutation";
import { useToast } from "../../../../context/Auth/AuthContext";
import { useClarifiedResubmission } from "./useClarifiedResubmission";
import { useDeviationResubmission } from "./useDeviationResubmission";
import type { EventReportDetail } from "../types/event.report.types";
import { getStoredAppId } from "../helpers/localstorage";
import {
	getActivityPermissions,
	REPORT_ELIGIBLE_STATUSES,
} from "../helpers/activityPermissions.helper";

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

export const useActivityPlanner = (id: string | undefined) => {
	const { user } = useAuth();
	const { showToast } = useToast();

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

	const { mutateAsync: validateReport } = validateReportMutation;
	const { mutateAsync: clarifyReport } = clarifyReportMutation;
	const { mutateAsync: closeEPC } = closeEPCMutation;

	const [hasValidatorPreviewed, setHasValidatorPreviewed] =
		React.useState(false);

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
		await refetch();
		await refetchWorkflowEntries();
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

		await validateReport({
			reportId,
			epcId,
		});

		showToast({
			type: "success",
			title: "Success",
			description: "Report validated successfully.",
		});
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

			await clarifyReport({
				reportId,
				epcId,
				reason,
			});
		},
		[reportId, epcId, clarifyReport, showToast],
	);

	const handleCloseEPC = React.useCallback(async () => {
		if (!epcId) {
			showToast({
				type: "error",
				title: "Not allowed",
				description: "No EPC found",
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
		} catch (err) {
			showToast({
				type: "error",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to close EPC.",
			});
		}
	}, [epcId, closeEPC, showToast, handleRefresh]);

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
		isProposer: permissions.isProposer,
		isValidator: permissions.isValidator,

		proposerName,
		hasValidatorPreviewed,
		isValidatingReport: validateReportMutation.isPending,
		isClarifyingReport: clarifyReportMutation.isPending,
		isClosingEPC: closeEPCMutation.isPending,

		handleRefresh,
		handleOpenReportPreview,
		handleValidateReport,
		handleClarifyReport,
		handleCloseEPC,

		...clarifiedResubmission,
		...deviationResubmission,
	};
};
