import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";

import type { EpcDetailResponse } from "../types/epc.types";
import {
	hasUnresolvedDeviationInComments,
	isDeviationStatus,
	getUserId,
	type WorkflowEntry,
} from "../helpers/activityPlannerStatus.helper";
import { useSubmitDeviatedUpdatedFormMutation } from "../queries/useEventOutcomeMutation";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../../utils/apiError.helper";

type UseDeviationResubmissionArgs = {
	epcData?: EpcDetailResponse | null;
	workflowEntries?: WorkflowEntry[];
	onRefresh: () => Promise<unknown>;
};

export const useDeviationResubmission = ({
	epcData,
	workflowEntries = [],
	onRefresh,
}: UseDeviationResubmissionArgs) => {
	const { showToast } = useToast();
	const auth = useAuth();
	const currentUserId = getUserId(auth);

	const submitDeviationMutation = useSubmitDeviatedUpdatedFormMutation();

	const isProposer =
		Boolean(currentUserId) && currentUserId === epcData?.created_by_id;

	const workflowId = epcData?.activeWorkflow?.id ?? null;

	const hasUnresolvedDeviationClarification =
		hasUnresolvedDeviationInComments(workflowEntries);

	const isDeviationPending =
		isProposer &&
		isDeviationStatus(epcData?.status) &&
		hasUnresolvedDeviationClarification;

	const submitDeviationUpdate = async () => {
		if (!workflowId) {
			showApiErrorToast(showToast, "No active workflow found.");
			return;
		}

		if (!isDeviationPending) {
			showApiErrorToast(showToast, "No pending deviation clarification found.");
			return;
		}

		try {
			await submitDeviationMutation.mutateAsync(workflowId);
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
	};
};
