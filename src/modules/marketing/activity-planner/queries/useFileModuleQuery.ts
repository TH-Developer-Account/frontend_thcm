import { useQuery } from "@tanstack/react-query";

import { filesApi } from "../api/file.module.api";

export const fileModuleKeys = {
	all: ["files"] as const,

	lists: () => [...fileModuleKeys.all, "list"] as const,

	list: (params?: Record<string, unknown>) =>
		[...fileModuleKeys.lists(), params ?? {}] as const,
};

const FILES_STALE_TIME = 60 * 1000;

export const useFileModuleQuery = () => {
	return useQuery({
		queryKey: fileModuleKeys.list(),
		queryFn: filesApi.getAll,
		staleTime: FILES_STALE_TIME,
		refetchOnWindowFocus: false,
	});
};
