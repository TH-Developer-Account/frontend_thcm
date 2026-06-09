export type EventOutcomeMode = "OUTCOME" | "DEVIATION";

export function getEventOutcomeMode(
	eventStatus?: string | null,
): EventOutcomeMode | null {
	if (eventStatus === "APPROVED") return "OUTCOME";

	if (eventStatus === "RECOMMENDED" || eventStatus === "VALIDATED") {
		return "DEVIATION";
	}

	return null;
}
