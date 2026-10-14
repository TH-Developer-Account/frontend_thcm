// modules/audit/shared/execution/components/ReviewItemForm.tsx
//
// Reviewer's assessment for one parameter. The self-assessed score stays separate
// (shown above, never overwritten). N/A is not offered: score the parameter 0.

import { useId } from "react";

import TextareaInput from "../../../../../components/forms/TextareaInput";
import ScoreLevelSelector from "../../checklist/ScoreLevelSelector";
import { AUDIT_EXECUTION_RULES } from "../audit-execution.config";
import { auditExecutionContent as content } from "../audit-execution.content";
import type {
	AuditChecklistItem,
	ReviewDraftController,
	ReviewItemFormValues,
} from "../audit-execution.types";
import { getScoreOptions, hasScoreChanged } from "../audit-execution.utils";

const text = content.review;

type SelectableDecision = Exclude<
	ReviewItemFormValues["decision"],
	"PENDING" | "NOT_APPLICABLE"
>;

const DECISIONS: readonly SelectableDecision[] = [
	"ACCEPTED",
	"CLARIFICATION_REQUIRED",
	"DEFICIENT",
];

interface ReviewItemFormProps {
	item: AuditChecklistItem;
	draft: ReviewDraftController;
	editable: boolean;
}

export default function ReviewItemForm({
	item,
	draft,
	editable,
}: ReviewItemFormProps) {
	const decisionErrorId = useId();
	const scoreChanged = hasScoreChanged(item.self.score, draft.values.score);

	return (
		<div className="space-y-5">
			<fieldset className="space-y-2" data-no-swipe>
				<legend className="text-sm font-medium text-(--color-text-primary)">
					{text.decisionLabel}
				</legend>
				<div
					role="radiogroup"
					aria-label={text.decisionLabel}
					aria-invalid={draft.errors.decision ? true : undefined}
					aria-describedby={draft.errors.decision ? decisionErrorId : undefined}
					className="flex flex-wrap gap-2"
				>
					{DECISIONS.map((decision) => (
						<button
							key={decision}
							type="button"
							role="radio"
							aria-checked={draft.values.decision === decision}
							disabled={!editable}
							onClick={() => draft.setDecision(decision)}
							className="score-selector-option min-h-11 px-3 py-2 text-sm"
							data-selected={draft.values.decision === decision}
						>
							{text.decisions[decision]}
						</button>
					))}
				</div>
				{draft.errors.decision ? (
					<p id={decisionErrorId} className="form-error-text" role="alert">
						{draft.errors.decision}
					</p>
				) : null}
			</fieldset>

			{item.isScored ? (
				<fieldset className="space-y-2">
					<legend className="text-sm font-medium text-(--color-text-primary)">
						{text.scoreLabel}
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

			{scoreChanged ? (
				<div data-no-swipe>
					<TextareaInput
						label={text.scoreChangeReasonLabel}
						placeholder={text.scoreChangeReasonPlaceholder}
						rows={2}
						maxLength={AUDIT_EXECUTION_RULES.text.reasonMaxLength}
						value={draft.values.scoreChangeReason}
						disabled={!editable}
						error={draft.errors.scoreChangeReason}
						onChange={(event) => draft.setScoreChangeReason(event.target.value)}
					/>
				</div>
			) : null}

			<div data-no-swipe>
				<TextareaInput
					label={text.remarksLabel}
					placeholder={text.remarksPlaceholder}
					rows={3}
					maxLength={AUDIT_EXECUTION_RULES.text.remarksMaxLength}
					value={draft.values.remarks}
					disabled={!editable}
					error={draft.errors.remarks}
					onChange={(event) => draft.setRemarks(event.target.value)}
				/>
			</div>
		</div>
	);
}
