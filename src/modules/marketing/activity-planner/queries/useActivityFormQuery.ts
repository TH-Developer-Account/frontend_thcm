import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { EventOutcomeApi } from "../api/event.outcome.api";
import { workflowApi } from "../api/workflow.api";

export const activityCommentKeys = {
	all: ["activity-comments"] as const,
	byEpcId: (epcId?: string | null) =>
		[...activityCommentKeys.all, epcId ?? ""] as const,
};

export const useActivityCommentsQuery = (epcId?: string | null) => {
	return useQuery({
		queryKey: activityCommentKeys.byEpcId(epcId),
		queryFn: () => workflowApi.getComments(epcId!),
		enabled: Boolean(epcId),
		staleTime: 15 * 1000,
	});
};

export const useEventOutcomeMutation = () => {
	return useMutation({
		mutationFn: ({
			epcId,
			payload,
		}: {
			epcId: string;
			payload: {
				status: string;
				reason: string;
			};
		}) => EventOutcomeApi.eventOutcome(epcId, payload),
	});
};
export const useEventReportQuery = (epcId?: string | null) => {
	return useQuery({
		queryKey: ["event-report", epcId],
		queryFn: () => EventOutcomeApi.getEventReport(epcId!),
		enabled: Boolean(epcId),
		staleTime: 15 * 1000,
	});
};

export const useSubmitValidationActionMutation = () => {
	return useMutation({
		mutationFn: ({
			epcId,
			payload,
		}: {
			epcId: string;
			payload: {
				action: string;
				reason: string;
			};
		}) => EventOutcomeApi.submitValidationAction(epcId, payload),
	});
};
