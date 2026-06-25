// hooks/useActivityPermissions.ts

import React from "react";
import { useAuth } from "../../../../context/Auth/useAuth";
import type { EpcDetailResponse } from "../types/epc.types";
import type { EventReportDetail } from "../types/event.report.types";
import type { WorkflowEntry } from "../helpers/activityPlannerStatus.helper";
import { getActivityPermissions } from "../helpers/activityPermissions.helper";

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
