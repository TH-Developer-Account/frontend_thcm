import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventOutcomeApi } from "../api/event.outcome.api";
import { eventReportApi } from "../api/eventReport.api";
import { workflowApi } from "../api/workflow.api";
import { epcKeys } from "./epc.keys";

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
		}) => eventOutcomeApi.eventOutcome(epcId, payload),
	});
};
export const useEventDeviationMutation = () => {
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
		}) => eventOutcomeApi.deviation(epcId, payload),
	});
};

export const eventReportKeys = {
	detail: (epcId?: string | null) => ["event-report", epcId] as const,
};

export function useEventReportQuery(epcId?: string | null, enabled = true) {
	return useQuery({
		queryKey: eventReportKeys.detail(epcId),
		queryFn: () => eventReportApi.getByEpcId(epcId!),
		enabled: Boolean(epcId) && enabled,
		staleTime: 30 * 1000,
		retry: false,
	});
}

export function useSubmitEventReportMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			epcId,
			payload,
			isEditMode,
		}: {
			epcId: string;
			payload: FormData;
			isEditMode: boolean;
		}) =>
			isEditMode
				? eventReportApi.resubmit(epcId, payload)
				: eventReportApi.submit(epcId, payload),

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});

			queryClient.invalidateQueries({
				queryKey: eventReportKeys.detail(variables.epcId),
			});
		},
	});
}

export function useValidateEventReportMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ reportId }: { reportId: string }) =>
			eventReportApi.approve(reportId),

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.reportId),
			});

			queryClient.invalidateQueries({
				queryKey: eventReportKeys.detail(variables.reportId),
			});
		},
	});
}
