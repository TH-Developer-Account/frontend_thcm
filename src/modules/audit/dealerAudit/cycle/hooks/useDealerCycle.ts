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
import { useMemo } from "react";

import { useToast } from "../../../../../context/Auth/AuthContext";
import { dealerAuditKeys } from "../../dealer-audit.queries";
import type {
	DealerAuditDealerOption,
	DealerAuditPeriod,
} from "../../dealer-audit.types";
import type { DealerFacilityType } from "../../templates/dealer-template.types";
import { dealerCycleApi } from "../dealer-cycle.api";
import {
	dealerCycleContent as content,
	formatCycleMessage as format,
} from "../dealer-cycle.content";
import { computeDealerEligibility, computeReviewerWorkload } from "../dealer-cycle.logic";
import { dealerCycleKeys } from "../dealer-cycle.queries";
import type {
	AuditTrackerSummaryParams,
	CreateAuditCycleFormValues,
	DealerEligibility,
	ResendReportVariables,
	ReviewerWorkload,
	SendReminderVariables,
} from "../dealer-cycle.types";
import { useReviewerOptions } from "../../hooks/useDealerAudits";

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

/**
 * Who can be added to a cycle for this period + checklist. Derived from the
 * audits that already exist for the period (see computeDealerEligibility).
 */
export function useDealerEligibility(input: {
	enabled: boolean;
	templateId: string;
	period: DealerAuditPeriod;
	templateFacilityType: DealerFacilityType | null;
	dealers: readonly DealerAuditDealerOption[];
}) {
	const { enabled, templateId, period, templateFacilityType, dealers } = input;

	const audits = useQuery({
		queryKey: dealerCycleKeys.eligibility(templateId, periodKey(period)),
		queryFn: () =>
			dealerCycleApi.getAllAudits({
				periodType: period.type,
				year: period.year,
				quarter: period.quarter,
			}),
		enabled: enabled && templateId !== "",
		staleTime: 30_000,
	});

	const eligibility = useMemo<DealerEligibility[]>(
		() =>
			computeDealerEligibility({
				dealers,
				existingAudits: audits.data ?? [],
				period,
				templateFacilityType,
			}),
		[dealers, audits.data, period, templateFacilityType],
	);

	return {
		eligibility,
		isLoading: audits.isLoading,
		isError: audits.isError,
		refetch: audits.refetch,
	};
}

/** Open-audit count per reviewer, for the assignment step. */
export function useReviewerWorkload(enabled: boolean) {
	const reviewers = useReviewerOptions(enabled);

	const audits = useQuery({
		queryKey: dealerCycleKeys.workload(),
		queryFn: () => dealerCycleApi.getAllAudits({}),
		enabled,
		staleTime: 60_000,
	});

	const workload = useMemo<ReviewerWorkload[]>(
		() => computeReviewerWorkload(reviewers.data ?? [], audits.data ?? []),
		[reviewers.data, audits.data],
	);

	return {
		reviewers: reviewers.data ?? [],
		workload,
		isLoading: reviewers.isLoading || audits.isLoading,
		isError: reviewers.isError || audits.isError,
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
			void queryClient.invalidateQueries({ queryKey: dealerAuditKeys.audits() });
			void queryClient.invalidateQueries({ queryKey: dealerCycleKeys.all });
			showToast({
				type: "success",
				title: content.wizard.title,
				description: format(content.wizard.success, { count: result.createdCount }),
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
				description: format(content.tracker.reminderSent, { count: result.sentCount }),
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
