// api/epc.api.ts
// EPC + shared Activity Planner APIs:
// EPC CRUD, event outcome, event report, files/export, comment & audit adapters.
import qs from "qs";

import { createExportApi } from "../../../../common/common.api";
import {
	auditApi,
	type AuditApiAdapter,
} from "../../../../components/ui/audit";
import {
	commentApi,
	type CommentApiAdapter,
} from "../../../../components/ui/comments";
import { ServerAxios } from "../../../../services/ServerAxios";
import type {
	EpcCreatePayload,
	EpcDetailResponse,
	EpcListParams,
	EpcListResponse,
	EpcUpdatePayload,
	EventOutcomePayload,
	EventReportDetail,
	FileModuleListingRow,
} from "../types/epc.types";
import { mapImportExportResponseToRows } from "../utils/fileModule.helper";

const EVENT_PROPOSAL_SUBJECT_TYPE = "EVENT_PROPOSAL";

/* ========================================================================== */
/*                                     EPC                                    */
/* ========================================================================== */

export const epcApi = {
	getList: async (params: EpcListParams): Promise<EpcListResponse> => {
		const { limit, ...restParams } = params;

		const response = await ServerAxios.get("/epc", {
			params: {
				...restParams,
				pageSize: limit,
			},
			paramsSerializer: (requestParams) =>
				qs.stringify(requestParams, {
					arrayFormat: "repeat",
					skipNulls: true,
				}),
		});

		return response.data;
	},

	getById: async (epcId: string): Promise<EpcDetailResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/epc/${epcId}`);
		return data;
	},

	create: async (payload: EpcCreatePayload) => {
		const {
			data: { data },
		} = await ServerAxios.post("/epc", payload);
		return data;
	},

	update: async (epcId: string, payload: EpcUpdatePayload) => {
		const {
			data: { data },
		} = await ServerAxios.put(`/epc/${epcId}`, payload);
		return data;
	},
};

/* ========================================================================== */
/*                                Event outcome                               */
/* ========================================================================== */

export const eventOutcomeApi = {
	eventOutcome: async (epcId: string, payload: EventOutcomePayload) => {
		const {
			data: { data },
		} = await ServerAxios.patch(`/epc/${epcId}/event-outcome`, payload);

		return data;
	},

	closeEpc: async (epcId: string) => {
		const {
			data: { data },
		} = await ServerAxios.patch(`/epc/${epcId}/close`);

		return data;
	},
};

/* ========================================================================== */
/*                                Event report                                */
/* ========================================================================== */

export const eventReportApi = {
	getByEpcId: async (epcId: string): Promise<EventReportDetail | null> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/report/${epcId}`);

		return data ?? null;
	},

	submit: async (epcId: string, payload: FormData) => {
		const {
			data: { data },
		} = await ServerAxios.post(`/report/${epcId}/submit`, payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return data;
	},

	resubmit: async (epcId: string, payload: FormData) => {
		const {
			data: { data },
		} = await ServerAxios.post(`/report/${epcId}/resubmit`, payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return data;
	},

	validateReport: async (reportId: string) => {
		const {
			data: { data },
		} = await ServerAxios.post(`/report/${reportId}/validate`);

		return data;
	},

	clarifyReport: async (reportId: string, reason: string) => {
		const {
			data: { data },
		} = await ServerAxios.post(`/report/${reportId}/clarify`, {
			reason,
		});

		return data;
	},
};

/* ========================================================================== */
/*                          Comment & audit adapters                          */
/* ========================================================================== */

/**
 * Activity Planner always comments against EVENT_PROPOSAL subjects.
 * This just pins subjectType so callers don't have to pass it.
 */
export const activityPlannerCommentApi: CommentApiAdapter = {
	getComments: ({ subjectId }) =>
		commentApi.getComments({
			subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
			subjectId,
		}),

	createComment: ({ subjectId, approvalId, payload }) =>
		commentApi.createComment({
			subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
			subjectId,
			approvalId,
			payload,
		}),
};

/**
 * Activity Planner always audits against EVENT_PROPOSAL subjects.
 * This just pins subjectType so callers don't have to pass it.
 */
export const activityPlannerAuditApi: AuditApiAdapter = {
	getAuditLog: ({ subjectId }) =>
		auditApi.getAuditLog({
			subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
			subjectId,
		}),
};

/* ========================================================================== */
/*                            Files / Export / PDF                            */
/* ========================================================================== */

type DownloadResponseRecord = {
	success?: unknown;
	url?: unknown;
	downloadUrl?: unknown;
	fileUrl?: unknown;
	data?: unknown;
};

type PdfUrlResponse = {
	success: boolean;
	url: string;
};

export type PdfType = "EVENT_PROPOSAL";

const activityPlannerExportApi = createExportApi("/export/epc", {
	enqueuePath: "",
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
	Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getStringValue = (
	record: Record<string, unknown>,
	keys: string[],
): string | null => {
	for (const key of keys) {
		const value = record[key];

		if (typeof value === "string" && value.trim()) {
			return value.trim();
		}
	}

	return null;
};

/**
 * Supports common backend response shapes:
 *
 * { success: true, url: "..." }
 * { url: "..." }
 * { downloadUrl: "..." }
 * { fileUrl: "..." }
 * { data: { success: true, url: "..." } }
 * { data: { data: { url: "..." } } }
 */
const resolveDownloadUrl = (payload: unknown): string => {
	let current: unknown = payload;

	for (let depth = 0; depth < 4; depth += 1) {
		if (!isRecord(current)) break;

		const record = current as DownloadResponseRecord & Record<string, unknown>;

		const url = getStringValue(record, [
			"url",
			"downloadUrl",
			"fileUrl",
			"signedUrl",
			"presignedUrl",
		]);

		if (url) {
			return url;
		}

		current = record.data;
	}

	throw new Error("The server did not return a valid download URL.");
};

export const filesApi = {
	getAll: async (): Promise<FileModuleListingRow[]> => {
		const response = await ServerAxios.post("/import-export-logs/history", {
			type: "LEAD_IMPORT",
		});

		return mapImportExportResponseToRows(response.data);
	},

	getOutputFileUrl: async (logId: string): Promise<string> => {
		if (!logId.trim()) {
			throw new Error("A valid import/export log ID is required.");
		}

		const response = await ServerAxios.get(
			`/import-export-logs/${encodeURIComponent(logId)}/file`,
		);

		return resolveDownloadUrl(response.data);
	},

	getErrorFileUrl: async (logId: string): Promise<string> => {
		if (!logId.trim()) {
			throw new Error("A valid import/export log ID is required.");
		}

		const response = await ServerAxios.get(
			`/import-export-logs/${encodeURIComponent(logId)}/errors`,
		);

		return resolveDownloadUrl(response.data);
	},

	// Excel export
	enqueueExport: activityPlannerExportApi.enqueueBulkExport,
	downloadExportFile: activityPlannerExportApi.downloadExportFile,

	getExportStatus: async (jobId: string) => {
		const { data } = await ServerAxios.get("/status/epc", {
			params: {
				jobId,
			},
		});

		return data;
	},

	getPdfUrl: async (type: PdfType, claimId: string): Promise<string> => {
		const {
			data: { url },
		} = await ServerAxios.get<PdfUrlResponse>(
			`/pdf/${type}/${encodeURIComponent(claimId)}/url`,
		);

		return url;
	},
};
