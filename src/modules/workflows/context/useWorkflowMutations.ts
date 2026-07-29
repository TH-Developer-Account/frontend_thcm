import { useCallback, useState } from "react";

import { workflowApi, type AttachWorkflowInput } from "../api/workflow.api";
import type { CreateWorkflowPayload } from "../types/workflow.types";

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
		setState({ loading: true, error: null });
		try {
			return await request();
		} catch (error) {
			setState({ loading: false, error });
			throw error;
		} finally {
			setState((current) => ({ ...current, loading: false }));
		}
	}, []);

	return { ...state, run };
};

export const useSaveWorkflowMutation = () => {
	const mutation = useMutationState();
	const mutateAsync = useCallback(
		(id: string | undefined, payload: CreateWorkflowPayload) =>
			mutation.run(() =>
				id ? workflowApi.update(id, payload) : workflowApi.create(payload),
			),
		[mutation.run],
	);
	return { ...mutation, mutateAsync };
};

export const useDeleteWorkflowMutation = () => {
	const mutation = useMutationState();
	const mutateAsync = useCallback(
		(id: string) => mutation.run(() => workflowApi.remove(id)),
		[mutation.run],
	);
	return { ...mutation, mutateAsync };
};

export const useAssignWorkflowUsersMutation = () => {
	const mutation = useMutationState();
	const mutateAsync = useCallback(
		(templateId: string, userIds: string[]) =>
			mutation.run(() => workflowApi.assignUsers(templateId, userIds)),
		[mutation.run],
	);
	return { ...mutation, mutateAsync };
};

export const useAttachWorkflowMutation = () => {
	const mutation = useMutationState();
	const mutateAsync = useCallback(
		(input: AttachWorkflowInput) =>
			mutation.run(() => workflowApi.attach(input)),
		[mutation.run],
	);
	return { ...mutation, mutateAsync };
};
