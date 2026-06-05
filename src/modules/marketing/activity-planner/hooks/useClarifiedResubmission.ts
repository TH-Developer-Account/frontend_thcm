import React from "react";
import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";

import type { EpcDetailResponse } from "../types/epc.types";
import {
	hasUnresolvedClarificationInComments,
	type WorkflowEntry,
} from "../helpers/activityPlannerStatus.helper";

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

	const [hasSubmittedClarifiedUpdate, setHasSubmittedClarifiedUpdate] =
		React.useState(false);

	const workflowId = epcData?.activeWorkflow?.id ?? null;
	const currentUserId = getUserId(auth);

	const isProposer =
		Boolean(currentUserId) && currentUserId === epcData?.created_by_id;
	const epcStatus = epcData?.status === "CLARIFY";
	const hasUnresolvedClarification =
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
			showToast({
				type: "error",
				title: "Cannot submit",
				description: "No active workflow found.",
			});
			return;
		}

		if (!isClarifiedPending) {
			showToast({
				type: "error",
				title: "Cannot submit",
				description: "This clarification has already been submitted.",
			});
			return;
		}

		try {
			await submitClarifiedMutation.mutateAsync(workflowId);

			showToast({
				type: "success",
				title: "Submitted",
				description: "Updated form submitted successfully.",
			});
			setHasSubmittedClarifiedUpdate(true);
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
