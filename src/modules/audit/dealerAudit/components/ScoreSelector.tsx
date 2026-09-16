export const SCORE_OPTIONS = [
	{
		value: 0,
		label: "Poor",
		description: "Not compliant.",
	},
	{
		value: 1,
		label: "Needs Improvement",
		description: "Major improvement is required.",
	},
	{
		value: 2,
		label: "Average",
		description: "Partially compliant with significant gaps.",
	},
	{
		value: 3,
		label: "Good",
		description: "Generally compliant with some gaps.",
	},
	{
		value: 4,
		label: "Very Good",
		description: "Mostly compliant with minor gaps.",
	},
	{
		value: 5,
		label: "Excellent",
		description: "Fully compliant with the criteria.",
	},
] as const;

type ScoreValue = (typeof SCORE_OPTIONS)[number]["value"];

type Props = {
	value: number | null;
	onChange: (value: ScoreValue) => void;
	disabled?: boolean;
};

export default function ScoreSelector({
	value,
	onChange,
	disabled = false,
}: Props) {
	const selected = SCORE_OPTIONS.find((option) => option.value === value);

	return (
		<div className="score-selector space-y-3">
			<div
				className="grid grid-cols-6 gap-1.5"
				role="radiogroup"
				aria-label="Compliance score"
				aria-disabled={disabled}
				aria-describedby={selected ? "selected-score-description" : undefined}
			>
				{SCORE_OPTIONS.map((option) => {
					const isSelected = value === option.value;

					return (
						<button
							key={option.value}
							type="button"
							role="radio"
							aria-checked={isSelected}
							aria-label={`${option.value} — ${option.label}`}
							disabled={disabled}
							onClick={() => onChange(option.value)}
							className="score-selector-option min-w-0 px-1 py-2 text-center"
							data-selected={isSelected}
						>
							<span className="score-selector-value block text-sm font-semibold">
								{option.value}
							</span>

							{/* <span className="score-selector-label mt-1 hidden text-[10px] leading-tight sm:block">
								{option.label}
							</span> */}
						</button>
					);
				})}
			</div>

			{selected ? (
				<div
					id="selected-score-description"
					className="score-selector-feedback px-3 py-2 text-xs"
					role="status"
					aria-live="polite"
				>
					<strong>
						{selected.value} — {selected.label}:
					</strong>{" "}
					{selected.description}
				</div>
			) : null}
		</div>
	);
}
