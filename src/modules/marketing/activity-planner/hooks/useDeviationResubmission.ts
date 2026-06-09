import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";

import type { EpcDetailResponse } from "../types/epc.types";
import {
	hasUnresolvedDeviationInComments,
	isStatus,
	getUserId,
	type WorkflowEntry,
	hasFormUpdateAfterIssue,
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
	appId?: string | null;
};

export const useDeviationResubmission = ({
	epcData,
	workflowEntries = [],
	onRefresh,
	appId,
}: UseDeviationResubmissionArgs) => {
	const { showToast } = useToast();
	const auth = useAuth();
	const { workspaceId } = useAuth();
	const currentUserId = getUserId(auth);

	const submitDeviationMutation = useSubmitDeviatedUpdatedFormMutation();

	const isProposer =
		Boolean(currentUserId) && currentUserId === epcData?.created_by_id;

	const workflowId = epcData?.activeWorkflow?.id ?? null;

	const hasUnresolvedDeviation =
		hasUnresolvedDeviationInComments(workflowEntries);
	const isDeviationPending =
		isProposer &&
		isStatus(epcData?.status, "DEVIATION_IN_PROGRESS") &&
		hasUnresolvedDeviation;
	const hasFormUpdate = hasFormUpdateAfterIssue(workflowEntries, "DEVIATION");

	const canSubmitDeviationUpdate = isDeviationPending && hasFormUpdate;

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
