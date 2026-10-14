// modules/audit/shared/execution/components/SelfAssessmentAnswerPanel.tsx
//
// Read-only view of the self-assessment answer (reviewer, admin, closed audits).

import { EvidenceCaptureField } from "../../checklist/EvidenceCaptureField";
import {
	auditExecutionContent as content,
	formatAuditMessage as format,
} from "../audit-execution.content";
import { formatAuditDateTime } from "../audit-execution.format";
import { mapEvidenceToPhoto } from "../audit-execution.mappers";
import type { AuditChecklistItem } from "../audit-execution.types";
import { formatScore } from "../audit-execution.utils";

const text = content.answer;

const noop = (): void => undefined;

interface SelfAssessmentAnswerPanelProps {
	item: AuditChecklistItem;
}

export default function SelfAssessmentAnswerPanel({ item }: SelfAssessmentAnswerPanelProps) {
	const photos = item.self.evidence.map(mapEvidenceToPhoto);

	return (
		<div className="space-y-4">
			<dl className="grid grid-cols-2 gap-3 text-sm">
				<div>
					<dt className="text-xs text-(--color-text-secondary)">
						{text.score}
					</dt>
					<dd className="font-semibold text-(--color-text-primary)">
						{item.isScored ? formatScore(item.self.score, item.maxScore) : "—"}
					</dd>
				</div>
				<div>
					<dt className="text-xs text-(--color-text-secondary)">
						{text.answeredAt}
					</dt>
					<dd className="text-(--color-text-primary)">
						{formatAuditDateTime(item.self.answeredAt, text.notAnswered)}
					</dd>
				</div>
				<div className="col-span-2">
					<dt className="text-xs text-(--color-text-secondary)">
						{text.remarks}
					</dt>
					<dd className="whitespace-pre-wrap break-words text-(--color-text-primary)">
						{item.self.remarks || text.noRemarks}
					</dd>
				</div>
			</dl>

			{photos.length > 0 ? (
				<div data-no-swipe>
					<EvidenceCaptureField
						value={photos}
						minFiles={0}
						maxFiles={Math.max(photos.length, item.maxEvidenceCount)}
						readOnly
						onCapture={noop}
						onRetry={noop}
						onRemove={noop}
					/>
				</div>
			) : (
				<p className="text-xs text-(--color-text-secondary)">
					{format(text.photoCount, { count: 0 })}
				</p>
			)}
		</div>
	);
}
