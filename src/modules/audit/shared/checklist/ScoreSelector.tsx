import { Alert } from "../../../../components/common/Alert";
import { SCORE_OPTIONS } from "../../dealerAudit/checklist-library.constants";

type ScoreValue = (typeof SCORE_OPTIONS)[number]["value"];

const getScoreAlertVariant = (
	score: ScoreValue,
): "success" | "warning" | "error" => {
	if (score <= 1) return "error";
	if (score <= 3) return "warning";
	return "success";
};

type Props = {
	value: ScoreValue | null;
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
							aria-describedby={
								selected ? "selected-score-feedback" : undefined
							}
							onClick={() => onChange(option.value)}
							className="score-selector-option min-w-0 px-1 py-2 text-center"
							data-selected={isSelected}
						>
							<span className="score-selector-value block text-sm font-semibold">
								{option.value}
							</span>
						</button>
					);
				})}
			</div>
			{selected ? (
				<Alert
					type="banner"
					variant={getScoreAlertVariant(selected.value)}
					title={`${selected.value} — ${selected.label}`}
					// description={selected.description}
				/>
			) : null}
			{/* <Alert
				type="banner"
				variant="info"
				title="Select a compliance score"
				description="Rate this item from 0 to 5 based on the checklist criteria."
			/> */}
		</div>
	);
}
