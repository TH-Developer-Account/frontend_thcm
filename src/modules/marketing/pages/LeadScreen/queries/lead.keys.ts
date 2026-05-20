export const leadKeys = {
	all: ["leads"] as const,
	lists: () => [...leadKeys.all, "list"] as const,
	list: (params?: Record<string, unknown>) => [...leadKeys.lists(), params ?? {}] as const,
	byEpc: (epcId?: string | null) => [...leadKeys.all, "epc", epcId ?? ""] as const,
};
