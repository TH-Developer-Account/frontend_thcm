import type { WorkflowUser } from "../types/shared.types";

const cleanText = (value: unknown): string =>
	typeof value === "string" ? value.trim() : "";

export const getFullName = (
	user?: WorkflowUser | null,
	fallback = "Unnamed user",
): string => {
	if (!user) return fallback;

	const explicitName = cleanText(user.name);

	if (explicitName) {
		return explicitName;
	}

	const fullName = [cleanText(user.firstName), cleanText(user.lastName)]
		.filter(Boolean)
		.join(" ");

	if (fullName) {
		return fullName;
	}

	return cleanText(user.email) || fallback;
};
