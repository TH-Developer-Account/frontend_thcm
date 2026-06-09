import React from "react";
import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";

import type { EpcDetailResponse } from "../types/epc.types";
import {
	getUserId,
	hasUnresolvedClarificationInComments,
	type WorkflowEntry,
} from "../helpers/activityPlannerStatus.helper";

import { useSubmitClarifiedUpdatedFormMutation } from "../queries/useEventOutcomeMutation";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../../utils/apiError.helper";

type UseClarifiedResubmissionArgs = {
	epcData?: EpcDetailResponse | null;
	workflowEntries?: WorkflowEntry[];
	onRefresh: () => Promise<unknown>;
};

export const useClarifiedResubmission = ({
	epcData,
	workflowEntries = [],
	onRefresh,
}: UseClarifiedResubmissionArgs) => {
	const { showToast } = useToast();
	const auth = useAuth();

	const submitClarifiedMutation = useSubmitClarifiedUpdatedFormMutation();

	const [hasSubmittedClarifiedUpdate, setHasSubmittedClarifiedUpdate] =
		React.useState(false);

	const workflowId = epcData?.activeWorkflow?.id ?? null;
	const currentUserId = getUserId(auth);

	const isProposer =
		Boolean(currentUserId) && currentUserId === epcData?.created_by_id;
	const epcStatus = epcData?.status === "CLARIFY";
	const hasUnresolvedDeviation =
		hasUnresolvedClarificationInComments(workflowEntries);

	// console.log("hasUnresolvedClarification", hasUnresolvedClarification);
	// console.log("hasSubmittedClarifiedUpdate", hasSubmittedClarifiedUpdate);

	// const isClarifiedPending =
	// 	isProposer &&
	// 	epcStatus &&
	// 	!hasSubmittedClarifiedUpdate &&
	// 	hasUnresolvedClarification;
	//from activity log clarified resubmit status should be provided, then status can be compared. and Once in epc clearifed submit shows button can be disabled.
	const isClarifiedPending = isProposer && epcStatus;
	// console.log("isClarifiedPending", isClarifiedPending);

	const submitClarifiedUpdate = async () => {
		if (!workflowId) {
			showApiErrorToast(showToast, "No active workflow found.");
			return;
		}

		if (!isClarifiedPending) {
			showApiErrorToast(
				showToast,
				"This clarification has already been submitted.",
			);
			return;
		}

		try {
			await submitClarifiedMutation.mutateAsync(workflowId);
			showSuccessToast(showToast, "Updated form submitted successfully.");
			setHasSubmittedClarifiedUpdate(true);
			await onRefresh();
		} catch (error: unknown) {
			showApiErrorToast(showToast, `Failed to submit updated form ${error}.`);
		}
	};

	return {
		isClarifiedPending,
		isSubmittingClarifiedUpdate: submitClarifiedMutation.isPending,
		submitClarifiedUpdate,
	};
};
