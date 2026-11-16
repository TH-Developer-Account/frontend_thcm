import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { cppApi } from "../api/cpp.api";
import type { CppRequestPayload } from "../types/cpp.types";

export const cppKeys = {
	all: ["cpp"] as const,
	lists: () => [...cppKeys.all, "list"] as const,
	detail: (id: string) => [...cppKeys.all, "detail", id] as const,
};

export const cppDetailQueryOptions = (id: string) =>
	queryOptions({
		queryKey: cppKeys.detail(id),
		queryFn: () => cppApi.getById(id),
		enabled: Boolean(id),
		staleTime: Infinity,
		gcTime: 5 * 60_000,
		refetchOnMount: "always",
	});

export const useCppDetail = (id: string) => useQuery(cppDetailQueryOptions(id));

export const useCppMutations = () => {
	const queryClient = useQueryClient();

	const invalidateLists = () =>
		queryClient.invalidateQueries({ queryKey: cppKeys.lists() });

	const createMutation = useMutation({
		mutationFn: (payload: CppRequestPayload = {}) => cppApi.create(payload),
		onSuccess: ({ data }) => {
			queryClient.setQueryData(cppKeys.detail(data.id), data);
			void invalidateLists();
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: CppRequestPayload & { rowVersion: number };
		}) => cppApi.update(id, payload),
		onSuccess: ({ data }) => {
			// The response carries the new rowVersion — keep the cache current.
			queryClient.setQueryData(cppKeys.detail(data.id), data);
			void invalidateLists();
		},
	});

	const deleteDraftMutation = useMutation({
		mutationFn: (id: string) => cppApi.deleteDraft(id),
		onSuccess: (_result, id) => {
			queryClient.removeQueries({ queryKey: cppKeys.detail(id) });
			void invalidateLists();
		},
	});

	const uploadAttachmentMutation = useMutation({
		mutationFn: ({ id, file, type }: { id: string; file: File; type: string }) =>
			cppApi.uploadAttachment(id, file, type),
		onSuccess: (_attachment, { id }) =>
			queryClient.invalidateQueries({ queryKey: cppKeys.detail(id) }),
	});

	const deleteAttachmentMutation = useMutation({
		mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
			cppApi.deleteAttachment(id, attachmentId),
		onSuccess: (_result, { id }) =>
			queryClient.invalidateQueries({ queryKey: cppKeys.detail(id) }),
	});

	return {
		createMutation,
		updateMutation,
		deleteDraftMutation,
		uploadAttachmentMutation,
		deleteAttachmentMutation,
	};
};
