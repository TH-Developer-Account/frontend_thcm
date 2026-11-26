import type {
	AuditChecklistItem,
	AuditItemSelf,
} from "../audit-execution.types";

export const makeSelf = (
	overrides: Partial<AuditItemSelf> = {},
): AuditItemSelf => ({
	score: null,
	remarks: "",
	evidence: [],
	answeredAt: null,
	isComplete: false,
	...overrides,
});

export const makeItem = (
	overrides: Partial<AuditChecklistItem> = {},
): AuditChecklistItem => ({
	id: "item-1",
	sequence: 1,
	sectionId: "s1",
	sectionName: "Section",
	title: "Parameter",
	guidance: "",
	criteria: [],
	category: null,
	functionArea: null,
	isScored: true,
	scoreLevels: [],
	allowedScores: [],
	minScore: 0,
	maxScore: 5,
	evidenceRequired: false,
	minEvidenceCount: 0,
	maxEvidenceCount: 0,
	self: makeSelf(),
	review: null,
	clarification: null,
	...overrides,
});
