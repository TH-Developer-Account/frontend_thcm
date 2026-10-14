// modules/audit/dealerAudit/dealer-audit.api.ts
//
// Dealer Audit HTTP operations. Typed in, typed (domain) out. No toasts,
// navigation or cache updates here — hooks own those.
//
// ─────────────────────────────────────────────────────────────────────
// HOW TO GO LIVE (per function — takes a minute each)
//   1. Uncomment the `ServerAxios` import below.
//   2. In the function, delete the "TEMP MOCK" line and uncomment the
//      "LIVE" line right under it. Change the path in `auditPaths` if the
//      backend route differs.
//   3. Set API_SOURCE to "LIVE" so the console label is accurate.
//   4. When every function is live, delete dealer-audit.mock.ts.
//
// Every call prints its params / payload / response to the browser
// console in development (see shared/audit-api-log.ts).
// ─────────────────────────────────────────────────────────────────────

// import { ServerAxios } from "../../../services/ServerAxios";
import { logAuditApi } from "../shared/audit-api-log";
import type { AuditApiLogEntry, AuditApiLogSource } from "../shared/audit-api-log";
import { mockDealerAuditBackend } from "./dealer-audit.mock";
import {
	mapAuditListResponse,
	mapChecklistItemResponse,
	mapChecklistResponse,
	mapDealerAuditResponse,
	mapDealerOptionResponse,
	mapEvidenceResponse,
	mapFormToCreateAuditPayload,
	mapFormToSaveItemPayload,
	mapHistoryEntryResponse,
	mapPhotoToUploadMeta,
	mapReAuditToPayload,
	mapReassignToPayload,
	mapReportResponse,
	mapReviewFormToPayload,
	mapReviewerOptionResponse,
	mapSaveAuditItemResponse,
	normalizeAuditListParams,
	toAuditListQuery,
} from "./dealer-audit.mappers";
import type {
	ApproveAuditPayload,
	ApproveAuditVariables,
	AuditVersionVariables,
	CreateDealerAuditFormValues,
	DealerAudit,
	DealerAuditChecklist,
	DealerAuditChecklistItem,
	DealerAuditDealerOption,
	DealerAuditEvidence,
	DealerAuditHistoryEntry,
	DealerAuditListItem,
	DealerAuditListParams,
	DealerAuditReport,
	DealerAuditReviewerOption,
	PaginatedResult,
	RaiseClarificationPayload,
	RaiseClarificationVariables,
	ReAuditVariables,
	ReassignReviewerVariables,
	RejectAuditPayload,
	RejectAuditVariables,
	RespondToClarificationPayload,
	RespondToClarificationVariables,
	ReviewAuditItemVariables,
	SaveAuditItemResult,
	SaveAuditItemVariables,
	SubmitAuditPayload,
	SubmitReviewPayload,
	UploadEvidenceVariables,
} from "./dealer-audit.types";

/** Flip to "LIVE" once the functions below call ServerAxios. */
const API_SOURCE: AuditApiLogSource = "MOCK";

const BASE = "/dealer-audit/audits";
const enc = encodeURIComponent;

/** Route table — change a path here if the backend differs. */
export const auditPaths = {
	list: BASE,
	detail: (auditId: string) => `${BASE}/${enc(auditId)}`,
	checklist: (auditId: string) => `${BASE}/${enc(auditId)}/checklist`,
	item: (auditId: string, itemId: string) =>
		`${BASE}/${enc(auditId)}/items/${enc(itemId)}`,
	reviewItem: (auditId: string, itemId: string) =>
		`${BASE}/${enc(auditId)}/items/${enc(itemId)}/review`,
	evidence: (auditId: string) => `${BASE}/${enc(auditId)}/evidence`,
	evidenceById: (auditId: string, evidenceId: string) =>
		`${BASE}/${enc(auditId)}/evidence/${enc(evidenceId)}`,
	submit: (auditId: string) => `${BASE}/${enc(auditId)}/submit`,
	startReview: (auditId: string) => `${BASE}/${enc(auditId)}/review/start`,
	submitReview: (auditId: string) => `${BASE}/${enc(auditId)}/review/submit`,
	clarifications: (auditId: string) =>
		`${BASE}/${enc(auditId)}/clarifications`,
	clarificationResponse: (auditId: string) =>
		`${BASE}/${enc(auditId)}/clarifications/respond`,
	approve: (auditId: string) => `${BASE}/${enc(auditId)}/approve`,
	reject: (auditId: string) => `${BASE}/${enc(auditId)}/reject`,
	reassign: (auditId: string) => `${BASE}/${enc(auditId)}/reassign`,
	reAudit: (auditId: string) => `${BASE}/${enc(auditId)}/re-audit`,
	history: (auditId: string) => `${BASE}/${enc(auditId)}/history`,
	report: (auditId: string) => `${BASE}/${enc(auditId)}/report`,
	dealerOptions: "/dealer-audit/options/dealers",
	reviewerOptions: "/dealer-audit/options/reviewers",
} as const;

