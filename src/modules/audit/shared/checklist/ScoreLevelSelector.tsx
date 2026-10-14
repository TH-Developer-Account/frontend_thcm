// modules/audit/shared/checklist/ScoreLevelSelector.tsx
//
// Radio-style score picker whose options come from the parameter itself
// (its own allowed scores / min / max) instead of a fixed 0-5 scale.

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
}

export default function ScoreLevelSelector({
	options,
	value,
	onChange,
	label,
	disabled = false,
	error,
}: ScoreLevelSelectorProps) {
	const baseId = useId();
	const errorId = `${baseId}-error`;
	const selected = options.find((option) => option.score === value);

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
		onChange(options[nextIndex].score);
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
					const isTabStop = isSelected || (value === null && index === 0);
					return (
						<button
							key={option.score}
							type="button"
							role="radio"
							aria-checked={isSelected}
							aria-label={
								option.criteria
									? `${option.score} — ${option.criteria}`
									: String(option.score)
							}
							tabIndex={isTabStop ? 0 : -1}
							disabled={disabled}
							onClick={() => onChange(option.score)}
							onKeyDown={(event) => handleKeyDown(event, index)}
							className="score-selector-option min-h-11 min-w-11 px-3 py-2 text-center"
							data-selected={isSelected}
						>
							<span className="score-selector-value block text-sm font-semibold">
								{option.score}
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
