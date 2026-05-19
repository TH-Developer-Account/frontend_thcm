import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";

import type { EpcDetailResponse } from "../types/epc.types";
import {
	hasClarificationInComments,
	isPendingStatus,
	type WorkflowEntry,
} from "../utils/activityPlannerStatus.helper";

import { useSubmitClarifiedUpdatedFormMutation } from "../queries/useEpcMutation";

type UseClarifiedResubmissionArgs = {
	epcData?: EpcDetailResponse | null;
	workflowEntries?: WorkflowEntry[];
	onRefresh: () => Promise<unknown>;
};

const getUserId = (authUser: any) => {
	return (
		authUser?.id ??
		authUser?.userId ??
		authUser?.user_id ??
		authUser?.user?.id ??
		authUser?.user?.userId ??
		authUser?.data?.id ??
		authUser?.profile?.id ??
		null
	);
};

export const useClarifiedResubmission = ({
	epcData,
	workflowEntries = [],
	onRefresh,
}: UseClarifiedResubmissionArgs) => {
	const { showToast } = useToast();
	const auth = useAuth();

	const submitClarifiedMutation = useSubmitClarifiedUpdatedFormMutation();

	const workflowId = epcData?.activeWorkflow?.id ?? null;
	const currentUserId = getUserId(auth);

	const isProposer =
		Boolean(currentUserId) && currentUserId === epcData?.created_by_id;

	const hasClarification = hasClarificationInComments(workflowEntries);

	const isClarifiedPending =
		isProposer && isPendingStatus(epcData?.status) && hasClarification;

	const submitClarifiedUpdate = async () => {
		if (!workflowId || !isClarifiedPending) return;

		try {
			await submitClarifiedMutation.mutateAsync(workflowId);

			showToast({
				type: "success",
				title: "Submitted",
				description: "Updated form submitted successfully.",
			});

			await onRefresh();
		} catch (error: any) {
			showToast({
				type: "error",
				title: "Error",
				description:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to submit updated form.",
			});
		}
	};

	return {
		isClarifiedPending,
		isSubmittingClarifiedUpdate: submitClarifiedMutation.isPending,
		submitClarifiedUpdate,
	};
};
