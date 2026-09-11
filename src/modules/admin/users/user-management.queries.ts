import { userApi } from "./users.api";

export const userKeys = {
	all: ["users"] as const,
	lists: () => [...userKeys.all, "list"] as const,
	list: (profile = "all") => [...userKeys.lists(), { profile }] as const,
	details: () => [...userKeys.all, "detail"] as const,
	detail: (userId: string) => [...userKeys.details(), userId] as const,
};

// List data is admin-managed and rarely changes underneath the current
// session — treat it as reference data. Bump this down to a real staleTime
// (e.g. 60_000) if other admins editing users concurrently becomes common.
export const USER_QUERY_OPTIONS = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

export const DETAIL_QUERY_CACHE_OPTIONS = {
	staleTime: Infinity,
	gcTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

/**
 * One canonical source for queryKey/queryFn per resource. Hooks compose
 * these instead of redefining queryKey/queryFn inline — keeps cache keys
 * consistent across every consumer (list hook, detail hook, any future
 * `select`-based derived hook).
 */
export const userQueries = {
	list: () => ({
		queryKey: userKeys.list("all"),
		queryFn: userApi.getUsers,
		...USER_QUERY_OPTIONS,
	}),
	detail: (userId?: string) => ({
		queryKey: userKeys.detail(userId ?? ""),
		queryFn: () => userApi.getUserById(userId as string),
		enabled: Boolean(userId),
		...DETAIL_QUERY_CACHE_OPTIONS,
	}),
};
