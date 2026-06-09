import React from "react";
import { useAuth } from "../../../../context/Auth/useAuth";
import { useEpcDetailQuery } from "../queries/useEpcListQuery";
import {
	useActivityCommentsQuery,
	useValidateEventReportMutation,
	useEventReportQuery,
} from "../queries/useActivityFormQuery";
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

	const {
		data: epcData,
		isLoading,
		isFetching,
		refetch,
	} = useEpcDetailQuery(id);

	const { data: workflowEntries = [], refetch: refetchWorkflowEntries } =
		useActivityCommentsQuery(epcData?.id ?? null);

	const reportQuery = useEventReportQuery(
		id,
		Boolean(id) && isReportFlowStatus(epcData?.status),
	);

	const validateReportMutation = useValidateEventReportMutation();

	const [hasValidatorPreviewed, setHasValidatorPreviewed] =
		React.useState(false);

	const reportData = React.useMemo(
		() => normalizeReportForView(reportQuery.data ?? epcData?.report ?? null),
		[reportQuery.data, epcData?.report],
	);

	const isProposer = epcData?.created_by_id === user?.id;
	const isValidator = reportData?.validatorId === user?.id;
	const proposerName = isProposer
		? `${user?.first_name} ${user?.last_name}`
		: "--";

	const handleRefresh = async () => {
		await refetch();
		await refetchWorkflowEntries();
	};

	const handleOpenReportPreview = (onOpen: () => void) => {
		onOpen();
		if (isValidator) setHasValidatorPreviewed(true);
	};

	const handleValidateReport = async () => {
		if (!reportData?.id || !epcData?.id) return;
		await validateReportMutation.mutateAsync({ reportId: reportData.id });
		setHasValidatorPreviewed(false);
		await handleRefresh();
		await reportQuery.refetch();
	};

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
		// data
		epcData,
		workflowEntries,
		reportData,
		reportQuery,
		// state
		isLoading,
		isFetching,
		isProposer,
		isValidator,
		proposerName,
		hasValidatorPreviewed,
		isValidatingReport: validateReportMutation.isPending,
		// handlers
		handleRefresh,
		handleOpenReportPreview,
		handleValidateReport,
		// clarification
		...clarifiedResubmission,
		...deviationResubmission,
	};
};
