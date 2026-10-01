// modules/audit/shared/templates/audit-template.schemas.ts
//
// One zod schema per builder form:
//   • Details step  → createAuditTemplateDetailsSchema(detailFields)
//   • Build step    → createAuditTemplateBuildSchema(parameterFields)
// Each module passes its own field configs, so a Factory Audit
// "plant type" or a Dealer Audit "facility type" is validated here
// without the schema knowing either module exists.

import { z } from "zod";

import {
	PARAMETER_GUIDANCE_MAX_LENGTH,
	PARAMETER_TITLE_MAX_LENGTH,
	SCORE_CRITERIA_MAX_LENGTH,
	SECTION_NAME_MAX_LENGTH,
	TEMPLATE_DESCRIPTION_MAX_LENGTH,
	TEMPLATE_EVIDENCE_MAX_LIMIT,
	TEMPLATE_MAX_SCORE_LEVELS,
	TEMPLATE_MIN_SCORE_LEVELS,
	TEMPLATE_NAME_MAX_LENGTH,
	TEMPLATE_SCORE_MAX,
	TEMPLATE_SCORE_MIN,
} from "./audit-template.constants";
import type { AuditTemplateFieldConfig } from "./audit.template.types";

// Number inputs registered with `valueAsNumber` yield NaN when empty.
// NaN is accepted by the shape and rejected by the refinements below, so
// the rules only fire when they are relevant (e.g. evidence enabled).
const numberOrEmpty = z.number().or(z.nan());

// ── Configurable-field validation ─────────────────────────────────────

const validateConfiguredFields = (
	configs: readonly AuditTemplateFieldConfig[],
	values: Record<string, string>,
	ctx: z.RefinementCtx,
	basePath: ReadonlyArray<string | number>,
) => {
	for (const config of configs) {
		const value = (values[config.key] ?? "").trim();
		const path = [...basePath, config.key];

		if (!value) {
			if (config.required) {
				ctx.addIssue({
					code: "custom",
					path,
					message: `${config.label} is required`,
				});
			}
			continue;
		}

		if (
			config.type === "select" &&
			!config.options.some((option) => option.value === value)
		) {
			ctx.addIssue({
				code: "custom",
				path,
				message: `Select a valid ${config.label.toLowerCase()}`,
			});
		}

		if (
			config.type === "text" &&
			config.maxLength !== undefined &&
			value.length > config.maxLength
		) {
			ctx.addIssue({
				code: "custom",
				path,
				message: `${config.label} cannot exceed ${config.maxLength} characters`,
			});
		}
	}
};

// ── Details step ──────────────────────────────────────────────────────

export const auditTemplateDetailsSchemaShape = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Template name is required")
		.max(
			TEMPLATE_NAME_MAX_LENGTH,
			`Template name cannot exceed ${TEMPLATE_NAME_MAX_LENGTH} characters`,
		),
	description: z
		.string()
		.trim()
		.max(
			TEMPLATE_DESCRIPTION_MAX_LENGTH,
			`Description cannot exceed ${TEMPLATE_DESCRIPTION_MAX_LENGTH} characters`,
		),
	fields: z.record(z.string(), z.string()),
});

export const createAuditTemplateDetailsSchema = (
	detailFields: readonly AuditTemplateFieldConfig[],
) =>
	auditTemplateDetailsSchemaShape.superRefine((values, ctx) => {
		validateConfiguredFields(detailFields, values.fields, ctx, ["fields"]);
	});

// ── Scoring matrix ────────────────────────────────────────────────────

export const auditTemplateScoreLevelSchema = z.object({
	id: z.string(),
	score: numberOrEmpty,
	criteria: z.string(),
});

type ScoreLevelShape = z.infer<typeof auditTemplateScoreLevelSchema>;

/**
 * Rules for a scored parameter. Exported separately so it can be unit
 * tested and reused by execution-side validation later.
 */
export const validateScoreLevels = (
	levels: readonly ScoreLevelShape[],
	ctx: z.RefinementCtx,
	basePath: ReadonlyArray<string | number>,
) => {
	if (levels.length < TEMPLATE_MIN_SCORE_LEVELS) {
		ctx.addIssue({
			code: "custom",
			path: [...basePath],
			message: `Add at least ${TEMPLATE_MIN_SCORE_LEVELS} score levels`,
		});
	}

	if (levels.length > TEMPLATE_MAX_SCORE_LEVELS) {
		ctx.addIssue({
			code: "custom",
			path: [...basePath],
			message: `A parameter can have at most ${TEMPLATE_MAX_SCORE_LEVELS} score levels`,
		});
	}

	const seenScores = new Map<number, number>();

	levels.forEach((level, index) => {
		const scorePath = [...basePath, index, "score"];
		const criteriaPath = [...basePath, index, "criteria"];

		if (Number.isNaN(level.score)) {
			ctx.addIssue({ code: "custom", path: scorePath, message: "Enter a score" });
		} else if (!Number.isInteger(level.score)) {
			ctx.addIssue({
				code: "custom",
				path: scorePath,
				message: "Use whole numbers only",
			});
		} else if (
			level.score < TEMPLATE_SCORE_MIN ||
			level.score > TEMPLATE_SCORE_MAX
		) {
			ctx.addIssue({
				code: "custom",
				path: scorePath,
				message: `Score must be between ${TEMPLATE_SCORE_MIN} and ${TEMPLATE_SCORE_MAX}`,
			});
		} else if (seenScores.has(level.score)) {
			ctx.addIssue({
				code: "custom",
				path: scorePath,
				message: `Score ${level.score} is already used`,
			});
		} else {
			seenScores.set(level.score, index);
		}

		const criteria = level.criteria.trim();
		if (!criteria) {
			ctx.addIssue({
				code: "custom",
				path: criteriaPath,
				message: "Describe what earns this score",
			});
		} else if (criteria.length > SCORE_CRITERIA_MAX_LENGTH) {
			ctx.addIssue({
				code: "custom",
				path: criteriaPath,
				message: `Criteria cannot exceed ${SCORE_CRITERIA_MAX_LENGTH} characters`,
			});
		}
	});
};