type LogMeta = Omit<AuditApiLogEntry, "source" | "response" | "error">;

/** Runs one call and prints its payload + response (or error) in dev. */
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

async function getAudits(
	rawParams: Partial<DealerAuditListParams>,
	signal?: AbortSignal,
): Promise<PaginatedResult<DealerAuditListItem>> {
	const params = normalizeAuditListParams(rawParams);
	const query = toAuditListQuery(params);

	const body = await tracked(
		{ operation: "getAudits", method: "GET", url: auditPaths.list, params: query },
		() =>
			mockDealerAuditBackend.getAudits(params), // TEMP MOCK
		// LIVE:
		// ServerAxios.get<ApiPaginatedEnvelope<DealerAuditListItemResponse>>(
		// 	auditPaths.list, { params: query, signal },
		// ).then((r) => r.data),
	);
	void signal;
	return mapAuditListResponse(body);
}

async function getAudit(
	auditId: string,
	signal?: AbortSignal,
): Promise<DealerAudit> {
	const url = auditPaths.detail(auditId);
	const body = await tracked({ operation: "getAudit", method: "GET", url }, () =>
		mockDealerAuditBackend.getAudit(auditId), // TEMP MOCK
		// LIVE:
		// ServerAxios.get<ApiEnvelope<DealerAuditResponse>>(url, { signal })
		// 	.then((r) => r.data),
	);
	void signal;
	return mapDealerAuditResponse(body.data);
}

async function getChecklist(
	auditId: string,
	signal?: AbortSignal,
): Promise<DealerAuditChecklist> {
	const url = auditPaths.checklist(auditId);
	const body = await tracked(
		{ operation: "getChecklist", method: "GET", url },
		() =>
			mockDealerAuditBackend.getChecklist(auditId), // TEMP MOCK
		// LIVE:
		// ServerAxios.get<ApiEnvelope<DealerAuditChecklistResponse>>(url, { signal })
		// 	.then((r) => r.data),
	);
	void signal;
	return mapChecklistResponse(body.data);
}

async function getAuditHistory(
	auditId: string,
	signal?: AbortSignal,
): Promise<DealerAuditHistoryEntry[]> {
	const url = auditPaths.history(auditId);
	const body = await tracked(
		{ operation: "getAuditHistory", method: "GET", url },
		() =>
			mockDealerAuditBackend.getHistory(auditId), // TEMP MOCK
		// LIVE:
		// ServerAxios.get<ApiEnvelope<DealerAuditHistoryEntryResponse[]>>(url, { signal })
		// 	.then((r) => r.data),
	);
	void signal;
	return (body.data ?? []).map(mapHistoryEntryResponse);
}

async function getAuditReport(
	auditId: string,
	signal?: AbortSignal,
): Promise<DealerAuditReport> {
	const url = auditPaths.report(auditId);
	const body = await tracked(
		{ operation: "getAuditReport", method: "GET", url },
		() =>
			mockDealerAuditBackend.getReport(auditId), // TEMP MOCK
		// LIVE:
		// ServerAxios.get<ApiEnvelope<DealerAuditReportResponse>>(url, { signal })
		// 	.then((r) => r.data),
	);
	void signal;
	return mapReportResponse(body.data);
}

async function getDealerOptions(
	signal?: AbortSignal,
): Promise<DealerAuditDealerOption[]> {
	const body = await tracked(
		{ operation: "getDealerOptions", method: "GET", url: auditPaths.dealerOptions },
		() =>
			mockDealerAuditBackend.getDealerOptions(), // TEMP MOCK
		// LIVE:
		// ServerAxios.get<ApiEnvelope<DealerAuditDealerOptionResponse[]>>(
		// 	auditPaths.dealerOptions, { signal },
		// ).then((r) => r.data),
	);
	void signal;
	return (body.data ?? []).map(mapDealerOptionResponse);
}

async function getReviewerOptions(
	signal?: AbortSignal,
): Promise<DealerAuditReviewerOption[]> {
	const body = await tracked(
		{ operation: "getReviewerOptions", method: "GET", url: auditPaths.reviewerOptions },
		() =>
			mockDealerAuditBackend.getReviewerOptions(), // TEMP MOCK
		// LIVE:
		// ServerAxios.get<ApiEnvelope<DealerAuditReviewerOptionResponse[]>>(
		// 	auditPaths.reviewerOptions, { signal },
		// ).then((r) => r.data),
	);
	void signal;
	return (body.data ?? []).map(mapReviewerOptionResponse);
}

