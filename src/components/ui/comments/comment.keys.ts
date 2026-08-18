export const commentKeys = {
	all: ["comments"] as const,
	activity: (subjectType?: string | null, subjectId?: string | null) =>
		[...commentKeys.all, "activity", subjectType ?? "", subjectId ?? ""] as const,
};
