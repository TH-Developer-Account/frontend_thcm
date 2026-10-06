// queries/epc.queries.ts
// EPC (Event Proposal) — keys, queries & mutations, incl. event outcome,
// deviation, event report, comments/audit, PDF/export and files module.
import {
	useMutation,
	useQuery,
	useQueryClient,
	type QueryClient,
} from "@tanstack/react-query";

import { auditApi, auditKeys } from "../../../../components/ui/audit";
import { commentApi, commentKeys } from "../../../../components/ui/comments";
import { createPdfApi } from "../../../../common/common.api";
import { workflowApi } from "../../../workflows";
import {
	epcApi,
	eventOutcomeApi,
	eventReportApi,
	filesApi,
} from "../api/epc.api";
import type {
	EpcCreatePayload,
	EpcListParams,
	EpcUpdatePayload,
	EventDeviationPayload,
	EventOutcomePayload,
} from "../types/epc.types";

/* -------------------------------------------------------------------------- */
/*                                    Keys                                    */
/* -------------------------------------------------------------------------- */

export const epcKeys = {
	all: ["epc"] as const,
	lists: () => [...epcKeys.all, "list"] as const,
	list: (params: EpcListParams) => [...epcKeys.lists(), params] as const,
	details: () => [...epcKeys.all, "detail"] as const,
	detail: (epcId?: string | null) => [...epcKeys.details(), epcId] as const,
};

export const eventReportKeys = {
	detail: (epcId?: string | null) => ["event-report", epcId] as const,
};

export const fileModuleKeys = {
	all: ["files"] as const,
	lists: () => [...fileModuleKeys.all, "list"] as const,
	list: (params?: Record<string, unknown>) =>
		[...fileModuleKeys.lists(), params ?? {}] as const,
};

/* -------------------------------------------------------------------------- */
/*                                   Shared                                   */
/* -------------------------------------------------------------------------- */

const EVENT_PROPOSAL_SUBJECT_TYPE = "EVENT_PROPOSAL";
const activityPlannerPdfApi =
	createPdfApi<typeof EVENT_PROPOSAL_SUBJECT_TYPE>();

const FILES_STALE_TIME = 60 * 1000;

const stableQueryOptions = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

type UpdateEpcVariables = {
	epcId: string;
	payload: EpcUpdatePayload;
};

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

/* -------------------------------------------------------------------------- */
/*                                   Queries                                  */
/* -------------------------------------------------------------------------- */

export const useEpcListQuery = (params: EpcListParams) =>
	useQuery({
		queryKey: epcKeys.list(params),
		queryFn: () => epcApi.getList(params),
	});

export function useEpcDetailQuery(epcId?: string) {
	return useQuery({
		queryKey: epcKeys.detail(epcId),
		queryFn: () => epcApi.getById(epcId!),
		enabled: Boolean(epcId),
		staleTime: 60_000,
	});
}

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

export function useEventReportQuery(epcId?: string | null, enabled = true) {
	return useQuery({
		queryKey: eventReportKeys.detail(epcId),
		queryFn: () => eventReportApi.getByEpcId(epcId!),
		enabled: Boolean(epcId) && enabled,
		retry: false,
		...stableQueryOptions,
	});
}

export const useFileModuleQuery = () =>
	useQuery({
		queryKey: fileModuleKeys.list(),
		queryFn: filesApi.getAll,
		staleTime: FILES_STALE_TIME,
		refetchOnWindowFocus: false,
	});

/* -------------------------------------------------------------------------- */
/*                               EPC mutations                                */
/* -------------------------------------------------------------------------- */

export const useCreateEpcMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: EpcCreatePayload) => epcApi.create(payload),
		onSuccess: async (createdEpc) => {
			await queryClient.invalidateQueries({ queryKey: epcKeys.lists() });

			const createdEpcId =
				createdEpc?.id ?? createdEpc?.eventProposal?.id ?? createdEpc?.epc?.id;

			if (createdEpcId) {
				queryClient.setQueryData(epcKeys.detail(createdEpcId), createdEpc);
			}
		},
	});
};

export function useUpdateEpcMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ epcId, payload }: UpdateEpcVariables) =>
			epcApi.update(epcId, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});
			queryClient.invalidateQueries({ queryKey: epcKeys.lists() });
		},
	});
}

export const useCloseEPC = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ epcId }: { epcId: string }) =>
			eventOutcomeApi.closeEpc(epcId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});
		},
	});
};

/* -------------------------------------------------------------------------- */
/*                     Event outcome / deviation / workflow                   */
/* -------------------------------------------------------------------------- */

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

export const usePreviewWorkflowMutation = () =>
	useMutation({
		mutationFn: workflowApi.previewWorkflow,
	});

export const useSubmitDeviatedUpdatedFormMutation = () =>
	useMutation({
		mutationFn: (payload: {
			workflowId: string;
			eventProposalId?: string;
			workspaceId?: string;
			appId?: string;
			newBudget?: string | number;
		}) => workflowApi.submitDeviationUpdatedForm(payload),
	});

export const useSubmitClarifiedUpdatedFormMutation = () =>
	useMutation({
		mutationFn: (workflowId: string) =>
			workflowApi.submitClarifiedUpdatedForm(workflowId),
	});

/* -------------------------------------------------------------------------- */
/*                               Event report                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                               PDF / Export                                 */
/* -------------------------------------------------------------------------- */

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
