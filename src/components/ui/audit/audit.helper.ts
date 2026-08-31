import {
	NORMALIZED_AUDIT_ACTIONS,
	type AuditAction,
	type AuditLogEntry,
	type AuditMessageContext,
	type AuditMessageOptions,
	type AuditMetadata,
	type NormalizedAuditAction,
} from "./audit.types";

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
/* Default messages                                                           */
/* -------------------------------------------------------------------------- */

const getDefaultAuditMessage = (context: AuditMessageContext): string => {
	const { action, stageSuffix, reasonSuffix, entityName } = context;

	switch (action) {
		case "CREATED":
			return `Created the ${entityName}`;

		case "INITIATED":
			return `Initiated the ${entityName}`;

		case "UPDATED":
			return `Updated the ${entityName}`;

		case "SUBMITTED":
			return `Submitted the ${entityName}`;

		case "RESUBMITTED":
			return `Resubmitted the ${entityName}`;

		case "SENT_FOR_APPROVAL":
			return `Sent the ${entityName} for approval`;

		case "CONDUCTED":
			return `Marked the ${entityName} as conducted`;

		case "CANCELLED":
			return `Cancelled the ${entityName}`;

		case "VALIDATED":
			return `Validated the ${entityName}`;

		case "APPROVED":
			return `Approved the ${entityName}${stageSuffix}`;

		case "REJECTED":
			return `Rejected the ${entityName}${stageSuffix}${reasonSuffix}`;

		case "CLARIFY":
		case "CLARIFICATION_REQUESTED":
			return `Requested clarification for the ${entityName}${stageSuffix}${reasonSuffix}`;

		case "DEVIATION_RAISED":
			return `Raised a deviation for the ${entityName}${stageSuffix}${reasonSuffix}`;

		case "ACCEPTED":
			return `Accepted the ${entityName}${stageSuffix}`;

		case "CLOSED":
			return `Closed the ${entityName}`;

		case "WORKFLOW_ASSIGNED":
			return `Assigned an approval workflow to the ${entityName}`;

		case "WORKFLOW_STARTED":
			return `Started the approval workflow for the ${entityName}`;

		default: {
			const actionLabel = formatAuditLabel(action);

			if (actionLabel) {
				return `Performed “${actionLabel}”${stageSuffix}${reasonSuffix}`;
			}

			return `Updated the ${entityName}`;
		}
	}
};

/* -------------------------------------------------------------------------- */
/* Main helper                                                                */
/* -------------------------------------------------------------------------- */

export const getAuditMessage = (
	entry: AuditLogEntry,
	options: AuditMessageOptions,
): string => {
	const {
		entityName,
		actionMessages = {},
		formatTimestamp = formatAuditTimestamp,
		includeTimestamp = true,
		includeActor = true,
	} = options;

	const rawAction = entry.action;
	const action = normalizeAuditAction(rawAction);
	const actorName = getAuditActorName(entry);
	const stageName = entry.stageName?.trim() || undefined;
	const reason = getAuditReason(entry);

	const stageSuffix = stageName ? ` at ${stageName}` : "";
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

	const actionMessage =
		typeof customMessage === "function"
			? customMessage(context)
			: (customMessage ?? getDefaultAuditMessage(context));

	const message = includeActor
		? `${actorName} · ${actionMessage}`
		: actionMessage;

	if (!includeTimestamp || !entry.createdAt) {
		return message;
	}

	const timestamp = formatTimestamp(entry.createdAt);

	return timestamp ? `${message} · ${timestamp}` : message;
};
