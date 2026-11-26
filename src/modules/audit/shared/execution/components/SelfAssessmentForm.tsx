// modules/audit/shared/execution/components/SelfAssessmentForm.tsx
//
// Self-assessment for one parameter: score, remarks, live geotagged photos.
// Presentational: state comes from the module's draft / uploader hooks.

import { useId } from "react";

import TextareaInput from "../../../../../components/forms/TextareaInput";
import ScoreLevelSelector from "../../checklist/ScoreLevelSelector";
import { EvidenceCaptureField } from "../../checklist/EvidenceCaptureField";
import { AUDIT_EXECUTION_RULES } from "../audit-execution.config";
import {
	auditExecutionContent as content,
	formatAuditMessage as format,
} from "../audit-execution.content";
import type {
	AuditChecklistItem,
	EvidenceController,
	ItemDraftController,
} from "../audit-execution.types";
import { getEvidenceLimits, getScoreOptions } from "../audit-execution.utils";

const text = content.selfAssessment;

interface SelfAssessmentFormProps {
	item: AuditChecklistItem;
	draft: ItemDraftController;
	uploader: EvidenceController;
	editable: boolean;
}

export default function SelfAssessmentForm({
	item,
	draft,
	uploader,
	editable,
}: SelfAssessmentFormProps) {
	const remarksId = useId();
	const { min: minEvidence, max: maxEvidence } = getEvidenceLimits(item);
	const remarksLength = draft.values.remarks.length;

	return (
		<div className="space-y-5">
			{item.isScored ? (
				<fieldset className="space-y-2">
					<legend className="text-sm font-medium text-(--color-text-primary)">
						{text.scoreLabel}
						<span className="ml-1 text-xs font-normal text-(--color-text-secondary)">
							{format(text.scoreRange, {
								min: item.minScore,
								max: item.maxScore,
							})}
						</span>
					</legend>
					<ScoreLevelSelector
						label={text.scoreLabel}
						options={getScoreOptions(item)}
						value={draft.values.score}
						onChange={draft.setScore}
						disabled={!editable}
						error={draft.errors.score}
					/>
				</fieldset>
			) : null}

			<div data-no-swipe>
				<TextareaInput
					id={remarksId}
					label={text.remarksLabel}
					placeholder={text.remarksPlaceholder}
					rows={3}
					maxLength={AUDIT_EXECUTION_RULES.text.remarksMaxLength}
					value={draft.values.remarks}
					disabled={!editable}
					error={draft.errors.remarks}
					onChange={(event) => draft.setRemarks(event.target.value)}
				/>
				<p className="mt-1 text-right text-xs text-(--color-text-secondary)">
					{remarksLength}/{AUDIT_EXECUTION_RULES.text.remarksMaxLength}
				</p>
			</div>

			{maxEvidence > 0 ? (
				<div data-no-swipe>
					<EvidenceCaptureField
						value={draft.values.evidence}
						minFiles={minEvidence}
						maxFiles={maxEvidence}
						required={item.evidenceRequired}
						disabled={!editable}
						readOnly={!editable}
						error={draft.errors.evidence}
						onCapture={uploader.addCapturedPhoto}
						onRetry={uploader.retryUpload}
						onRemove={uploader.removePhoto}
					/>
				</div>
			) : null}
		</div>
	);
}
