import { ServerAxios } from "../../../services/ServerAxios";

import type {
	ApiAuditLogEntry,
	ApiAuditUser,
	ApiEnvelope,
	AuditApiAdapter,
	AuditLogEntry,
	AuditUser,
} from "./audit.types";

const AUDIT_BASE_URL = "/comment";

const encodePathSegment = (value: string): string =>
	encodeURIComponent(value.trim());

const normalizeActor = (actor?: ApiAuditUser | null): AuditUser | null => {
	if (!actor) return null;

	const providedName = actor.name?.trim();
	const nameParts = providedName?.split(/\s+/) ?? [];

	const firstName = actor.first_name?.trim() || nameParts[0] || "";

	const lastName =
		actor.last_name?.trim() || nameParts.slice(1).join(" ") || "";

	return {
		id: actor.id,
		first_name: firstName,
		last_name: lastName,
		email: actor.email?.trim() || undefined,
	};
};

const normalizeAuditEntry = (entry: ApiAuditLogEntry): AuditLogEntry => ({
	id: entry.id,
	action: entry.action,
	metadata: entry.metadata ?? null,
	actor: normalizeActor(entry.actor),
	stageName: entry.stageName?.trim() || undefined,
	createdAt: entry.createdAt,
});

const validateSubject = (subjectType: string, subjectId: string): void => {
	if (!subjectType.trim()) {
		throw new Error("Audit subject type is required");
	}

	if (!subjectId.trim()) {
		throw new Error("Audit subject ID is required");
	}
};

export const auditApi: AuditApiAdapter = {
	getAuditLog: async ({ subjectType, subjectId }) => {
		validateSubject(subjectType, subjectId);

		const type = encodePathSegment(subjectType);
		const id = encodePathSegment(subjectId);

		const response = await ServerAxios.get<ApiEnvelope<ApiAuditLogEntry[]>>(
			`${AUDIT_BASE_URL}/${type}/${id}/activity-log`,
		);

		const entries = Array.isArray(response.data.data) ? response.data.data : [];

		return entries.map(normalizeAuditEntry);
	},
};
