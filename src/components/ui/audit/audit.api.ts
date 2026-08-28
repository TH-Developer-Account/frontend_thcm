import { ServerAxios } from "../../../services/ServerAxios";

import type { AuditApiAdapter, AuditLogEntry, AuditUser } from "./audit.types";

type ApiEnvelope<T> = {
	success?: boolean;
	data: T;
	subjectType?: string;
	subjectId?: string;
	totalEntries?: number;
};

type ApiAuditUser = {
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
};

type ApiAuditLogEntry = {
	id: string;
	action: string;
	metadata?: Record<string, unknown> | null;
	actor?: ApiAuditUser | null;
	stageName?: string | null;
	createdAt: string;
};

const AUDIT_BASE_URL = "/comment";

const encodePathSegment = (value: string): string =>
	encodeURIComponent(value.trim());

const normalizeActor = (actor?: ApiAuditUser | null): AuditUser | null => {
	if (!actor) return null;

	return {
		id: actor.id,
		first_name: actor.first_name?.trim() || "",
		last_name: actor.last_name?.trim() || "user",
		email: actor.email ?? undefined,
	};
};

const normalizeAuditEntry = (entry: ApiAuditLogEntry): AuditLogEntry => ({
	id: entry.id,
	action: entry.action,
	metadata: entry.metadata ?? null,
	actor: normalizeActor(entry.actor),
	stageName: entry.stageName ?? undefined,
	createdAt: entry.createdAt,
});

const validateSubject = (subjectType: string, subjectId: string): void => {
	if (!String(subjectType).trim()) {
		throw new Error("Audit subject type is required");
	}

	if (!subjectId.trim()) {
		throw new Error("Audit subject ID is required");
	}
};

export const auditApi: AuditApiAdapter = {
	getAuditLog: async ({ subjectType, subjectId }) => {
		validateSubject(subjectType, subjectId);

		const type = encodePathSegment(String(subjectType));
		const id = encodePathSegment(subjectId);

		const response = await ServerAxios.get<ApiEnvelope<ApiAuditLogEntry[]>>(
			`${AUDIT_BASE_URL}/${type}/${id}/activity-log`,
		);

		const entries = Array.isArray(response.data.data) ? response.data.data : [];

		return entries.map(normalizeAuditEntry);
	},
};
