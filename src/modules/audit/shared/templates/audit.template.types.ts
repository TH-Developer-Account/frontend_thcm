// modules/audit/shared/templates/audit.template.types.ts
//
// Builder-side contracts shared by Dealer Audit and Factory Audit.
// Nothing here knows about either module's database schema — each module
// maps its own API response/payload to and from these shapes in its own
// mapper file (see dealerAudit/templates, factoryAudit/templates).

import type { z } from "zod";

import type {
	auditTemplateBuildSchemaShape,
	auditTemplateDetailsSchemaShape,
	auditTemplateParameterSchema,
	auditTemplateScoreLevelSchema,
	auditTemplateSectionSchema,
} from "./audit-template.schemas";

export type {
	AuditModuleCapabilities,
	AuditModuleKey,
} from "../shared.audit.types";

// ── Lifecycle ─────────────────────────────────────────────────────────

export type TemplateLifecycleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

// ── Configurable fields ───────────────────────────────────────────────
//
// Modules declare extra dropdown / text fields (facility type, audit
// category, plant, function area, severity …) as config. The builder
// renders them and the zod schema validates them — no module-specific
// field is hardcoded into shared components.

export interface AuditTemplateFieldOption {
	value: string;
	label: string;
}

interface AuditTemplateFieldConfigBase {
	/** Key stored in `fields` (template) or `attributes` (parameter). */
	key: string;
	label: string;
	required?: boolean;
	placeholder?: string;
	helperText?: string;
	/** Grid span inside the details card. Defaults to 1 (half width on ≥sm). */
	span?: 1 | 2;
}

export interface AuditTemplateSelectFieldConfig
	extends AuditTemplateFieldConfigBase {
	type: "select";
	options: readonly AuditTemplateFieldOption[];
}

export interface AuditTemplateTextFieldConfig
	extends AuditTemplateFieldConfigBase {
	type: "text";
	maxLength?: number;
}

export type AuditTemplateFieldConfig =
	| AuditTemplateSelectFieldConfig
	| AuditTemplateTextFieldConfig;

// ── Form values (inferred from the zod schemas — single source of truth) ──

export type AuditTemplateScoreLevelFormValues = z.infer<
	typeof auditTemplateScoreLevelSchema
>;
export type AuditTemplateParameterFormValues = z.infer<
	typeof auditTemplateParameterSchema
>;
export type AuditTemplateSectionFormValues = z.infer<
	typeof auditTemplateSectionSchema
>;
export type AuditTemplateDetailsFormValues = z.infer<
	typeof auditTemplateDetailsSchemaShape
>;
export type AuditTemplateBuildFormValues = z.infer<
	typeof auditTemplateBuildSchemaShape
>;

/** Everything the builder produces — handed to the module's mapper. */
export interface AuditTemplateBuilderValues {
	details: AuditTemplateDetailsFormValues;
	sections: AuditTemplateSectionFormValues[];
}

// ── Derived summary (outline panel / review / listing) ────────────────

export interface AuditTemplateSectionSummary {
	sectionId: string;
	name: string;
	parameterCount: number;
	scoredParameterCount: number;
	points: number;
}

export interface AuditTemplateSummary {
	sectionCount: number;
	parameterCount: number;
	scoredParameterCount: number;
	evidenceParameterCount: number;
	totalPoints: number;
	perSection: AuditTemplateSectionSummary[];
}

// ── Listing row (shared data table) ───────────────────────────────────

export interface AuditTemplateListRow {
	id: string;
	name: string;
	description: string;
	status: TemplateLifecycleStatus;
	version: number;
	sectionCount: number;
	parameterCount: number;
	totalPoints: number;
	updatedAt: string | null;
	updatedByName: string | null;
	/** Module-specific display values keyed by field config key. */
	fieldLabels: Record<string, string>;
}

export type AuditTemplateSortField =
	| "name"
	| "status"
	| "version"
	| "updatedAt";

export type SortOrder = "asc" | "desc";
