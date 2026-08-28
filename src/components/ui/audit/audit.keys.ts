export const auditKeys = {
	all: ["audit"] as const,
	log: (subjectType?: string | null, subjectId?: string | null) =>
		[...auditKeys.all, "log", subjectType ?? "", subjectId ?? ""] as const,
};
