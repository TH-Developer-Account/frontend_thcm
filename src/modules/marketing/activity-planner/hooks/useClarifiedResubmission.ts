import { useToast } from "../../../../context/Auth/AuthContext";
import type { EpcDetailResponse } from "../types/epc.types";
import { useSubmitClarifiedUpdatedFormMutation } from "../queries/useEventOutcomeMutation";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../../utils/apiError.helper";
import type { ActivityPermissions } from "../helpers/activityPermissions.helper";

type UseClarifiedResubmissionArgs = {
	epcData?: EpcDetailResponse | null;
	onRefresh: () => Promise<unknown>;
	permissions: ActivityPermissions;
};

export const useClarifiedResubmission = ({
	epcData,
	onRefresh,
	permissions,
}: UseClarifiedResubmissionArgs) => {
	const { showToast } = useToast();

	const submitClarifiedMutation = useSubmitClarifiedUpdatedFormMutation();
	const workflowId = epcData?.activeWorkflow?.id ?? null;

	const isWorkflowClarifiedPending = permissions.isClarifiedPending;
	const canSubmitClarifiedUpdate = permissions.canSubmitClarifiedUpdate;

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
