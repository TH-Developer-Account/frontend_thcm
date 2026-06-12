import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";
import type { EpcDetailResponse } from "../types/epc.types";
import { useSubmitDeviatedUpdatedFormMutation } from "../queries/useEventOutcomeMutation";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../../utils/apiError.helper";
import type { ActivityPermissions } from "../helpers/activityPermissions.helper";

type UseDeviationResubmissionArgs = {
	epcData?: EpcDetailResponse | null;
	permissions: ActivityPermissions;
	onRefresh: () => Promise<unknown>;
	appId?: string | null;
};

export const useDeviationResubmission = ({
	epcData,
	onRefresh,
	permissions,
	appId,
}: UseDeviationResubmissionArgs) => {
	const { showToast } = useToast();
	const { workspaceId } = useAuth();

	const submitDeviationMutation = useSubmitDeviatedUpdatedFormMutation();
	const workflowId = epcData?.activeWorkflow?.id ?? null;
	const isDeviationPending = permissions.isDeviationPending;
	const canSubmitDeviationUpdate = permissions.canSubmitDeviationUpdate;

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
