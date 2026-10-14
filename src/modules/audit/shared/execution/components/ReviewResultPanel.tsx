// modules/audit/shared/execution/components/ReviewResultPanel.tsx
//
// Read-only reviewer result. Only rendered when the viewer may see the
// reviewer assessment (permissions.canViewReviewerAssessment).

import { auditExecutionContent as content } from "../audit-execution.content";
import { formatAuditDateTime } from "../audit-execution.format";
import type { AuditChecklistItem } from "../audit-execution.types";
import { formatScore } from "../audit-execution.utils";

const text = content.review;

interface ReviewResultPanelProps {
	item: AuditChecklistItem;
}

export default function ReviewResultPanel({ item }: ReviewResultPanelProps) {
	const review = item.review;
	if (!review || review.decision === "PENDING") {
		return (
			<p className="text-sm text-(--color-text-secondary)">{text.notReviewed}</p>
		);
	}

	return (
		<dl className="grid grid-cols-2 gap-3 text-sm">
			<div>
				<dt className="text-xs text-(--color-text-secondary)">
					{text.decisionLabel}
				</dt>
				<dd className="font-medium text-(--color-text-primary)">
					{text.decisions[review.decision]}
				</dd>
			</div>
			<div>
				<dt className="text-xs text-(--color-text-secondary)">
					{text.scoreLabel}
				</dt>
				<dd className="font-semibold text-(--color-text-primary)">
					{item.isScored ? formatScore(review.score, item.maxScore) : "—"}
				</dd>
			</div>
			{review.scoreChangeReason ? (
				<div className="col-span-2">
					<dt className="text-xs text-(--color-text-secondary)">
						{text.scoreChangeReasonLabel}
					</dt>
					<dd className="whitespace-pre-wrap break-words">
						{review.scoreChangeReason}
					</dd>
				</div>
			) : null}
			<div className="col-span-2">
				<dt className="text-xs text-(--color-text-secondary)">
					{text.remarksLabel}
				</dt>
				<dd className="whitespace-pre-wrap break-words">
					{review.remarks || text.noRemarks}
				</dd>
			</div>
			<div className="col-span-2 text-xs text-(--color-text-secondary)">
				{formatAuditDateTime(review.reviewedAt)}
			</div>
		</dl>
	);
}
