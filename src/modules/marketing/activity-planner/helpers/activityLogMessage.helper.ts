import { formatDateTime } from "../../../../utils/format";

export type AuditComment = {
	action?: string | null;
	metadata?: {
		reason?: string | null;
	};
	stageName?: string | null;
	actor?: {
		first_name?: string | null;
		last_name?: string | null;
	};
	createdAt: string;
};

export const getActorName = (comment: AuditComment) => {
	return [comment.actor?.first_name, comment.actor?.last_name]
		.filter(Boolean)
		.join(" ");
};

export const getAuditMessage = (comment: AuditComment) => {
	const actorName = getActorName(comment) || "Someone";
	const action = comment.action?.toUpperCase();
	const reason = comment.metadata?.reason?.trim();
	const stageName = comment.stageName;
	const timeStamp = formatDateTime(comment.createdAt);

	const reasonText = reason ? ` • ${reason} • ` : "";
	const stageText = stageName ? `${stageName} • ` : "";

	switch (action) {
		case "APPROVED":
			return `${stageText}${actorName} approved this${reasonText} ${timeStamp}`;

		case "RECOMMENDED":
			return `${stageText}${actorName} recommended this${reasonText} ${timeStamp}`;

		case "CLARIFY_SUBMITTED":
			return `${actorName} resubmitted this${reasonText} ${timeStamp}`;

		case "CLARIFY":
			return `${stageText}${actorName} asked for clarification${reasonText} ${timeStamp}`;

		case "SUBMITTED":
			return `${actorName} submitted this${reasonText} ${timeStamp}`;

		case "CANCELLED":
			return `${actorName} cancelled this${reasonText} ${timeStamp}`;

		case "COMPLETED":
			return `${actorName} completed this${reasonText} ${timeStamp}`;

		case "REPORT_SUBMITTED":
			return `${actorName} submitted the report${reasonText} ${timeStamp}`;

		case "EPC_CREATED":
			return `${actorName} created this EPC${reasonText} ${timeStamp}`;

		case "EPC_UPDATED":
			return `${actorName} updated this EPC${reasonText} ${timeStamp}`;

		case "CRF_CREATED":
			return `${actorName} created this CRF${reasonText} ${timeStamp}`;

		case "CRF_UPDATED":
			return `${actorName} updated this CRF${reasonText} ${timeStamp}`;

		case "EPF_CREATED":
			return `${actorName} created this EPF${reasonText} ${timeStamp}`;

		case "EPF_UPDATED":
			return `${actorName} updated this EPF${reasonText} ${timeStamp}`;

		case "EPC_CONDUCTED":
			return `Event was successfully conducted ${timeStamp}`;

		case "EPC_CANCELLED":
			return `Event was cancelled ${timeStamp}`;

		default:
			return reason
				? `${stageText}${actorName} updated this — ${reason} ${timeStamp}`
				: `${actorName} updated this ${timeStamp}`;
	}
};
