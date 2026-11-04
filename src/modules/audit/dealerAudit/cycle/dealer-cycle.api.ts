// modules/audit/dealerAudit/cycle/dealer-cycle.api.ts
//
// HTTP operations for the cycle screens. Same rules as dealer-audit.api.ts:
// typed in / typed (domain) out, no toasts, no cache work, every call logged
// to the console in dev, real call kept as a "LIVE:" comment.
//
// GO LIVE (per function): uncomment the ServerAxios import, delete the
// "TEMP MOCK" line, uncomment "LIVE", then set API_SOURCE to "LIVE".

// import { ServerAxios } from "../../../../services/ServerAxios";
import { logAuditApi } from "../../shared/audit-api-log";
import type { AuditApiLogEntry, AuditApiLogSource } from "../../shared/audit-api-log";
import { dealerAuditApi } from "../dealer-audit.api";
import type {
	DealerAuditListItem,
	DealerAuditListParams,
	PaginatedResult,
} from "../dealer-audit.types";
import {
	mapFormToCreateCyclePayload,
	mapLaunchResponse,
	mapQueueCountsResponse,
	mapReminderResponse,
	mapResendResponse,
	mapReminderToPayload,
	mapResendToPayload,
	mapTrackerSummaryResponse,
	normalizeSummaryParams,
	toSummaryQuery,
} from "./dealer-cycle.mappers";
import { mockDealerCycleBackend } from "./dealer-cycle.mock";
import type {
	AuditCycleLaunchResult,
	AuditTrackerSummary,
	AuditTrackerSummaryParams,
	CreateAuditCycleFormValues,
	ResendReportResult,
	ResendReportVariables,
	ReviewQueueCounts,
	SendReminderResult,
	SendReminderVariables,
} from "./dealer-cycle.types";

/** Flip to "LIVE" once the functions below call ServerAxios. */
const API_SOURCE: AuditApiLogSource = "MOCK";

const BASE = "/dealer-audit";
const enc = encodeURIComponent;

export const cyclePaths = {
	launch: `${BASE}/cycles`,
	summary: `${BASE}/tracker/summary`,
	queueCounts: `${BASE}/review-queue/counts`,
	remind: `${BASE}/audits/remind`,
	resendReport: (auditId: string) => `${BASE}/audits/${enc(auditId)}/report/resend`,
	reports: `${BASE}/reports`,
} as const;

type LogMeta = Omit<AuditApiLogEntry, "source" | "response" | "error">;

async function tracked<T>(meta: LogMeta, call: () => Promise<T>): Promise<T> {
	try {
		const response = await call();
		logAuditApi({ ...meta, source: API_SOURCE, response });
		return response;
	} catch (error) {
		logAuditApi({ ...meta, source: API_SOURCE, error });
		throw error;
	}
}

// ── Reads ─────────────────────────────────────────────────────────────

const ALL_PAGE_SIZE = 100;
const ALL_MAX_PAGES = 50; // safety stop: 5,000 audits

/**
 * Walks every page of the audit list endpoint (the list is paged). Used for
 * period-wide checks (eligibility, workload). Live-compatible as-is: it only
 * calls the list endpoint. Swap for a dedicated endpoint if volumes grow.
 */
async function getAllAudits(
	filters: Partial<DealerAuditListParams> = {},
): Promise<DealerAuditListItem[]> {
	const all: DealerAuditListItem[] = [];
	for (let page = 1; page <= ALL_MAX_PAGES; page += 1) {
		const result = await dealerAuditApi.getAudits({
			...filters,
			page,
			pageSize: ALL_PAGE_SIZE,
		});
		all.push(...result.items);
		if (page >= result.totalPages) break;
	}
	return all;
}

async function getTrackerSummary(
	rawParams: Partial<AuditTrackerSummaryParams>,
	signal?: AbortSignal,
): Promise<AuditTrackerSummary> {
	const params = normalizeSummaryParams(rawParams);
	const query = toSummaryQuery(params);
	const body = await tracked(
		{ operation: "getTrackerSummary", method: "GET", url: cyclePaths.summary, params: query },
		() => mockDealerCycleBackend.getSummary(params, getAllAudits), // TEMP MOCK
		// LIVE:
		// ServerAxios.get<ApiEnvelope<AuditTrackerSummaryResponse>>(
		// 	cyclePaths.summary, { params: query, signal },
		// ).then((r) => r.data),
	);
	void signal;
	return mapTrackerSummaryResponse(body.data);
}

async function getQueueCounts(signal?: AbortSignal): Promise<ReviewQueueCounts> {
	const body = await tracked(
		{ operation: "getQueueCounts", method: "GET", url: cyclePaths.queueCounts },
		() => mockDealerCycleBackend.getQueueCounts(getAllAudits), // TEMP MOCK
		// LIVE:
		// ServerAxios.get<ApiEnvelope<ReviewQueueCountsResponse>>(
		// 	cyclePaths.queueCounts, { signal },
		// ).then((r) => r.data),
	);
	void signal;
	return mapQueueCountsResponse(body.data);
}

/**
 * Reviewer / approver / reports lists reuse the audit list endpoint with a
 * status filter, so there is no extra backend work for them.
 */
function getAuditsByStatus(
	params: Partial<DealerAuditListParams>,
	signal?: AbortSignal,
): Promise<PaginatedResult<DealerAuditListItem>> {
	void signal;
	return dealerAuditApi.getAudits(params);
}

// ── Writes ────────────────────────────────────────────────────────────

async function launchCycle(
	values: CreateAuditCycleFormValues,
): Promise<AuditCycleLaunchResult> {
	const payload = mapFormToCreateCyclePayload(values);
	const body = await tracked(
		{ operation: "launchCycle", method: "POST", url: cyclePaths.launch, payload },
		() => mockDealerCycleBackend.launchCycle(payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<AuditCycleLaunchResponse>>(cyclePaths.launch, payload)
		// 	.then((r) => r.data),
	);
	return mapLaunchResponse(body.data);
}

async function sendReminders(variables: SendReminderVariables): Promise<SendReminderResult> {
	const payload = mapReminderToPayload(variables);
	const body = await tracked(
		{ operation: "sendReminders", method: "POST", url: cyclePaths.remind, payload },
		() => mockDealerCycleBackend.sendReminders(payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<SendReminderResponse>>(cyclePaths.remind, payload)
		// 	.then((r) => r.data),
	);
	return mapReminderResponse(body.data);
}

async function resendReport(variables: ResendReportVariables): Promise<ResendReportResult> {
	const url = cyclePaths.resendReport(variables.auditId);
	const payload = mapResendToPayload(variables);
	const body = await tracked(
		{ operation: "resendReport", method: "POST", url, payload },
		() => mockDealerCycleBackend.resendReport(payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<ResendReportResponse>>(url, payload).then((r) => r.data),
	);
	return mapResendResponse(body.data);
}

export const dealerCycleApi = {
	getTrackerSummary,
	getQueueCounts,
	getAuditsByStatus,
	getAllAudits,
	launchCycle,
	sendReminders,
	resendReport,
};

export type DealerCycleApi = typeof dealerCycleApi;
