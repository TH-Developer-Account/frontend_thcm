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
import { isReportFlowStatus } from "../helpers/activityPlannerStatus.helper";
import type { EventReportDetail } from "../types/event.report.types";
import { getStoredAppId } from "../helpers/localstorage";

const normalizeReportForView = (
	report: EventReportDetail | any | null | undefined,
): EventReportDetail | null => {
	if (!report) return null;

	return {
		...report,
		images:
			report.images?.map((image: any) => ({
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

	const reportQuery = useEventReportQuery(
		id,
		Boolean(id) && isReportFlowStatus(epcData?.status),
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

	const isProposer = epcData?.created_by_id === user?.id;
	const isValidator = reportData?.validatorId === user?.id;

	const proposerName = epcData?.created_by
		? `${epcData.created_by.first_name ?? ""} ${
				epcData.created_by.last_name ?? ""
			}`.trim()
		: isProposer
			? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
			: "--";

	const handleRefresh = React.useCallback(async () => {
		await refetch();
		await refetchWorkflowEntries();
	}, [refetch, refetchWorkflowEntries]);

	const handleOpenReportPreview = React.useCallback(
		(onOpen: () => void) => {
			onOpen();

			if (isValidator) {
				setHasValidatorPreviewed(true);
			}
		},
		[isValidator],
	);

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
		workflowEntries,
		onRefresh: handleRefresh,
	});

	const appId = React.useMemo(() => getStoredAppId(), []);

	const deviationResubmission = useDeviationResubmission({
		epcData: epcData ?? null,
		workflowEntries,
		onRefresh: handleRefresh,
		appId,
	});

	return {
		epcData,
		workflowEntries,
		reportData,
		reportQuery,

		isLoading,
		isFetching,
		isProposer,
		isValidator,
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
