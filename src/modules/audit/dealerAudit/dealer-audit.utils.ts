// modules/audit/dealerAudit/dealer-audit.utils.ts
//
// Template-builder helpers (createEmptyParameter, createEmptySection,
// reorderList, deriveTemplateSummary, isParameterValid, isSectionValid,
// mapTemplateToFormValues) moved to:
//   • shared/templates/audit-template.utils.ts    (builder helpers)
//   • dealerAudit/templates/dealer-template.mappers.ts (response ⇄ form)
//
// Execution-side helpers below are unchanged — they are migrated to the
// dual-score model on Day 12.

import type { AuditTemplateItem } from "../shared/shared.audit.types";
import type {
	ChecklistItemFormValues,
	DealerAuditChecklist,
	UpdateChecklistItemPayload,
} from "./dealer-audit.types";

export const flattenChecklist = (checklist: DealerAuditChecklist) =>
	checklist.categories
		.flatMap((category) => category.items)
		.sort((a, b) => a.sequence - b.sequence);

export const getAuditProgress = (checklist: DealerAuditChecklist) => {
	const items = flattenChecklist(checklist);
	const completed = items.filter((item) => item.status === "COMPLETED").length;
	return {
		completed,
		total: items.length,
		percentage: items.length ? Math.round((completed / items.length) * 100) : 0,
	};
};

export const mapChecklistItemToForm = (
	item: AuditTemplateItem,
): ChecklistItemFormValues => ({
	score: item.selfScore,
	remarks: item.selfRemarks,
	evidence: item.evidence,
});

export const mapChecklistFormToPayload = (
	form: ChecklistItemFormValues,
): UpdateChecklistItemPayload => ({
	...form,
	status: form.score !== null ? "COMPLETED" : "PENDING",
});