// ── Admin: create / assign / re-audit ─────────────────────────────────

async function createAudits(
	values: CreateDealerAuditFormValues,
): Promise<DealerAudit[]> {
	const payload = mapFormToCreateAuditPayload(values);
	const body = await tracked(
		{ operation: "createAudits", method: "POST", url: auditPaths.list, payload },
		() =>
			mockDealerAuditBackend.createAudits(payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditResponse[]>>(auditPaths.list, payload)
		// 	.then((r) => r.data),
	);
	return (body.data ?? []).map(mapDealerAuditResponse);
}

async function reAudit(variables: ReAuditVariables): Promise<DealerAudit> {
	const url = auditPaths.reAudit(variables.auditId);
	const payload = mapReAuditToPayload(variables);
	const body = await tracked(
		{ operation: "reAudit", method: "POST", url, payload },
		() =>
			mockDealerAuditBackend.reAudit(variables.auditId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapDealerAuditResponse(body.data);
}

async function reassignReviewer(
	variables: ReassignReviewerVariables,
): Promise<DealerAudit> {
	const url = auditPaths.reassign(variables.auditId);
	const payload = mapReassignToPayload(variables);
	const body = await tracked(
		{ operation: "reassignReviewer", method: "POST", url, payload },
		() =>
			mockDealerAuditBackend.reassignReviewer(variables.auditId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapDealerAuditResponse(body.data);
}

// ── Dealer: self-assessment ───────────────────────────────────────────

async function saveAuditItem(
	variables: SaveAuditItemVariables,
): Promise<SaveAuditItemResult> {
	const url = auditPaths.item(variables.auditId, variables.itemId);
	const payload = mapFormToSaveItemPayload(
		variables.values,
		variables.markComplete,
	);
	const body = await tracked(
		{ operation: "saveAuditItem", method: "PUT", url, payload },
		() =>
			mockDealerAuditBackend.saveItem(variables.auditId, variables.itemId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.put<ApiEnvelope<SaveAuditItemResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapSaveAuditItemResponse(body.data);
}

async function uploadEvidence(
	variables: UploadEvidenceVariables,
): Promise<DealerAuditEvidence> {
	const { auditId, itemId, photo, onProgress } = variables;
	const meta = mapPhotoToUploadMeta(itemId, photo);
	// Location is mandatory — never send evidence without it.
	if (!meta) throw new Error("Evidence location is missing.");

	const url = auditPaths.evidence(auditId);
	const body = await tracked(
		{
			operation: "uploadEvidence",
			method: "POST",
			url,
			// File contents are never logged; only its descriptor.
			payload: { ...meta, file: photo.file },
		},
		async () => {
			onProgress?.(100); // TEMP MOCK (no real transfer to measure)
			return mockDealerAuditBackend.uploadEvidence(auditId, meta, photo.file, photo.name);
		},
		// LIVE:
		// () => {
		// 	if (!photo.file) throw new Error("Evidence file is missing.");
		// 	const form = new FormData();
		// 	form.append("file", photo.file, photo.name);
		// 	form.append("item_id", meta.item_id);
		// 	form.append("latitude", String(meta.latitude));
		// 	form.append("longitude", String(meta.longitude));
		// 	if (meta.accuracy_m !== null) form.append("accuracy_m", String(meta.accuracy_m));
		// 	form.append("captured_at", meta.captured_at);
		// 	return ServerAxios.post<ApiEnvelope<DealerAuditEvidenceResponse>>(url, form, {
		// 		onUploadProgress: (event) => {
		// 			if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
		// 		},
		// 	}).then((r) => r.data);
		// },
	);
	return mapEvidenceResponse(body.data);
}

async function deleteEvidence(variables: {
	auditId: string;
	itemId: string;
	evidenceId: string;
}): Promise<void> {
	const url = auditPaths.evidenceById(variables.auditId, variables.evidenceId);
	await tracked(
		{
			operation: "deleteEvidence",
			method: "DELETE",
			url,
			params: { item_id: variables.itemId },
		},
		() =>
			mockDealerAuditBackend.deleteEvidence(
				variables.auditId,
				variables.itemId,
				variables.evidenceId,
			), // TEMP MOCK
		// LIVE:
		// ServerAxios.delete<ApiEnvelope<null>>(url, { params: { item_id: variables.itemId } })
		// 	.then((r) => r.data),
	);
}

async function submitAudit(variables: AuditVersionVariables): Promise<DealerAudit> {
	const url = auditPaths.submit(variables.auditId);
	const payload: SubmitAuditPayload = { version: variables.version };
	const body = await tracked(
		{ operation: "submitAudit", method: "POST", url, payload },
		() =>
			mockDealerAuditBackend.submitAudit(variables.auditId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapDealerAuditResponse(body.data);
}

async function respondToClarification(
	variables: RespondToClarificationVariables,
): Promise<DealerAuditChecklistItem> {
	const url = auditPaths.clarificationResponse(variables.auditId);
	const payload: RespondToClarificationPayload = {
		item_id: variables.itemId,
		response: variables.response.trim(),
	};
	const body = await tracked(
		{ operation: "respondToClarification", method: "POST", url, payload },
		() =>
			mockDealerAuditBackend.respondToClarification(variables.auditId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditChecklistItemResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapChecklistItemResponse(body.data);
}

// ── Reviewer ──────────────────────────────────────────────────────────

async function startReview(auditId: string): Promise<DealerAudit> {
	const url = auditPaths.startReview(auditId);
	const body = await tracked(
		{ operation: "startReview", method: "POST", url },
		() =>
			mockDealerAuditBackend.startReview(auditId), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditResponse>>(url).then((r) => r.data),
	);
	return mapDealerAuditResponse(body.data);
}

async function reviewAuditItem(
	variables: ReviewAuditItemVariables & { selfScore: number | null },
): Promise<SaveAuditItemResult> {
	const url = auditPaths.reviewItem(variables.auditId, variables.itemId);
	const payload = mapReviewFormToPayload(variables.values, variables.selfScore);
	const body = await tracked(
		{ operation: "reviewAuditItem", method: "PUT", url, payload },
		() =>
			mockDealerAuditBackend.reviewItem(variables.auditId, variables.itemId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.put<ApiEnvelope<SaveAuditItemResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapSaveAuditItemResponse(body.data);
}

async function raiseClarification(
	variables: RaiseClarificationVariables,
): Promise<DealerAudit> {
	const url = auditPaths.clarifications(variables.auditId);
	const payload: RaiseClarificationPayload = {
		item_ids: variables.itemIds,
		remarks: variables.remarks.trim(),
		version: variables.version,
	};
	const body = await tracked(
		{ operation: "raiseClarification", method: "POST", url, payload },
		() =>
			mockDealerAuditBackend.raiseClarification(variables.auditId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapDealerAuditResponse(body.data);
}

async function submitReview(variables: AuditVersionVariables): Promise<DealerAudit> {
	const url = auditPaths.submitReview(variables.auditId);
	const payload: SubmitReviewPayload = { version: variables.version };
	const body = await tracked(
		{ operation: "submitReview", method: "POST", url, payload },
		() =>
			mockDealerAuditBackend.submitReview(variables.auditId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapDealerAuditResponse(body.data);
}

// ── Approver ──────────────────────────────────────────────────────────

async function approveAudit(variables: ApproveAuditVariables): Promise<DealerAudit> {
	const url = auditPaths.approve(variables.auditId);
	const payload: ApproveAuditPayload = {
		remarks: variables.remarks.trim(),
		version: variables.version,
	};
	const body = await tracked(
		{ operation: "approveAudit", method: "POST", url, payload },
		() =>
			mockDealerAuditBackend.approveAudit(variables.auditId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapDealerAuditResponse(body.data);
}

async function rejectAudit(variables: RejectAuditVariables): Promise<DealerAudit> {
	const url = auditPaths.reject(variables.auditId);
	const payload: RejectAuditPayload = {
		reason: variables.reason.trim(),
		version: variables.version,
	};
	const body = await tracked(
		{ operation: "rejectAudit", method: "POST", url, payload },
		() =>
			mockDealerAuditBackend.rejectAudit(variables.auditId, payload), // TEMP MOCK
		// LIVE:
		// ServerAxios.post<ApiEnvelope<DealerAuditResponse>>(url, payload)
		// 	.then((r) => r.data),
	);
	return mapDealerAuditResponse(body.data);
}

export const dealerAuditApi = {
	getAudits,
	getAudit,
	getChecklist,
	getAuditHistory,
	getAuditReport,
	getDealerOptions,
	getReviewerOptions,
	createAudits,
	reAudit,
	reassignReviewer,
	saveAuditItem,
	uploadEvidence,
	deleteEvidence,
	submitAudit,
	respondToClarification,
	startReview,
	reviewAuditItem,
	raiseClarification,
	submitReview,
	approveAudit,
	rejectAudit,
};

export type DealerAuditApi = typeof dealerAuditApi;
