import {
	useMutation,
	useQuery,
	useQueryClient,
	type QueryClient,
} from "@tanstack/react-query";

import { auditApi, auditKeys } from "../../../../components/ui/audit";
import { commentApi, commentKeys } from "../../../../components/ui/comments";
import { workflowApi } from "../../../../common/workflow.api";
import { eventOutcomeApi } from "../api/event.outcome.api";
import { eventReportApi } from "../api/eventReport.api";
import { filesApi } from "../api/file.module.api";
import type {
	EventDeviationPayload,
	EventOutcomePayload,
} from "../types/event.outcome.types";
import { epcKeys } from "./epc.keys";
import { createPdfApi } from "../../../../common/common.api";

const EVENT_PROPOSAL_SUBJECT_TYPE = "EVENT_PROPOSAL";
const activityPlannerPdfApi =
	createPdfApi<typeof EVENT_PROPOSAL_SUBJECT_TYPE>();

const stableQueryOptions = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

export const useActivityCommentsQuery = (
	epcId?: string | null,
	enabled = true,
) =>
	useQuery({
		queryKey: commentKeys.list(EVENT_PROPOSAL_SUBJECT_TYPE, epcId),
		queryFn: () =>
			commentApi.getComments({
				subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
				subjectId: epcId!,
			}),
		enabled: Boolean(epcId) && enabled,
		...stableQueryOptions,
	});

export const useActivityAuditLogQuery = (
	epcId?: string | null,
	enabled = true,
) =>
	useQuery({
		queryKey: auditKeys.log(EVENT_PROPOSAL_SUBJECT_TYPE, epcId),
		queryFn: () =>
			auditApi.getAuditLog({
				subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
				subjectId: epcId!,
			}),
		enabled: Boolean(epcId) && enabled,
		...stableQueryOptions,
	});

export const useEventOutcomeMutation = () =>
	useMutation({
		mutationFn: ({
			epcId,
			payload,
		}: {
			epcId: string;
			payload: EventOutcomePayload;
		}) => eventOutcomeApi.eventOutcome(epcId, payload),
	});

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
		retry: false,
		...stableQueryOptions,
	});
}

const invalidateActivityData = async (
	queryClient: QueryClient,
	epcId: string,
) => {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: epcKeys.detail(epcId) }),
		queryClient.invalidateQueries({ queryKey: eventReportKeys.detail(epcId) }),
		queryClient.invalidateQueries({
			queryKey: commentKeys.list(EVENT_PROPOSAL_SUBJECT_TYPE, epcId),
		}),
		queryClient.invalidateQueries({
			queryKey: auditKeys.log(EVENT_PROPOSAL_SUBJECT_TYPE, epcId),
		}),
	]);
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
		onSuccess: (_, variables) =>
			invalidateActivityData(queryClient, variables.epcId),
	});
}

export function useValidateEventReportMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ reportId }: { reportId: string; epcId: string }) =>
			eventReportApi.validateReport(reportId),
		onSuccess: (_, variables) =>
			invalidateActivityData(queryClient, variables.epcId),
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
		onSuccess: (_, variables) =>
			invalidateActivityData(queryClient, variables.epcId),
	});
}

export function useActivityPlannerPdfUrlMutation() {
	return useMutation({
		mutationFn: ({ epcId }: { epcId: string }) =>
			activityPlannerPdfApi.getPdfUrl(EVENT_PROPOSAL_SUBJECT_TYPE, epcId),
	});
}

export const useExportActivityPlannerMutation = () =>
	useMutation({
		mutationFn: () =>
			filesApi.enqueueExport({
				format: "xlsx",
				filters: {},
			}),
	});
