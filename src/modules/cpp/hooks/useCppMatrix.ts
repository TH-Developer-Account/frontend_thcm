import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cppMatrixApi } from "../api/cpp.matrix.api";
import type { CppApprovalMatrix, CppMatrixSlotUpdate } from "../types/cpp.types";
import { useDebouncedValue } from "../../medicalReimbursment/hooks/useDebouncedValue";

export const cppMatrixKeys = {
	matrix: ["cpp", "approval-matrix"] as const,
	chains: ["cpp", "approval-matrix", "chains"] as const,
	users: (search: string) => ["cpp", "approval-matrix", "users", search] as const,
};

export const useCppMatrix = () => {
	const queryClient = useQueryClient();

	const matrixQuery = useQuery({
		queryKey: cppMatrixKeys.matrix,
		queryFn: cppMatrixApi.get,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

	const keepFresh = (matrix: CppApprovalMatrix) =>
		queryClient.setQueryData(cppMatrixKeys.matrix, matrix);

	const saveMutation = useMutation({
		mutationFn: (assignments: CppMatrixSlotUpdate[]) => cppMatrixApi.save(assignments),
		onSuccess: keepFresh,
	});

	const replaceMutation = useMutation({
		mutationFn: ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) =>
			cppMatrixApi.replaceUser(fromUserId, toUserId),
		onSuccess: keepFresh,
	});

	return { matrixQuery, saveMutation, replaceMutation };
};

export const useCppChains = () =>
	useQuery({
		queryKey: cppMatrixKeys.chains,
		queryFn: cppMatrixApi.chains,
		staleTime: Infinity, // the chains only change with a release
		refetchOnWindowFocus: false,
	});

export const useCppPeopleSearch = (search: string, enabled = true) => {
	const debounced = useDebouncedValue(search.trim());
	return useQuery({
		queryKey: cppMatrixKeys.users(debounced),
		queryFn: () => cppMatrixApi.searchUsers(debounced),
		enabled,
		staleTime: 60_000,
		refetchOnWindowFocus: false,
	});
};
