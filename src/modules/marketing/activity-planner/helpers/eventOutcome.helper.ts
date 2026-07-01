export type EventOutcomeMode = "OUTCOME" | "DEVIATION_IN_PROGRESS";

export function getEventOutcomeMode(
	eventStatus?: string | null,
): EventOutcomeMode | null {
	if (eventStatus === "APPROVED") return "OUTCOME";

	if (eventStatus === "RECOMMENDED" || eventStatus === "VALIDATED") {
		return "DEVIATION_IN_PROGRESS";
	}

	return null;
}
