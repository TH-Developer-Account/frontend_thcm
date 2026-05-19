import React from "react";

import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";

import type { EpcDetailResponse } from "../types/epc.types";

import {
	hasAnyUpdatedSection,
	hasClarificationInComments,
	isPendingEpc,
	type UpdatedSection,
	type WorkflowEntry,
} from "../utils/activityPlannerStatus.helper";

import { useSubmitClarifiedUpdatedFormMutation } from "../queries/useEpcMutation";

type UpdatedSectionsState = {
	epcId: string | null;
	sections: Set<UpdatedSection>;
};

type ClarifiedState = {
	epcId: string | null;
	hasClarification: boolean;
};

type UseClarifiedResubmissionArgs = {
	epcData?: EpcDetailResponse | null;
	workflowEntries?: WorkflowEntry[];
	onRefresh: () => Promise<unknown>;
};

const emptyUpdatedSections = new Set<UpdatedSection>();

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

	const [updatedSectionsState, setUpdatedSectionsState] =
		React.useState<UpdatedSectionsState>({
			epcId: null,
			sections: new Set(),
		});

	const [clarifiedState, setClarifiedState] = React.useState<ClarifiedState>({
		epcId: null,
		hasClarification: false,
	});

	const epcId = epcData?.id ?? null;
	const currentUserId = getUserId(auth);

	const isProposer =
		Boolean(currentUserId) && currentUserId === epcData?.created_by_id;

	const hasClarificationFromComments =
		hasClarificationInComments(workflowEntries);

	React.useEffect(() => {
		if (!epcId || !hasClarificationFromComments) return;

		setClarifiedState((prev) => {
			if (prev.epcId === epcId && prev.hasClarification) return prev;

			return {
				epcId,
				hasClarification: true,
			};
		});
	}, [epcId, hasClarificationFromComments]);

	const hasPersistedClarification =
		clarifiedState.epcId === epcId && clarifiedState.hasClarification;

	const isClarifiedPending =
		isProposer &&
		isPendingEpc(epcData) &&
		(hasClarificationFromComments || hasPersistedClarification);

	const updatedSections =
		isClarifiedPending && updatedSectionsState.epcId === epcId
			? updatedSectionsState.sections
			: emptyUpdatedSections;

	const canSubmitClarifiedUpdate =
		isClarifiedPending && hasAnyUpdatedSection(updatedSections);

	const markSectionUpdated = (section: UpdatedSection) => {
		if (!epcId || !isProposer) return;

		setUpdatedSectionsState((prev) => {
			const nextSections =
				prev.epcId === epcId
					? new Set(prev.sections)
					: new Set<UpdatedSection>();

			nextSections.add(section);

			return {
				epcId,
				sections: nextSections,
			};
		});
	};

	const submitClarifiedUpdate = async () => {
		if (!epcId || !isProposer || !isClarifiedPending) return;

		if (!canSubmitClarifiedUpdate) {
			showToast({
				type: "error",
				title: "Pending Updates",
				description: "Please update at least one form before final submit.",
			});

			return;
		}

		try {
			await submitClarifiedMutation.mutateAsync(epcId);

			showToast({
				type: "success",
				title: "Submitted",
				description: "Updated form submitted successfully.",
			});

			setUpdatedSectionsState({
				epcId,
				sections: new Set(),
			});

			setClarifiedState({
				epcId,
				hasClarification: false,
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
		updatedSections,
		isClarifiedPending,
		canSubmitClarifiedUpdate,
		isSubmittingClarifiedUpdate: submitClarifiedMutation.isPending,
		markSectionUpdated,
		submitClarifiedUpdate,
	};
};
