import {
	NORMALIZED_AUDIT_ACTIONS,
	type AuditAction,
	type AuditLogEntry,
	type AuditMessageContext,
	type AuditMessageOptions,
	type AuditMessageParts,
	type AuditMetadata,
	type NormalizedAuditAction,
} from "./audit.types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Separator used when an audit message is rendered as a single string. */
export const AUDIT_MESSAGE_SEPARATOR = " - ";

/* -------------------------------------------------------------------------- */
/* Action normalization                                                       */
/* -------------------------------------------------------------------------- */

const SORTED_NORMALIZED_ACTIONS = [...NORMALIZED_AUDIT_ACTIONS].sort(
	(first, second) => second.length - first.length,
);

const isNormalizedAuditAction = (
	value: string,
): value is NormalizedAuditAction =>
	NORMALIZED_AUDIT_ACTIONS.some((action) => action === value);

export const normalizeAuditAction = (
	value?: AuditAction | null,
): NormalizedAuditAction | string => {
	const normalizedValue = String(value ?? "")
		.trim()
		.toUpperCase();

	if (!normalizedValue) {
		return "";
	}

	if (isNormalizedAuditAction(normalizedValue)) {
		return normalizedValue;
	}

	const matchedAction = SORTED_NORMALIZED_ACTIONS.find((action) =>
		normalizedValue.endsWith(`_${action}`),
	);

	return matchedAction ?? normalizedValue;
};

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

export const formatAuditLabel = (value?: string | null): string => {
	const normalized = String(value ?? "").trim();

	if (!normalized) return "";

	return normalized
		.toLowerCase()
		.split("_")
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export const getAuditActorName = (entry: AuditLogEntry): string => {
	const actor = entry.actor;

	const fullName = [actor?.first_name, actor?.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();

	return fullName || actor?.email || "A user";
};

export const getAuditReason = (entry: AuditLogEntry): string | undefined => {
	const metadata = entry.metadata as AuditMetadata | null | undefined;

	return (
		metadata?.reason?.trim() ||
		metadata?.remarks?.trim() ||
		metadata?.comment?.trim() ||
		undefined
	);
};

export const formatAuditTimestamp = (date: string): string => {
	const parsedDate = new Date(date);

	if (Number.isNaN(parsedDate.getTime())) {
		return "";
	}

	return parsedDate.toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

/* -------------------------------------------------------------------------- */
/* Default action labels                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Short, past-tense action labels.
 * Reason/comment is NOT part of the label — it is rendered separately
 * after the timestamp.
 */
const DEFAULT_AUDIT_ACTION_LABELS: Record<NormalizedAuditAction, string> = {
	CREATED: "Created",
	INITIATED: "Initiated",
	UPDATED: "Updated",
	SUBMITTED: "Submitted",
	RESUBMITTED: "Resubmitted",
	SENT_FOR_APPROVAL: "Sent for approval",
	CONDUCTED: "Conducted",
	CANCELLED: "Cancelled",
	VALIDATED: "Validated",
	APPROVED: "Approved",
	REJECTED: "Rejected",
	CLARIFY: "Clarified ",
	CLARIFICATION_REQUESTED: "Clarified",
	DEVIATION_RAISED: "Deviated",
	ACCEPTED: "Accepted",
	CLOSED: "Closed",
	WORKFLOW_ASSIGNED: "Assigned workflow",
	WORKFLOW_STARTED: "Started workflow",
};

/** Actions where the workflow stage adds useful context to the label. */
const STAGE_AWARE_ACTIONS: ReadonlySet<string> = new Set<NormalizedAuditAction>(
	[
		"APPROVED",
		"REJECTED",
		"CLARIFY",
		"CLARIFICATION_REQUESTED",
		"DEVIATION_RAISED",
		"ACCEPTED",
	],
);

const getDefaultAuditActionLabel = (context: AuditMessageContext): string => {
	const { action, stageSuffix } = context;

	const baseLabel = isNormalizedAuditAction(action)
		? DEFAULT_AUDIT_ACTION_LABELS[action]
		: formatAuditLabel(action) || "Updated";

	return STAGE_AWARE_ACTIONS.has(action)
		? `${baseLabel}${stageSuffix}`
		: baseLabel;
};

/* -------------------------------------------------------------------------- */
/* Main helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Returns the individual parts of an audit message:
 * actor - action - timestamp - reason/comment
 */
export const getAuditMessageParts = (
	entry: AuditLogEntry,
	options: AuditMessageOptions,
): AuditMessageParts => {
	const {
		entityName,
		actionMessages = {},
		formatTimestamp = formatAuditTimestamp,
	} = options;

	const rawAction = entry.action;
	const action = normalizeAuditAction(rawAction);
	const actorName = getAuditActorName(entry);
	const stageName = entry.stageName?.trim() || undefined;
	const reason = getAuditReason(entry);

	// const stageSuffix = stageName ? ` at ${stageName}` : "";
	const stageSuffix = "";
	const reasonSuffix = reason ? ` — ${reason}` : "";
	const context: AuditMessageContext = {
		entry,
		actorName,
		action,
		rawAction,
		stageName,
		reason,
		stageSuffix,
		reasonSuffix,
		entityName,
	};

	const customMessage = actionMessages[rawAction] ?? actionMessages[action];

	const actionLabel =
		typeof customMessage === "function"
			? customMessage(context)
			: (customMessage ?? getDefaultAuditActionLabel(context));

	const timestamp = entry.createdAt ? formatTimestamp(entry.createdAt) : "";

	return {
		actorName,
		actionLabel: actionLabel.trim(),
		timestamp: timestamp || undefined,
		reason,
	};
};

/**
 * Plain-string audit message:
 * "Actor - Action - Timestamp - Reason"
 */
export const getAuditMessage = (
	entry: AuditLogEntry,
	options: AuditMessageOptions,
): string => {
	const {
		includeTimestamp = true,
		includeActor = true,
		includeReason = true,
	} = options;

	const { actorName, actionLabel, timestamp, reason } = getAuditMessageParts(
		entry,
		options,
	);

	return [
		includeActor ? actorName : undefined,
		actionLabel,
		includeTimestamp ? timestamp : undefined,
		includeReason ? reason : undefined,
	]
		.filter((part): part is string => Boolean(part))
		.join(AUDIT_MESSAGE_SEPARATOR);
};
