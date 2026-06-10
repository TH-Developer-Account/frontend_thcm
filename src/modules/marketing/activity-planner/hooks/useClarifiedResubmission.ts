import React from "react";
import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";

import type { EpcDetailResponse } from "../types/epc.types";
import {
	getUserId,
	hasUnresolvedClarificationInComments,
	hasFormUpdateAfterIssue,
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

	const hasUnresolvedWorkflowClarification =
		hasUnresolvedClarificationInComments(workflowEntries);

	const isWorkflowClarifiedPending =
		isProposer &&
		!hasSubmittedClarifiedUpdate &&
		hasUnresolvedWorkflowClarification;

	const hasWorkflowFormUpdate = hasFormUpdateAfterIssue(
		workflowEntries,
		"CLARIFICATION",
	);

	const canSubmitClarifiedUpdate =
		isWorkflowClarifiedPending && hasWorkflowFormUpdate;

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
			setHasSubmittedClarifiedUpdate(true);
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