// ── Parameter ─────────────────────────────────────────────────────────

export const auditTemplateParameterSchema = z.object({
	/** Client key for React / field arrays. Never sent to the server. */
	id: z.string(),
	/** Persisted id — null until the server has created the parameter. */
	serverId: z.string().nullable(),
	title: z
		.string()
		.trim()
		.min(1, "Parameter title is required")
		.max(
			PARAMETER_TITLE_MAX_LENGTH,
			`Title cannot exceed ${PARAMETER_TITLE_MAX_LENGTH} characters`,
		),
	guidance: z
		.string()
		.trim()
		.max(
			PARAMETER_GUIDANCE_MAX_LENGTH,
			`Guidance cannot exceed ${PARAMETER_GUIDANCE_MAX_LENGTH} characters`,
		),
	attributes: z.record(z.string(), z.string()),
	isScored: z.boolean(),
	scoreLevels: z.array(auditTemplateScoreLevelSchema),
	evidenceRequired: z.boolean(),
	minEvidenceCount: numberOrEmpty,
	maxEvidenceCount: numberOrEmpty,
});

type ParameterShape = z.infer<typeof auditTemplateParameterSchema>;

const validateEvidence = (parameter: ParameterShape, ctx: z.RefinementCtx) => {
	if (!parameter.evidenceRequired) return;

	const { minEvidenceCount: min, maxEvidenceCount: max } = parameter;

	if (Number.isNaN(min) || !Number.isInteger(min) || min < 1) {
		ctx.addIssue({
			code: "custom",
			path: ["minEvidenceCount"],
			message: "Minimum photos must be at least 1",
		});
	}

	if (
		Number.isNaN(max) ||
		!Number.isInteger(max) ||
		max > TEMPLATE_EVIDENCE_MAX_LIMIT
	) {
		ctx.addIssue({
			code: "custom",
			path: ["maxEvidenceCount"],
			message: `Maximum photos must be between 1 and ${TEMPLATE_EVIDENCE_MAX_LIMIT}`,
		});
	} else if (!Number.isNaN(min) && max < min) {
		ctx.addIssue({
			code: "custom",
			path: ["maxEvidenceCount"],
			message: "Maximum cannot be less than minimum",
		});
	}
};

export const createAuditTemplateParameterSchema = (
	parameterFields: readonly AuditTemplateFieldConfig[],
) =>
	auditTemplateParameterSchema.superRefine((parameter, ctx) => {
		validateConfiguredFields(
			parameterFields,
			parameter.attributes,
			ctx,
			["attributes"],
		);
		if (parameter.isScored) {
			validateScoreLevels(parameter.scoreLevels, ctx, ["scoreLevels"]);
		}
		validateEvidence(parameter, ctx);
	});

// ── Section / Build step ──────────────────────────────────────────────

const sectionBase = {
	id: z.string(),
	serverId: z.string().nullable(),
	name: z
		.string()
		.trim()
		.min(1, "Section name is required")
		.max(
			SECTION_NAME_MAX_LENGTH,
			`Section name cannot exceed ${SECTION_NAME_MAX_LENGTH} characters`,
		),
};

export const auditTemplateSectionSchema = z.object({
	...sectionBase,
	parameters: z
		.array(auditTemplateParameterSchema)
		.min(1, "Add at least one parameter to this section"),
});

export const auditTemplateBuildSchemaShape = z.object({
	sections: z
		.array(auditTemplateSectionSchema)
		.min(1, "Add at least one section"),
});

const validateUniqueSectionNames = (
	sections: ReadonlyArray<{ name: string }>,
	ctx: z.RefinementCtx,
) => {
	const seen = new Set<string>();
	sections.forEach((section, index) => {
		const key = section.name.trim().toLowerCase();
		if (!key) return;
		if (seen.has(key)) {
			ctx.addIssue({
				code: "custom",
				path: ["sections", index, "name"],
				message: "Another section already uses this name",
			});
		}
		seen.add(key);
	});
};

export const createAuditTemplateBuildSchema = (
	parameterFields: readonly AuditTemplateFieldConfig[],
) =>
	z
		.object({
			sections: z
				.array(
					z.object({
						...sectionBase,
						parameters: z
							.array(createAuditTemplateParameterSchema(parameterFields))
							.min(1, "Add at least one parameter to this section"),
					}),
				)
				.min(1, "Add at least one section"),
		})
		.superRefine((values, ctx) => {
			validateUniqueSectionNames(values.sections, ctx);
		});
