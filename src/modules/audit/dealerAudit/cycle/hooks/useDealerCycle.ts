// modules/audit/dealerAudit/cycle/hooks/useDealerCycle.ts
//
// Queries + mutations for the cycle screens. Server state only. Errors are
// not toasted here: dialogs / pages render `mutation.error` inline so the
// user keeps what they typed and can retry.

import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { useToast } from "../../../../../context/Auth/AuthContext";
import { dealerAuditKeys } from "../../dealer-audit.queries";
import type {
	DealerAuditDealerOption,
	DealerAuditPeriod,
} from "../../dealer-audit.types";
import { useReviewerOptions } from "../../hooks/useDealerAudits";
import { dealerCycleApi } from "../dealer-cycle.api";
import {
	dealerCycleContent as content,
	formatCycleMessage as format,
} from "../dealer-cycle.content";
import { dealerCycleKeys } from "../dealer-cycle.queries";
import type {
	AuditTrackerSummaryParams,
	CreateAuditCycleFormValues,
	DealerEligibility,
	ResendReportVariables,
	SendReminderVariables,
} from "../dealer-cycle.types";

// ── Reads ─────────────────────────────────────────────────────────────

export function useTrackerSummary(params: Partial<AuditTrackerSummaryParams>) {
	return useQuery({
		queryKey: dealerCycleKeys.summary(params),
		queryFn: ({ signal }) => dealerCycleApi.getTrackerSummary(params, signal),
		placeholderData: keepPreviousData,
		staleTime: 30_000,
	});
}

export function useReviewQueueCounts(enabled = true) {
	return useQuery({
		queryKey: dealerCycleKeys.queueCounts(),
		queryFn: ({ signal }) => dealerCycleApi.getQueueCounts(signal),
		enabled,
		staleTime: 30_000,
	});
}

const periodKey = (period: DealerAuditPeriod): string =>
	`${period.type}:${period.year}:${period.quarter ?? "-"}`;

// Module-level so "no data yet" keeps one identity between renders.
const NO_DEALERS: DealerAuditDealerOption[] = [];
const NO_ELIGIBILITY: DealerEligibility[] = [];

/**
 * Every active dealer business partner for the dealer step, plus whether each
 * can be audited for this period (computed from existing audits).
 */
export function useDealerCandidates(input: {
	enabled: boolean;
	templateId: string;
	period: DealerAuditPeriod;
}) {
	const { enabled, templateId, period } = input;

	const query = useQuery({
		queryKey: dealerCycleKeys.eligibility(templateId, periodKey(period)),
		queryFn: ({ signal }) =>
			dealerCycleApi.getDealerCandidates(
				{
					periodType: period.type,
					year: period.year,
					quarter: period.quarter,
				},
				signal,
			),
		// The dealer list no longer depends on the template, so only the step gates it.
		enabled,
		staleTime: 30_000,
	});

	return {
		dealers: query.data?.dealers ?? NO_DEALERS,
		eligibility: query.data?.eligibility ?? NO_ELIGIBILITY,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
	};
}

/**
 * Reviewers for the assignment step. Each option already carries the zones it
 * covers and its open-audit count, so no second request is needed.
 */
export function useReviewerWorkload(enabled: boolean) {
	const reviewers = useReviewerOptions(enabled);

	return {
		reviewers: reviewers.data ?? [],
		isLoading: reviewers.isLoading,
		isError: reviewers.isError,
		refetch: reviewers.refetch,
	};
}

// ── Writes ────────────────────────────────────────────────────────────

export function useLaunchAuditCycle() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	return useMutation({
		mutationFn: (values: CreateAuditCycleFormValues) =>
			dealerCycleApi.launchCycle(values),
		onSuccess: (result) => {
			// Lists, KPIs and queue counts all change; nothing outside audits does.
			void queryClient.invalidateQueries({
				queryKey: dealerAuditKeys.audits(),
			});
			void queryClient.invalidateQueries({ queryKey: dealerCycleKeys.all });
			void queryClient.invalidateQueries({
				queryKey: dealerAuditKeys.reviewerOptions(),
			});
			showToast({
				type: "success",
				title: content.wizard.title,
				description: format(content.wizard.success, {
					count: result.createdCount,
				}),
			});
		},
	});
}

export function useSendReminders() {
	const { showToast } = useToast();

	return useMutation({
		mutationFn: (variables: SendReminderVariables) =>
			dealerCycleApi.sendReminders(variables),
		onSuccess: (result) => {
			showToast({
				type: "success",
				title: content.tracker.actions.remind,
				description: format(content.tracker.reminderSent, {
					count: result.sentCount,
				}),
			});
		},
	});
}

export function useResendReport() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	return useMutation({
		mutationFn: (variables: ResendReportVariables) =>
			dealerCycleApi.resendReport(variables),
		onSuccess: (result, variables) => {
			void queryClient.invalidateQueries({
				queryKey: dealerAuditKeys.history(variables.auditId),
			});
			showToast({
				type: "success",
				title: content.reports.resend,
				description: format(content.reports.resendSuccess, {
					count: result.recipientCount,
				}),
			});
		},
	});
}
