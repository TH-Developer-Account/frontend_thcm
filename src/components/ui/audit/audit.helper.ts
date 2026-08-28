import type { AuditLogEntry } from "./audit.types";

export type AuditMessageOptions = {
	/**
	 * Entity being acted on.
	 * Example: "vendor onboarding request", "medical claim", "event report"
	 */
	entityName: string;

	/**
	 * Optional custom action messages.
	 * Useful when a module has special wording.
	 */
	actionMessages?: Record<
		string,
		string | ((context: AuditMessageContext) => string)
	>;

	/**
	 * Optional timestamp formatter.
	 */
	formatTimestamp?: (date: string) => string;

	/**
	 * Whether to include the timestamp in the returned message.
	 */
	includeTimestamp?: boolean;
};

export type AuditMessageContext = {
	entry: AuditLogEntry;
	actorName: string;
	action: string;
	stageName?: string;
	reason?: string;
	stageSuffix: string;
	reasonSuffix: string;
	entityName: string;
};

type AuditMetadata = {
	reason?: string | null;
	status?: string | null;
	remarks?: string | null;
	comment?: string | null;
	previousStatus?: string | null;
	currentStatus?: string | null;
	[key: string]: unknown;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const normalizeAuditAction = (value?: string | null): string => {
	return String(value ?? "")
		.trim()
		.toUpperCase();
};

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
	return new Date(date).toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

/* -------------------------------------------------------------------------- */
/* Default audit messages                                                     */
/* -------------------------------------------------------------------------- */

const getDefaultAuditMessage = (context: AuditMessageContext): string => {
	const { actorName, action, stageSuffix, reasonSuffix, entityName } = context;

	switch (action) {
		case "CREATED":
		case "INITIATED":
			return `${actorName} initiated the ${entityName}.`;

		case "UPDATED":
			return `${actorName} updated the ${entityName}.`;

		case "SUBMITTED":
			return `${actorName} submitted the ${entityName}.`;

		case "SENT_FOR_APPROVAL":
			return `${actorName} sent the ${entityName} for approval.`;

		case "APPROVED":
			return `${actorName} approved the ${entityName}${stageSuffix}.`;

		case "REJECTED":
			return `${actorName} rejected the ${entityName}${stageSuffix}${reasonSuffix}.`;

		case "CLARIFY":
		case "CLARIFICATION_REQUESTED":
			return `${actorName} requested clarification${stageSuffix}${reasonSuffix}.`;

		case "RESUBMITTED":
			return `${actorName} resubmitted the ${entityName}.`;

		case "ACCEPTED":
			return `${actorName} accepted the ${entityName}${stageSuffix}.`;

		case "CLOSED":
			return `${actorName} closed the ${entityName}.`;

		case "WORKFLOW_ASSIGNED":
			return `${actorName} assigned an approval workflow.`;

		case "WORKFLOW_STARTED":
			return `${actorName} started the approval workflow.`;

		default: {
			const actionLabel = formatAuditLabel(action);

			if (actionLabel) {
				return `${actorName} performed “${actionLabel}”${stageSuffix}${reasonSuffix}.`;
			}

			return `${actorName} updated the ${entityName}.`;
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
	} = options;

	const actorName = getAuditActorName(entry);
	const action = normalizeAuditAction(entry.action);
	const stageName = entry.stageName?.trim() || undefined;
	const reason = getAuditReason(entry);

	const stageSuffix = stageName ? ` at ${stageName}` : "";

	const reasonSuffix = reason ? ` — ${reason}` : "";

	const context: AuditMessageContext = {
		entry,
		actorName,
		action,
		stageName,
		reason,
		stageSuffix,
		reasonSuffix,
		entityName,
	};

	const customMessage = actionMessages[action];

	const message =
		typeof customMessage === "function"
			? customMessage(context)
			: (customMessage ?? getDefaultAuditMessage(context));

	if (!includeTimestamp || !entry.createdAt) {
		return message;
	}

	return `${message} (${formatTimestamp(entry.createdAt)})`;
};
