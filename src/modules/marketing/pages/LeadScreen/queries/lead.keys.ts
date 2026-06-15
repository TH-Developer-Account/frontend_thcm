export const leadKeys = {
	all: ["leads"] as const,
	lists: () => [...leadKeys.all, "list"] as const,
	list: () => [...leadKeys.lists(), "all"] as const,
};
