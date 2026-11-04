// modules/audit/shared/checklist/ScoreLevelSelector.tsx
//
// Radio-style score picker whose options come from the parameter itself
// (its own allowed scores / min / max) instead of a fixed 0-5 scale.
//
// `blockedScores` are shown but cannot be chosen (e.g. the reviewer may not
// drop more than 1 mark below the self-assessment). A blocked option stays
// focusable and explains itself, so the user is told WHY instead of being
// left with a dead button. Both props are optional: existing callers are
// unaffected.

import { Lock } from "lucide-react";
import { useId, type KeyboardEvent } from "react";

export interface ScoreLevelOption {
	score: number;
	criteria: string;
}

interface ScoreLevelSelectorProps {
	options: readonly ScoreLevelOption[];
	value: number | null;
	onChange: (score: number) => void;
	label: string;
	disabled?: boolean;
	error?: string;
	/** Scores that are visible but not selectable. */
	blockedScores?: readonly number[];
	/** Accessible/tooltip explanation for a blocked score. */
	blockedHint?: string;
	/** Fired when the user tries to pick a blocked score. */
	onBlockedSelect?: (score: number) => void;
}

export default function ScoreLevelSelector({
	options,
	value,
	onChange,
	label,
	disabled = false,
	error,
	blockedScores = [],
	blockedHint,
	onBlockedSelect,
}: ScoreLevelSelectorProps) {
	const baseId = useId();
	const errorId = `${baseId}-error`;
	const selected = options.find((option) => option.score === value);
	const isBlocked = (score: number) => blockedScores.includes(score);

	const select = (score: number) => {
		if (disabled) return;
		if (isBlocked(score)) {
			onBlockedSelect?.(score);
			return;
		}
		onChange(score);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		if (disabled) return;
		let nextIndex: number | null = null;
		if (event.key === "ArrowRight" || event.key === "ArrowDown") {
			nextIndex = (index + 1) % options.length;
		} else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
			nextIndex = (index - 1 + options.length) % options.length;
		}
		if (nextIndex === null) return;
		event.preventDefault();
		select(options[nextIndex].score);
		const radios =
			event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
				"[role='radio']",
			);
		radios?.[nextIndex]?.focus();
	};

	return (
		<div className="score-selector space-y-2" data-no-swipe>
			<div
				className="flex flex-wrap gap-1.5"
				role="radiogroup"
				aria-label={label}
				aria-disabled={disabled}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
			>
				{options.map((option, index) => {
					const isSelected = value === option.score;
					const blocked = isBlocked(option.score);
					const isTabStop = isSelected || (value === null && index === 0);
					const baseLabel = option.criteria
						? `${option.score} — ${option.criteria}`
						: String(option.score);
					return (
						<button
							key={option.score}
							type="button"
							role="radio"
							aria-checked={isSelected}
							aria-disabled={blocked || undefined}
							aria-label={
								blocked && blockedHint ? `${baseLabel}. ${blockedHint}` : baseLabel
							}
							title={blocked ? blockedHint : undefined}
							tabIndex={isTabStop ? 0 : -1}
							disabled={disabled}
							onClick={() => select(option.score)}
							onKeyDown={(event) => handleKeyDown(event, index)}
							className={`score-selector-option min-h-11 min-w-11 px-3 py-2 text-center ${
								blocked ? "cursor-not-allowed opacity-50" : ""
							}`}
							data-selected={isSelected}
							data-blocked={blocked || undefined}
						>
							<span className="score-selector-value inline-flex items-center gap-1 text-sm font-semibold">
								{option.score}
								{blocked ? <Lock className="size-3" aria-hidden="true" /> : null}
							</span>
						</button>
					);
				})}
			</div>

			{selected?.criteria ? (
				<p className="text-xs text-slate-600" aria-live="polite">
					{selected.criteria}
				</p>
			) : null}

			{error ? (
				<p id={errorId} className="form-error-text" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
