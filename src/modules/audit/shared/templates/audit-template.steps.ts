// modules/audit/shared/templates/audit-template.steps.ts

export type AuditTemplateBuilderStep = "details" | "build" | "review";

export const AUDIT_TEMPLATE_STEP_ORDER: readonly AuditTemplateBuilderStep[] = [
	"details",
	"build",
	"review",
];

const STEP_LABEL: Record<AuditTemplateBuilderStep, string> = {
	details: "Details",
	build: "Build checklist",
	review: "Review & publish",
};

/** Shape expected by StepProgress (ids are 1-based). */
export const AUDIT_TEMPLATE_PROGRESS_STEPS = AUDIT_TEMPLATE_STEP_ORDER.map(
	(step, index) => ({ id: index + 1, label: STEP_LABEL[step] }),
);
