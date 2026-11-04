// modules/audit/shared/execution/components/ReviewItemForm.tsx
//
// Reviewer's assessment for one parameter. The self-assessed score stays separate
// (shown above, never overwritten). N/A is not offered: score the parameter 0.
//
// Score rule: the reviewer may lower the self-assessed score by at most
// AUDIT_EXECUTION_RULES.review.maxScoreDrop marks. Lower options are locked, and
// tapping one opens a highlighted prompt to send the parameter for clarification
// instead.

import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { useId, useState } from "react";

import TextareaInput from "../../../../../components/forms/TextareaInput";
import ScoreLevelSelector from "../../checklist/ScoreLevelSelector";
import { AUDIT_EXECUTION_RULES } from "../audit-execution.config";
import {
	auditExecutionContent as content,
	formatAuditMessage as format,
} from "../audit-execution.content";
import type {
	AuditChecklistItem,
	ReviewDraftController,
	ReviewItemFormValues,
} from "../audit-execution.types";
import {
	getReviewerMinScore,
	getScoreOptions,
	hasScoreChanged,
} from "../audit-execution.utils";

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
	const [dropAttempted, setDropAttempted] = useState(false);

	const options = getScoreOptions(item);
	const minScore = getReviewerMinScore(item.self.score);
	const blockedScores =
		minScore === null
			? []
			: options.map((option) => option.score).filter((score) => score < minScore);
	const scoreChanged = hasScoreChanged(item.self.score, draft.values.score);
	const isSentForClarification = draft.values.decision === "CLARIFICATION_REQUIRED";
	const maxDrop = AUDIT_EXECUTION_RULES.review.maxScoreDrop;

	const handleSendForClarification = () => {
		draft.setDecision("CLARIFICATION_REQUIRED");
		setDropAttempted(false);
	};

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
					{blockedScores.length > 0 ? (
						<p className="text-xs text-slate-600">
							{format(text.scoreDropRule, {
								self: item.self.score ?? 0,
								min: minScore ?? 0,
								max: maxDrop,
							})}
						</p>
					) : null}
					<ScoreLevelSelector
						label={text.scoreLabel}
						options={options}
						value={draft.values.score}
						onChange={(score) => {
							setDropAttempted(false);
							draft.setScore(score);
						}}
						disabled={!editable}
						error={draft.errors.score}
						blockedScores={blockedScores}
						blockedHint={text.scoreDropBlockedHint}
						onBlockedSelect={() => setDropAttempted(true)}
					/>

					{/* Highlighted prompt: lowering by 2+ marks goes back as a clarification. */}
					{editable && (dropAttempted || isSentForClarification) && blockedScores.length > 0 ? (
						<div
							role={isSentForClarification ? "status" : "alert"}
							className={`rounded-lg border-2 p-3 text-sm ${
								isSentForClarification
									? "border-emerald-300 bg-emerald-50 text-emerald-900"
									: "border-amber-400 bg-amber-50 text-amber-900"
							}`}
						>
							<p className="flex items-start gap-2 font-semibold">
								{isSentForClarification ? (
									<CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
								) : (
									<AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
								)}
								{isSentForClarification
									? text.scoreDropSentTitle
									: format(text.scoreDropTitle, { max: maxDrop })}
							</p>
							<p className="mt-1">
								{isSentForClarification
									? text.scoreDropSentBody
									: format(text.scoreDropBody, { max: maxDrop })}
							</p>
							{!isSentForClarification ? (
								<button
									type="button"
									onClick={handleSendForClarification}
									className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900"
								>
									<Send className="size-4" aria-hidden="true" />
									{text.scoreDropAction}
								</button>
							) : null}
						</div>
					) : null}
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
