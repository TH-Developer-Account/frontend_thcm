import { useCallback, useState } from "react";

import {
	workflowApi,
	type ActivateFirstStagePayload,
	type AssignWorkflowPayload,
	type PreviewWorkflowPayload,
	type TriggerDeviationPayload,
} from "../api/workflow.api";
import type {
	AttachWorkflowInput,
	CreateWorkflowPayload,
} from "../types/types";

type MutationState = {
	loading: boolean;
	error: unknown;
};

const useMutationState = () => {
	const [state, setState] = useState<MutationState>({
		loading: false,
		error: null,
	});

	const run = useCallback(async <T>(request: () => Promise<T>): Promise<T> => {
		setState({
			loading: true,
			error: null,
		});

		try {
			return await request();
		} catch (error) {
			setState((current) => ({
				...current,
				error,
			}));

			throw error;
		} finally {
			setState((current) => ({
				...current,
				loading: false,
			}));
		}
	}, []);

	const reset = useCallback(() => {
		setState({
			loading: false,
			error: null,
		});
	}, []);

	return {
		...state,
		run,
		reset,
	};
};

/*
|--------------------------------------------------------------------------
| Workflow template mutations
|--------------------------------------------------------------------------
*/

export const useSaveWorkflowMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(id: string | undefined, payload: CreateWorkflowPayload) =>
			mutation.run(() =>
				id ? workflowApi.update(id, payload) : workflowApi.create(payload),
			),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

export const useCreateUserWorkflowMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(payload: CreateWorkflowPayload) =>
			mutation.run(() => workflowApi.createUser(payload)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

export const useDeleteWorkflowMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(id: string) => mutation.run(() => workflowApi.remove(id)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

export const useAssignWorkflowUsersMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(templateId: string, userIds: string[]) =>
			mutation.run(() => workflowApi.assignUsers(templateId, userIds)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

/*
|--------------------------------------------------------------------------
| Workflow preview mutations
|--------------------------------------------------------------------------
*/

export const usePreviewWorkflowMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(payload: PreviewWorkflowPayload) =>
			mutation.run(() => workflowApi.previewWorkflow(payload)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

export const usePreviewWorkflowAttachmentMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(input: AttachWorkflowInput) =>
			mutation.run(() => workflowApi.previewAttachment(input)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

/*
|--------------------------------------------------------------------------
| Workflow assignment mutations
|--------------------------------------------------------------------------
*/

export const useAssignWorkflowMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(payload: AssignWorkflowPayload) =>
			mutation.run(() => workflowApi.assignWorkflow(payload)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

/**
 * Used by reusable workflow sections that work with recordRef/recordType.
 * Internally this calls the same assign-workflow endpoint.
 */
export const useAttachWorkflowMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(input: AttachWorkflowInput) =>
			mutation.run(() => workflowApi.attach(input)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

/*
|--------------------------------------------------------------------------
| Approval mutations
|--------------------------------------------------------------------------
*/

export const useApproveWorkflowStageMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(stageId: string) => mutation.run(() => workflowApi.approveStage(stageId)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

export const useClarifyWorkflowStageMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(stageId: string, reason: string) =>
			mutation.run(() => workflowApi.clarifyStage(stageId, reason)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

/*
|--------------------------------------------------------------------------
| Clarification resubmission
|--------------------------------------------------------------------------
*/

export const useActivateFirstStageMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(payload: ActivateFirstStagePayload) =>
			mutation.run(() => workflowApi.activateFirstStage(payload)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

/*
|--------------------------------------------------------------------------
| Deviation mutations
|--------------------------------------------------------------------------
*/

export const useTriggerWorkflowDeviationMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(payload: TriggerDeviationPayload) =>
			mutation.run(() => workflowApi.triggerDeviation(payload)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

type InitiateDeviationPayload = Parameters<
	typeof workflowApi.initiateDeviation
>[1];

export const useInitiateWorkflowDeviationMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(epcId: string, payload: InitiateDeviationPayload) =>
			mutation.run(() => workflowApi.initiateDeviation(epcId, payload)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

/*
|--------------------------------------------------------------------------
| Workflow comment mutations
|--------------------------------------------------------------------------
*/

type CreateApprovalCommentPayload = Parameters<
	typeof workflowApi.createApprovalComment
>[0];

export const useCreateApprovalCommentMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(payload: CreateApprovalCommentPayload) =>
			mutation.run(() => workflowApi.createApprovalComment(payload)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};

type CreateCreatorCommentPayload = Parameters<
	typeof workflowApi.createCreatorComment
>[0];

export const useCreateCreatorCommentMutation = () => {
	const mutation = useMutationState();

	const mutateAsync = useCallback(
		(payload: CreateCreatorCommentPayload) =>
			mutation.run(() => workflowApi.createCreatorComment(payload)),
		[mutation.run],
	);

	return {
		...mutation,
		mutateAsync,
	};
};
