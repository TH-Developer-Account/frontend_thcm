import type {
	AuditTemplateSection,
	AuditTemplateParameter,
	AuditTemplateItem,
} from "../shared/shared.audit.types";
import type {
	ChecklistItemFormValues,
	DealerAuditChecklist,
	UpdateChecklistItemPayload,
} from "./dealer-audit.types";
import type { ChecklistTemplateFormValues } from "./dealer-audit.types";

const DEFAULT_SCORE_MIN = 0;
const DEFAULT_SCORE_MAX = 5;

export const createEmptyParameter = (
	order: number,
): AuditTemplateParameter => ({
	id: crypto.randomUUID(),
	order,
	title: "",
	description: "",
	scoreMin: DEFAULT_SCORE_MIN,
	scoreMax: DEFAULT_SCORE_MAX,
	weight: 1,
	evidenceRequired: false,
	minEvidenceCount: null,
	maxEvidenceCount: null,
});

export const createEmptySection = (order: number): AuditTemplateSection => ({
	id: crypto.randomUUID(),
	order,
	name: "",
	parameters: [createEmptyParameter(0)],
});

export const reorderList = <T extends { order: number }>(
	list: T[],
	fromIndex: number,
	direction: "up" | "down",
): T[] => {
	const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
	if (toIndex < 0 || toIndex >= list.length) return list;
	const next = [...list];
	[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
	return next.map((item, index) => ({ ...item, order: index }));
};

export const deriveTemplateSummary = (
	sections: AuditTemplateSection[],
): ChecklistTemplateSummary => {
	const perSection = sections.map((section) => {
		const points = section.parameters.reduce(
			(sum, parameter) => sum + parameter.scoreMax * parameter.weight,
			0,
		);
		return {
			sectionId: section.id,
			name: section.name || "Untitled section",
			parameterCount: section.parameters.length,
			points,
		};
	});

	return {
		sectionCount: sections.length,
		parameterCount: sections.reduce((sum, s) => sum + s.parameters.length, 0),
		totalPoints: perSection.reduce((sum, s) => sum + s.points, 0),
		perSection,
	};
};

export const isParameterValid = (parameter: AuditTemplateParameter): boolean =>
	parameter.title.trim().length > 0;

export const isSectionValid = (section: AuditTemplateSection): boolean =>
	section.name.trim().length > 0 && section.parameters.some(isParameterValid);

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

// ─────────────────────────────────────────────────────────────────────
// Checklist Template — response → form mapper
// ─────────────────────────────────────────────────────────────────────

export const mapTemplateToFormValues = (
	template: ChecklistTemplate,
): ChecklistTemplateFormValues => ({
	name: template.name,
	description: template.description,
	auditCategory: template.auditCategory,
	facilityType: template.facilityType,
	sections: template.sections,
});
