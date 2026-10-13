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
import { commentApi } from "../../../../components/ui/comments";
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
import { commentKeys } from "../../../../components/ui/comments/comment.api";

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

/**
 * Single subject type for everything attached to an EPC: comments, audit log
 * and PDF. Use this constant in components too (CommentsSection,
 * AuditLogSection) so query keys and invalidation always line up.
 */
export const EVENT_PROPOSAL_SUBJECT_TYPE = "EVENT_PROPOSAL";

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

/**
 * Refreshes everything shown on the activity detail page for one EPC:
 * detail, report, comments and audit log. Comment/audit keys are prefixes,
 * so the sections' own `[...key, refreshKey]` queries refetch too.
 *
 * Pass `includeLists` when the change affects the listing (status, title…).
 */
const invalidateActivityData = async (
	queryClient: QueryClient,
	epcId: string,
	{ includeLists = false }: { includeLists?: boolean } = {},
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
		includeLists
			? queryClient.invalidateQueries({ queryKey: epcKeys.lists() })
			: undefined,
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
		// Returned so mutateAsync resolves only after fresh data is in.
		onSuccess: (_, { epcId }) =>
			invalidateActivityData(queryClient, epcId, { includeLists: true }),
	});
}

export const useCloseEPC = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ epcId }: { epcId: string }) =>
			eventOutcomeApi.closeEpc(epcId),
		onSuccess: (_, { epcId }) =>
			invalidateActivityData(queryClient, epcId, { includeLists: true }),
	});
};

/* -------------------------------------------------------------------------- */
/*                     Event outcome / deviation / workflow                   */
/* -------------------------------------------------------------------------- */

export const useEventOutcomeMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			epcId,
			payload,
		}: {
			epcId: string;
			payload: EventOutcomePayload;
		}) => eventOutcomeApi.eventOutcome(epcId, payload),
		onSuccess: (_, { epcId }) =>
			invalidateActivityData(queryClient, epcId, { includeLists: true }),
	});
};

export function useEventDeviationMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			epcId,
			payload,
		}: {
			epcId: string;
			payload: EventDeviationPayload;
		}) => workflowApi.deviationStage(epcId, payload),
		onSuccess: (_, { epcId }) => invalidateActivityData(queryClient, epcId),
	});
}

export const usePreviewWorkflowMutation = () =>
	useMutation({
		mutationFn: workflowApi.previewWorkflow,
	});

export const useSubmitDeviatedUpdatedFormMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: {
			workflowId: string;
			eventProposalId?: string;
			workspaceId?: string;
			appId?: string;
			newBudget?: string | number;
		}) => workflowApi.submitDeviationUpdatedForm(payload),
		onSuccess: (_, { eventProposalId }) =>
			eventProposalId
				? invalidateActivityData(queryClient, eventProposalId, {
						includeLists: true,
					})
				: undefined,
	});
};

/**
 * Accepts the old `workflowId` string or `{ workflowId, epcId }`.
 * Passing `epcId` lets the page refresh comments + audit after resubmission.
 */
type SubmitClarifiedVariables =
	| string
	| { workflowId: string; epcId?: string | null };

export const useSubmitClarifiedUpdatedFormMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: SubmitClarifiedVariables) =>
			workflowApi.submitClarifiedUpdatedForm(
				typeof variables === "string" ? variables : variables.workflowId,
			),
		onSuccess: (_, variables) => {
			const epcId = typeof variables === "string" ? null : variables.epcId;
			return epcId
				? invalidateActivityData(queryClient, epcId, { includeLists: true })
				: undefined;
		},
	});
};

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
		onSuccess: (_, { epcId }) => invalidateActivityData(queryClient, epcId),
	});
}

export function useValidateEventReportMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ reportId }: { reportId: string; epcId: string }) =>
			eventReportApi.validateReport(reportId),
		onSuccess: (_, { epcId }) => invalidateActivityData(queryClient, epcId),
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
		onSuccess: (_, { epcId }) => invalidateActivityData(queryClient, epcId),
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
