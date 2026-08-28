import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { commentApi, commentKeys } from "../../../../components/ui/comments";
import { auditApi, auditKeys } from "../../../../components/ui/audit";
import { eventOutcomeApi } from "../api/event.outcome.api";
import { eventReportApi } from "../api/eventReport.api";
import { epcKeys } from "./epc.keys";
import type {
	EventDeviationPayload,
	EventOutcomePayload,
} from "../types/event.outcome.types";
import { workflowApi } from "../../../../api/workflow.api";

const EVENT_PROPOSAL_SUBJECT_TYPE = "EVENT_PROPOSAL";

export const useActivityCommentsQuery = (
	epcId?: string | null,
	enabled = true,
) => {
	return useQuery({
		queryKey: commentKeys.list(EVENT_PROPOSAL_SUBJECT_TYPE, epcId),
		queryFn: () =>
			commentApi.getComments({
				subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
				subjectId: epcId!,
			}),
		enabled: Boolean(epcId) && enabled,
		staleTime: 15 * 1000,
	});
};

export const useActivityAuditLogQuery = (
	epcId?: string | null,
	enabled = true,
) => {
	return useQuery({
		queryKey: auditKeys.log(EVENT_PROPOSAL_SUBJECT_TYPE, epcId),
		queryFn: () =>
			auditApi.getAuditLog({
				subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
				subjectId: epcId!,
			}),
		enabled: Boolean(epcId) && enabled,
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
			payload: EventOutcomePayload;
		}) => eventOutcomeApi.eventOutcome(epcId, payload),
	});
};

export function useEventDeviationMutation() {
	return useMutation({
		mutationFn: ({
			epcId,
			payload,
		}: {
			epcId: string;
			payload: EventDeviationPayload;
		}) => workflowApi.deviationStage(epcId, payload),
	});
}

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

const invalidateActivityFeeds = (
	queryClient: ReturnType<typeof useQueryClient>,
	epcId: string,
) => {
	queryClient.invalidateQueries({
		queryKey: commentKeys.list(EVENT_PROPOSAL_SUBJECT_TYPE, epcId),
	});

	queryClient.invalidateQueries({
		queryKey: auditKeys.log(EVENT_PROPOSAL_SUBJECT_TYPE, epcId),
	});
};

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

			invalidateActivityFeeds(queryClient, variables.epcId);
		},
	});
}

export function useValidateEventReportMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ reportId }: { reportId: string; epcId: string }) =>
			eventReportApi.validateReport(reportId),

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});

			queryClient.invalidateQueries({
				queryKey: eventReportKeys.detail(variables.epcId),
			});

			invalidateActivityFeeds(queryClient, variables.epcId);
		},
	});
}

export function useClarifyEventReportMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			reportId,
			reason,
		}: {
			reportId: string;
			epcId: string;
			reason: string;
		}) => eventReportApi.clarifyReport(reportId, reason),

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});

			queryClient.invalidateQueries({
				queryKey: eventReportKeys.detail(variables.epcId),
			});

			invalidateActivityFeeds(queryClient, variables.epcId);
		},
	});
}
