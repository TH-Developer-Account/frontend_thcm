import type { CommentItem } from "../../../../components/ui/comments";
import { formatDateTime } from "../../../../utils/format";

export const getActorName = (comment: CommentItem) => {
	return [comment.actor?.first_name, comment.actor?.last_name]
		.filter(Boolean)
		.join(" ");
};

export const getAuditMessage = (comment: CommentItem) => {
	const actorName = getActorName(comment) || "Someone";
	const action = comment.action?.toUpperCase();
	const metadataReason = comment.metadata?.reason;
	const reason =
		(typeof metadataReason === "string" ? metadataReason.trim() : "") ||
		comment.reason?.trim();
	const stageName = comment.stageName;
	const timeStamp = formatDateTime(comment.createdAt);

	const reasonText = reason ? ` • Reason: ${reason}` : "";
	const stageText = stageName ? `${stageName} • ` : "";

	switch (action) {
		// ─────────────────────────────────────────────
		// Proposer domain
		// ─────────────────────────────────────────────
		case "EPC_CREATED":
			return `${actorName} created this EPC${reasonText} • ${timeStamp}`;

		case "EPC_UPDATED":
			return `${actorName} updated this EPC${reasonText} • ${timeStamp}`;

		case "EPF_CREATED":
			return `${actorName} created this EPF${reasonText} • ${timeStamp}`;

		case "EPF_UPDATED":
			return `${actorName} updated this EPF${reasonText} • ${timeStamp}`;

		case "CRF_CREATED":
			return `${actorName} created this CRF${reasonText} • ${timeStamp}`;

		case "CRF_UPDATED":
			return `${actorName} updated this CRF${reasonText} • ${timeStamp}`;

		case "EPC_RESUBMITTED":
		case "CLARIFY_SUBMITTED":
		case "CLARIFIED_RESUBMITTED":
		case "RESUBMITTED":
			return `${actorName} resubmitted this EPC ${reasonText} • ${timeStamp}`;

		// ─────────────────────────────────────────────
		// Post-event domain
		// ─────────────────────────────────────────────
		case "EPC_CONDUCTED":
		case "COMPLETED":
			return `${actorName} marked the event as conducted${reasonText} • ${timeStamp}`;

		case "EPC_CANCELLED":
		case "CANCELLED":
			return `${actorName} cancelled this event${reasonText} • ${timeStamp}`;

		case "REPORT_SUBMITTED":
			return `${actorName} submitted the event report${reasonText} • ${timeStamp}`;

		case "REPORT_RESUBMITTED":
			return `${actorName} resubmitted the event report${reasonText} • ${timeStamp}`;

		case "REPORT_VALIDATED":
		case "VALIDATED":
			return `${actorName} validated the event report${reasonText} • ${timeStamp}`;

		case "REPORT_REJECTED":
			return `${actorName} rejected the event report${reasonText} • ${timeStamp}`;

		case "REPORT_CLARIFICATION_REQUESTED":
		case "CLARIFY_REPORT":
			return `${actorName} requested clarification on the event report${reasonText} • ${timeStamp}`;

		case "EPC_CLOSED":
			return `${actorName} closed this EPC${reasonText} • ${timeStamp}`;

		// ─────────────────────────────────────────────
		// Approval / workflow domain
		// ─────────────────────────────────────────────
		case "APPROVED":
			return `${stageText}${actorName} approved this request${reasonText} • ${timeStamp}`;

		case "RECOMMENDED":
			return `${stageText}${actorName} recommended this request${reasonText} • ${timeStamp}`;

		case "REJECTED":
			return `${stageText}${actorName} rejected this request${reasonText} • ${timeStamp}`;

		case "CLARIFY":
			return `${stageText}${actorName} asked for clarification${reasonText} • ${timeStamp}`;

		case "DEVIATION_RAISED":
			return `${actorName} raised a deviation request${reasonText} • ${timeStamp}`;

		// ─────────────────────────────────────────────
		// Generic / backward-compatible actions
		// ─────────────────────────────────────────────
		case "SUBMITTED":
			return `${actorName} submitted this request${reasonText} • ${timeStamp}`;

		default:
			return reason
				? `${stageText}${actorName} updated this request • Reason: ${reason} • ${timeStamp}`
				: `${stageText}${actorName} updated this request • ${timeStamp}`;
	}
};
