// modules/audit/dealerAudit/hooks/useDealerAudits.ts
//
// Read-side queries (server state only). Keys come from dealerAuditKeys.

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { DEALER_AUDIT_RULES } from "../dealer-audit.config";
import { dealerAuditApi } from "../dealer-audit.api";
import { dealerAuditKeys } from "../dealer-audit.queries";
import { normalizeAuditListParams } from "../dealer-audit.mappers";
import type { DealerAuditListParams } from "../dealer-audit.types";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";

const MASTER_STALE_MS = DEALER_AUDIT_RULES.list.masterDataStaleTimeMs;

/** Server-side paginated / filtered / sorted audit list. */
export function useDealerAuditList(params: Partial<DealerAuditListParams>) {
	const normalized = normalizeAuditListParams(params);

	const query = useQuery({
		queryKey: dealerAuditKeys.list(normalized),
		queryFn: ({ signal }) => dealerAuditApi.getAudits(normalized, signal),
		placeholderData: keepPreviousData,
		staleTime: 30_000,
	});

	return {
		items: query.data?.items ?? [],
		totalItems: query.data?.totalItems ?? 0,
		totalPages: query.data?.totalPages ?? 0,
		isLoading: query.isLoading,
		isFetching: query.isFetching,
		isError: query.isError,
		errorMessage: query.isError
			? getAuditActionErrorMessage(query.error, "audit list")
			: null,
		refetch: query.refetch,
	};
}

export function useDealerAudit(auditId: string | undefined) {
	return useQuery({
		queryKey: dealerAuditKeys.detail(auditId ?? ""),
		queryFn: ({ signal }) => dealerAuditApi.getAudit(auditId ?? "", signal),
		enabled: Boolean(auditId),
		staleTime: 30_000,
	});
}

export function useDealerAuditChecklist(auditId: string | undefined) {
	return useQuery({
		queryKey: dealerAuditKeys.checklist(auditId ?? ""),
		queryFn: ({ signal }) =>
			dealerAuditApi.getChecklist(auditId ?? "", signal),
		enabled: Boolean(auditId),
		// Item saves patch this cache directly, so a short staleTime would
		// only cause redundant refetches while someone is working.
		staleTime: 60_000,
	});
}

/** Pass enabled=false for roles that must not see the workflow trail. */
export function useDealerAuditHistory(
	auditId: string | undefined,
	enabled: boolean,
) {
	return useQuery({
		queryKey: dealerAuditKeys.history(auditId ?? ""),
		queryFn: ({ signal }) =>
			dealerAuditApi.getAuditHistory(auditId ?? "", signal),
		enabled: Boolean(auditId) && enabled,
		staleTime: 30_000,
	});
}

export function useDealerAuditReport(
	auditId: string | undefined,
	enabled: boolean,
) {
	return useQuery({
		queryKey: dealerAuditKeys.report(auditId ?? ""),
		queryFn: ({ signal }) =>
			dealerAuditApi.getAuditReport(auditId ?? "", signal),
		enabled: Boolean(auditId) && enabled,
		staleTime: 60_000,
	});
}

export function useDealerOptions(enabled = true) {
	return useQuery({
		queryKey: dealerAuditKeys.dealerOptions(),
		queryFn: ({ signal }) => dealerAuditApi.getDealerOptions(signal),
		enabled,
		staleTime: MASTER_STALE_MS,
	});
}

export function useReviewerOptions(enabled = true) {
	return useQuery({
		queryKey: dealerAuditKeys.reviewerOptions(),
		queryFn: ({ signal }) => dealerAuditApi.getReviewerOptions(signal),
		enabled,
		staleTime: MASTER_STALE_MS,
	});
}
