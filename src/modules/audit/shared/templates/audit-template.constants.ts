// modules/audit/shared/templates/audit-template.constants.ts

/** Allowed score range for any checklist parameter. */
export const TEMPLATE_SCORE_MIN = 0;
export const TEMPLATE_SCORE_MAX = 5;

/** One row per possible score value (0–5). */
export const TEMPLATE_MAX_SCORE_LEVELS =
	TEMPLATE_SCORE_MAX - TEMPLATE_SCORE_MIN + 1;
export const TEMPLATE_MIN_SCORE_LEVELS = 2;

export const TEMPLATE_EVIDENCE_MAX_LIMIT = 10;
export const TEMPLATE_DEFAULT_MIN_EVIDENCE = 1;
export const TEMPLATE_DEFAULT_MAX_EVIDENCE = 3;

export const TEMPLATE_NAME_MAX_LENGTH = 120;
export const TEMPLATE_DESCRIPTION_MAX_LENGTH = 500;
export const SECTION_NAME_MAX_LENGTH = 120;
export const PARAMETER_TITLE_MAX_LENGTH = 250;
export const PARAMETER_GUIDANCE_MAX_LENGTH = 1000;
export const SCORE_CRITERIA_MAX_LENGTH = 250;

export interface ScoreLevelPreset {
	id: string;
	label: string;
	levels: ReadonlyArray<{ score: number; criteria: string }>;
}

/**
 * Quick-start presets for the scoring matrix. They only prefill rows —
 * the admin can still edit scores, criteria text, add or remove rows.
 */
export const SCORE_LEVEL_PRESETS: readonly ScoreLevelPreset[] = [
	{
		id: "yes-no",
		label: "Yes / No (5 · 0)",
		levels: [
			{ score: 5, criteria: "Yes" },
			{ score: 0, criteria: "No" },
		],
	},
	{
		id: "dim-3-step",
		label: "3-step (5 · 3 · 0)",
		levels: [
			{ score: 5, criteria: "As per DIM" },
			{ score: 3, criteria: "Not as per DIM, but well maintained" },
			{ score: 0, criteria: "Else" },
		],
	},
	{
		id: "full-0-5",
		label: "Full scale (0 – 5)",
		levels: [
			{ score: 5, criteria: "" },
			{ score: 4, criteria: "" },
			{ score: 3, criteria: "" },
			{ score: 2, criteria: "" },
			{ score: 1, criteria: "" },
			{ score: 0, criteria: "" },
		],
	},
];
