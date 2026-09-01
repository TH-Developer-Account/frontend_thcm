export const commentKeys = {
	all: ["comments"] as const,
	list: (subjectType?: string | null, subjectId?: string | null) =>
		[...commentKeys.all, "list", subjectType ?? "", subjectId ?? ""] as const,
};
