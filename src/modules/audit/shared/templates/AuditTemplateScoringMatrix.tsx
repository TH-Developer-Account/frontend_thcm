// modules/audit/shared/templates/AuditTemplateScoringMatrix.tsx
//
// Per-parameter scoring rubric:
//   • "Include score?" Yes / No
//   • Yes → one row per score (0–5, any subset: 0/3/5, 1–5, 5/0 …) with the
//     criteria that earns it. Rows can be added / removed / prefilled
//     from a preset.

import { Plus, Trash2 } from "lucide-react";
import {
	Controller,
	useFieldArray,
	useFormContext,
	useWatch,
} from "react-hook-form";

import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/forms/FormInput";
import Radio from "../../../../components/forms/Radio";
import {
	SCORE_CRITERIA_MAX_LENGTH,
	SCORE_LEVEL_PRESETS,
	TEMPLATE_MAX_SCORE_LEVELS,
	TEMPLATE_SCORE_MAX,
	TEMPLATE_SCORE_MIN,
} from "./audit-template.constants";
import type { AuditTemplateBuildFormValues } from "./audit.template.types";
import {
	createScoreLevel,
	createScoreLevelsFromPreset,
	getArrayErrorMessage,
	getNextAvailableScore,
	getParameterMaxScore,
} from "./audit-template.utils";

const INCLUDE_SCORE_OPTIONS = [
	{ label: "Yes", value: "yes" },
	{ label: "No", value: "no" },
];

type Props = {
	sectionIndex: number;
	parameterIndex: number;
	disabled?: boolean;
};

export default function AuditTemplateScoringMatrix({
	sectionIndex,
	parameterIndex,
	disabled = false,
}: Props) {
	const {
		control,
		register,
		formState: { errors },
	} = useFormContext<AuditTemplateBuildFormValues>();

	const basePath = `sections.${sectionIndex}.parameters.${parameterIndex}` as const;

	const { fields, append, remove, replace } = useFieldArray({
		control,
		name: `${basePath}.scoreLevels`,
		keyName: "fieldKey",
	});

	const isScored = useWatch({ control, name: `${basePath}.isScored` });
	const scoreLevels = useWatch({ control, name: `${basePath}.scoreLevels` });

	const parameterErrors =
		errors.sections?.[sectionIndex]?.parameters?.[parameterIndex];
	const levelErrors = parameterErrors?.scoreLevels;
	const matrixError = getArrayErrorMessage(levelErrors);

	const nextScore = getNextAvailableScore(scoreLevels ?? []);
	const canAddLevel =
		!disabled && nextScore !== null && fields.length < TEMPLATE_MAX_SCORE_LEVELS;
	const maxScore = getParameterMaxScore({
		isScored,
		scoreLevels: scoreLevels ?? [],
	});

	const idPrefix = `s${sectionIndex}-p${parameterIndex}`;

	return (
		<fieldset className="rounded-lg border border-(--color-border-default) bg-(--color-bg-surface) p-3">
			<legend className="sr-only">Scoring</legend>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<Controller
					control={control}
					name={`${basePath}.isScored`}
					render={({ field }) => (
						<Radio
							name={`${idPrefix}-include-score`}
							groupLabel="Include score?"
							options={INCLUDE_SCORE_OPTIONS}
							selectedValue={field.value ? "yes" : "no"}
							disabled={disabled}
							onChange={(value) => field.onChange(value === "yes")}
						/>
					)}
				/>

				{isScored ? (
					<span className="text-xs font-semibold text-(--color-text-secondary)">
						Max points: <span className="text-(--color-text-primary)">{maxScore}</span>
					</span>
				) : (
					<span className="text-xs text-(--color-text-secondary)">
						Not scored — captured as an observation with remarks.
					</span>
				)}
			</div>

			{isScored ? (
				<div className="mt-3 space-y-2">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-xs text-(--color-text-secondary)">
							Quick fill:
						</span>
						{SCORE_LEVEL_PRESETS.map((preset) => (
							<Button
								key={preset.id}
								text={preset.label}
								variant="outline"
								size="sm"
								disabled={disabled}
								onClick={() => replace(createScoreLevelsFromPreset(preset))}
							/>
						))}
					</div>

					<div
						className="hidden grid-cols-[88px_minmax(0,1fr)_36px] gap-2 px-0.5 text-xs font-semibold text-(--color-text-secondary) sm:grid"
						aria-hidden="true"
					>
						<span>Score ({TEMPLATE_SCORE_MIN}–{TEMPLATE_SCORE_MAX})</span>
						<span>Criteria for this score</span>
						<span />
					</div>

					<ul className="space-y-2">
						{fields.map((level, levelIndex) => {
							const rowErrors = Array.isArray(levelErrors)
								? levelErrors[levelIndex]
								: undefined;

							return (
								<li
									key={level.fieldKey}
									className="grid grid-cols-[72px_minmax(0,1fr)_36px] items-start gap-2 sm:grid-cols-[88px_minmax(0,1fr)_36px]"
								>
									<FormInput
										id={`${idPrefix}-score-${levelIndex}`}
										type="number"
										inputMode="numeric"
										min={TEMPLATE_SCORE_MIN}
										max={TEMPLATE_SCORE_MAX}
										step={1}
										aria-label={`Score for row ${levelIndex + 1}`}
										disabled={disabled}
										error={rowErrors?.score?.message}
										{...register(`${basePath}.scoreLevels.${levelIndex}.score`, {
											valueAsNumber: true,
										})}
									/>
									<FormInput
										id={`${idPrefix}-criteria-${levelIndex}`}
										placeholder="e.g. As per DIM"
										maxLength={SCORE_CRITERIA_MAX_LENGTH}
										aria-label={`Criteria for row ${levelIndex + 1}`}
										disabled={disabled}
										error={rowErrors?.criteria?.message}
										{...register(
											`${basePath}.scoreLevels.${levelIndex}.criteria`,
										)}
									/>
									<Button
										appearance="icon"
										variant="transparent"
										size="sm"
										Icon={Trash2}
										aria-label={`Remove score row ${levelIndex + 1}`}
										disabled={disabled}
										onClick={() => remove(levelIndex)}
									/>
								</li>
							);
						})}
					</ul>

					{matrixError ? (
						<p className="form-error-text" role="alert">
							{matrixError}
						</p>
					) : null}

					<Button
						text={
							nextScore === null
								? "All scores used"
								: `Add score ${nextScore}`
						}
						variant="outline"
						size="sm"
						Icon={Plus}
						disabled={!canAddLevel}
						onClick={() => {
							if (nextScore === null) return;
							append(createScoreLevel(nextScore));
						}}
					/>
				</div>
			) : null}
		</fieldset>
	);
}
