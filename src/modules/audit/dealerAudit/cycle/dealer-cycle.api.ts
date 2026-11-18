// modules/audit/dealerAudit/cycle/dealer-cycle.api.ts
//
// HTTP operations for the cycle screens. Same rules as dealer-audit.api.ts:
// typed in / typed (domain) out, no toasts, no cache work, every call logged
// to the console in dev. All calls go through ServerAxios.

import { ServerAxios } from "../../../../services/ServerAxios";
import { logAuditApi } from "../../shared/audit-api-log";
import type {
	AuditApiLogEntry,
	AuditApiLogSource,
} from "../../shared/audit-api-log";
import { dealerAuditApi } from "../dealer-audit.api";
import type {
	ApiEnvelope,
	DealerAuditListItem,
	DealerAuditListParams,
	PaginatedResult,
} from "../dealer-audit.types";
import { computeDealerEligibility } from "./dealer-cycle.logic";
import {
	mapBusinessPartnerToDealerOption,
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
import type {
	AuditCycleLaunchResponse,
	AuditCycleLaunchResult,
	AuditTrackerSummary,
	AuditTrackerSummaryParams,
	AuditTrackerSummaryResponse,
	CreateAuditCycleFormValues,
	DealerCandidates,
	DealerCandidatesParams,
	ResendReportResponse,
	ResendReportResult,
	ResendReportVariables,
	ReviewQueueCounts,
	ReviewQueueCountsResponse,
	SendReminderResponse,
	SendReminderResult,
	SendReminderVariables,
} from "./dealer-cycle.types";

const API_SOURCE: AuditApiLogSource = "LIVE";

const BASE = "/dealer-audit";
const enc = encodeURIComponent;

export const cyclePaths = {
	launch: `${BASE}/cycles`,
	summary: `${BASE}/tracker/summary`,
	queueCounts: `${BASE}/review-queue/counts`,
	remind: `${BASE}/audits/remind`,
	resendReport: (auditId: string) =>
		`${BASE}/audits/${enc(auditId)}/report/resend`,
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

const BP_PAGE_SIZE = 100;
const BP_MAX_PAGES = 50; // safety stop: 5,000 business partners

/** Finds the row array and total in whichever envelope the list API returns. */
function readBusinessPartnerPage(body: unknown): {
	rows: unknown[];
	totalPages: number | null;
} {
	const root = (body ?? {}) as Record<string, unknown>;
	if (Array.isArray(body)) return { rows: body, totalPages: null };
	const inner = (root.data ?? {}) as Record<string, unknown>;
	const rows =
		(Array.isArray(root.data) && root.data) ||
		(Array.isArray(root.rows) && root.rows) ||
		(Array.isArray(inner.rows) && inner.rows) ||
		(Array.isArray(inner.data) && inner.data) ||
		(Array.isArray(inner.items) && inner.items) ||
		[];
	const pages = root.totalPages ?? inner.totalPages ?? null;
	return {
		rows: rows as unknown[],
		totalPages: typeof pages === "number" ? pages : null,
	};
}

/**
 * Walks every page of GET /business-partner using the raw response
 * (page / limit query, rows with id, bpName, officeType, bpType, isActive).
 * Reading it directly keeps the dealer step independent of how the
 * business-partner screens map their rows.
 */
async function getAllBusinessPartners() {
	const rows: unknown[] = [];
	for (let page = 1; page <= BP_MAX_PAGES; page += 1) {
		const result = await tracked(
			{
				operation: "getBusinessPartners",
				method: "GET",
				url: "/business-partner",
				params: { page, limit: BP_PAGE_SIZE },
			},
			() =>
				ServerAxios.get<unknown>("/business-partner", {
					params: { page, limit: BP_PAGE_SIZE },
				}).then((r) => readBusinessPartnerPage(r.data)),
		);
		rows.push(...result.rows);
		const done =
			result.rows.length < BP_PAGE_SIZE ||
			(result.totalPages !== null && page >= result.totalPages);
		if (done) break;
	}
	return rows;
}

/**
 * Dealers for the "Select dealers" step = every active DEALER business
 * partner from the existing business-partner list API. "Already audited" is worked out from the audits that exist for the
 * chosen period, so no dedicated candidates endpoint is needed.
 */
async function getDealerCandidates(
	params: DealerCandidatesParams,
	_signal?: AbortSignal,
): Promise<DealerCandidates> {
	try {
		return await loadDealerCandidates(params);
	} catch (error) {
		// Shows which step failed; React Query only reports "isError".
		console.error("[dealer-audit] getDealerCandidates failed", error);
		throw error;
	}
}

async function loadDealerCandidates(
	params: DealerCandidatesParams,
): Promise<DealerCandidates> {
	const [rows, existingAudits] = await Promise.all([
		getAllBusinessPartners(),
		// The dealer list must still load when the audits endpoint is not live
		// yet (or fails): then nobody is shown as "already audited".
		getAllAudits({
			periodType: params.periodType,
			year: params.year,
			quarter: params.quarter,
		}).catch((error: unknown) => {
			console.warn(
				"[dealer-audit] existing audits unavailable, skipping check",
				error,
			);
			return [] as DealerAuditListItem[];
		}),
	]);
	const dealers = rows
		.map(mapBusinessPartnerToDealerOption)
		.filter((dealer): dealer is NonNullable<typeof dealer> => dealer !== null);
	if (dealers.length === 0 || import.meta.env?.DEV) {
		const first = (rows[0] ?? {}) as Record<string, unknown>;
		console.info("[dealer-audit] dealer candidates", {
			fetched: rows.length,
			kept: dealers.length,
			bpTypes: [
				...new Set(
					rows.map((r) =>
						String(
							(r as Record<string, unknown>).bpType ??
								(r as Record<string, unknown>).type ??
								"",
						),
					),
				),
			],
			firstRowKeys: Object.keys(first),
		});
	}
	const eligibility = computeDealerEligibility({
		dealers,
		existingAudits,
		period: {
			type: params.periodType,
			year: params.year,
			quarter: params.quarter,
		},
		templateFacilityType: params.templateFacilityType ?? null,
	});
	return { dealers, eligibility };
}

async function getTrackerSummary(
	rawParams: Partial<AuditTrackerSummaryParams>,
	signal?: AbortSignal,
): Promise<AuditTrackerSummary> {
	const params = normalizeSummaryParams(rawParams);
	const query = toSummaryQuery(params);
	const body = await tracked(
		{
			operation: "getTrackerSummary",
			method: "GET",
			url: cyclePaths.summary,
			params: query,
		},
		() =>
			ServerAxios.get<ApiEnvelope<AuditTrackerSummaryResponse>>(
				cyclePaths.summary,
				{
					params: query,
					signal,
				},
			).then((r) => r.data),
	);
	return mapTrackerSummaryResponse(body.data);
}

async function getQueueCounts(
	signal?: AbortSignal,
): Promise<ReviewQueueCounts> {
	const body = await tracked(
		{ operation: "getQueueCounts", method: "GET", url: cyclePaths.queueCounts },
		() =>
			ServerAxios.get<ApiEnvelope<ReviewQueueCountsResponse>>(
				cyclePaths.queueCounts,
				{
					signal,
				},
			).then((r) => r.data),
	);
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
	return dealerAuditApi.getAudits(params, signal);
}

const ALL_PAGE_SIZE = 100;
const ALL_MAX_PAGES = 50; // safety stop: 5,000 audits

/** Walks every page of the audit list endpoint. */
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

// ── Writes ────────────────────────────────────────────────────────────

/** One request creates every audit in the cycle (all-or-nothing on the server). */
async function launchCycle(
	values: CreateAuditCycleFormValues,
): Promise<AuditCycleLaunchResult> {
	const payload = mapFormToCreateCyclePayload(values);
	const body = await tracked(
		{
			operation: "launchCycle",
			method: "POST",
			url: cyclePaths.launch,
			payload,
		},
		() =>
			ServerAxios.post<ApiEnvelope<AuditCycleLaunchResponse>>(
				cyclePaths.launch,
				payload,
			).then((r) => r.data),
	);
	return mapLaunchResponse(body.data);
}

async function sendReminders(
	variables: SendReminderVariables,
): Promise<SendReminderResult> {
	const payload = mapReminderToPayload(variables);
	const body = await tracked(
		{
			operation: "sendReminders",
			method: "POST",
			url: cyclePaths.remind,
			payload,
		},
		() =>
			ServerAxios.post<ApiEnvelope<SendReminderResponse>>(
				cyclePaths.remind,
				payload,
			).then((r) => r.data),
	);
	return mapReminderResponse(body.data);
}

async function resendReport(
	variables: ResendReportVariables,
): Promise<ResendReportResult> {
	const url = cyclePaths.resendReport(variables.auditId);
	const payload = mapResendToPayload(variables);
	const body = await tracked(
		{ operation: "resendReport", method: "POST", url, payload },
		() =>
			ServerAxios.post<ApiEnvelope<ResendReportResponse>>(url, payload).then(
				(r) => r.data,
			),
	);
	return mapResendResponse(body.data);
}

export const dealerCycleApi = {
	getDealerCandidates,
	getTrackerSummary,
	getQueueCounts,
	getAuditsByStatus,
	getAllAudits,
	launchCycle,
	sendReminders,
	resendReport,
};

export type DealerCycleApi = typeof dealerCycleApi;
