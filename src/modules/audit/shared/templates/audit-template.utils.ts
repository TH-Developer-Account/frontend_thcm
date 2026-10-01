// modules/audit/shared/templates/audit-template.utils.ts
//
// Pure helpers for the template builder — no React, no API.

import {
	TEMPLATE_DEFAULT_MAX_EVIDENCE,
	TEMPLATE_DEFAULT_MIN_EVIDENCE,
	TEMPLATE_SCORE_MAX,
	TEMPLATE_SCORE_MIN,
	type ScoreLevelPreset,
} from "./audit-template.constants";
import type {
	AuditTemplateBuilderValues,
	AuditTemplateDetailsFormValues,
	AuditTemplateFieldConfig,
	AuditTemplateParameterFormValues,
	AuditTemplateScoreLevelFormValues,
	AuditTemplateSectionFormValues,
	AuditTemplateSummary,
} from "./audit.template.types";

export const createClientId = (): string => crypto.randomUUID();

export const createEmptyFieldValues = (
	configs: readonly AuditTemplateFieldConfig[],
): Record<string, string> =>
	Object.fromEntries(configs.map((config) => [config.key, ""]));

export const createScoreLevel = (
	score: number,
	criteria = "",
): AuditTemplateScoreLevelFormValues => ({
	id: createClientId(),
	score,
	criteria,
});

export const createScoreLevelsFromPreset = (
	preset: ScoreLevelPreset,
): AuditTemplateScoreLevelFormValues[] =>
	preset.levels.map((level) => createScoreLevel(level.score, level.criteria));

export const createEmptyParameter = (
	parameterFields: readonly AuditTemplateFieldConfig[],
): AuditTemplateParameterFormValues => ({
	id: createClientId(),
	serverId: null,
	title: "",
	guidance: "",
	attributes: createEmptyFieldValues(parameterFields),
	isScored: true,
	scoreLevels: [createScoreLevel(5, "Yes"), createScoreLevel(0, "No")],
	evidenceRequired: false,
	minEvidenceCount: TEMPLATE_DEFAULT_MIN_EVIDENCE,
	maxEvidenceCount: TEMPLATE_DEFAULT_MAX_EVIDENCE,
});

export const createEmptySection = (
	parameterFields: readonly AuditTemplateFieldConfig[],
): AuditTemplateSectionFormValues => ({
	id: createClientId(),
	serverId: null,
	name: "",
	parameters: [createEmptyParameter(parameterFields)],
});

export const createEmptyDetails = (
	detailFields: readonly AuditTemplateFieldConfig[],
): AuditTemplateDetailsFormValues => ({
	name: "",
	description: "",
	fields: createEmptyFieldValues(detailFields),
});

export const createEmptyBuilderValues = (
	detailFields: readonly AuditTemplateFieldConfig[],
	parameterFields: readonly AuditTemplateFieldConfig[],
): AuditTemplateBuilderValues => ({
	details: createEmptyDetails(detailFields),
	sections: [createEmptySection(parameterFields)],
});

// ── Scoring helpers ───────────────────────────────────────────────────

const isValidScore = (score: number): boolean =>
	Number.isInteger(score) &&
	score >= TEMPLATE_SCORE_MIN &&
	score <= TEMPLATE_SCORE_MAX;

/** Highest unused score, so "Add score" fills the natural next row. */
export const getNextAvailableScore = (
	levels: ReadonlyArray<Pick<AuditTemplateScoreLevelFormValues, "score">>,
): number | null => {
	const used = new Set(levels.map((level) => level.score));
	for (let score = TEMPLATE_SCORE_MAX; score >= TEMPLATE_SCORE_MIN; score -= 1) {
		if (!used.has(score)) return score;
	}
	return null;
};

/** Max achievable points for a parameter (0 when not scored). */
export const getParameterMaxScore = (
	parameter: Pick<AuditTemplateParameterFormValues, "isScored" | "scoreLevels">,
): number => {
	if (!parameter.isScored) return 0;
	const scores = parameter.scoreLevels
		.map((level) => level.score)
		.filter(isValidScore);
	return scores.length ? Math.max(...scores) : 0;
};

/** Highest score first — the order reviewers read a rubric. */
export const sortScoreLevels = <T extends { score: number }>(
	levels: readonly T[],
): T[] => [...levels].sort((a, b) => b.score - a.score);

// ── Summary ───────────────────────────────────────────────────────────

export const deriveTemplateSummary = (
	sections: readonly AuditTemplateSectionFormValues[],
): AuditTemplateSummary => {
	const perSection = sections.map((section, index) => {
		const parameters = section.parameters ?? [];
		return {
			sectionId: section.id,
			name: section.name.trim() || `Section ${index + 1}`,
			parameterCount: parameters.length,
			scoredParameterCount: parameters.filter((p) => p.isScored).length,
			points: parameters.reduce(
				(sum, parameter) => sum + getParameterMaxScore(parameter),
				0,
			),
		};
	});

	const allParameters = sections.flatMap((section) => section.parameters ?? []);

	return {
		sectionCount: sections.length,
		parameterCount: allParameters.length,
		scoredParameterCount: allParameters.filter((p) => p.isScored).length,
		evidenceParameterCount: allParameters.filter((p) => p.evidenceRequired)
			.length,
		totalPoints: perSection.reduce((sum, section) => sum + section.points, 0),
		perSection,
	};
};

// ── Error helpers ─────────────────────────────────────────────────────

type MaybeArrayError =
	| { message?: string; root?: { message?: string } }
	| undefined;

/**
 * Array-level zod issues (e.g. "Add at least one section") land on
 * `errors.x.root` when the path is a registered field array and on
 * `errors.x` otherwise — read both.
 */
export const getArrayErrorMessage = (error: unknown): string | undefined => {
	const candidate = error as MaybeArrayError;
	return candidate?.root?.message ?? candidate?.message;
};

export const getFieldOptionLabel = (
	config: AuditTemplateFieldConfig,
	value: string | undefined,
): string => {
	if (!value) return "";
	if (config.type !== "select") return value;
	return config.options.find((option) => option.value === value)?.label ?? value;
};
