import { useCallback, useState } from "react";
import type {
	ChecklistTemplateFormValues,
	TemplateParameterDraft,
	TemplateSectionDraft,
} from "../dealer-audit.types";

// Simple id generator — good enough for local draft state; the backend
// will assign real IDs on save. Swap for crypto.randomUUID() if your
// target browsers support it, or a shared id util if the project has one.
let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

const createEmptyParameter = (): TemplateParameterDraft => ({
	id: nextId("param"),
	title: "",
	criteria: [""],
	tags: [],
	requiresPhoto: true,
	requiresRemarks: false,
	minScore: 0,
	maxScore: 5,
	weight: 1,
});

const createEmptySection = (): TemplateSectionDraft => ({
	id: nextId("section"),
	name: "",
	parameters: [createEmptyParameter()],
});

const createEmptyForm = (): ChecklistTemplateFormValues => ({
	title: "",
	description: "",
	facilityType: "",
	sections: [createEmptySection()],
});

export function useChecklistTemplateBuilder(
	initial?: ChecklistTemplateFormValues,
) {
	const [form, setForm] = useState<ChecklistTemplateFormValues>(
		initial ?? createEmptyForm(),
	);

	// ── Template-level fields ──────────────────────────────────────────
	const setField = useCallback(
		<K extends keyof ChecklistTemplateFormValues>(
			key: K,
			value: ChecklistTemplateFormValues[K],
		) => {
			setForm((current) => ({ ...current, [key]: value }));
		},
		[],
	);

	// ── Sections ────────────────────────────────────────────────────────
	const addSection = useCallback(() => {
		setForm((current) => ({
			...current,
			sections: [...current.sections, createEmptySection()],
		}));
	}, []);

	const updateSection = useCallback(
		(
			sectionId: string,
			patch: Partial<Omit<TemplateSectionDraft, "id" | "parameters">>,
		) => {
			setForm((current) => ({
				...current,
				sections: current.sections.map((section) =>
					section.id === sectionId ? { ...section, ...patch } : section,
				),
			}));
		},
		[],
	);

	const removeSection = useCallback((sectionId: string) => {
		setForm((current) => ({
			...current,
			sections: current.sections.filter((section) => section.id !== sectionId),
		}));
	}, []);

	// ── Parameters (nested inside a section) ─────────────────────────────
	const addParameter = useCallback((sectionId: string) => {
		setForm((current) => ({
			...current,
			sections: current.sections.map((section) =>
				section.id === sectionId
					? {
							...section,
							parameters: [...section.parameters, createEmptyParameter()],
						}
					: section,
			),
		}));
	}, []);

	const updateParameter = useCallback(
		(
			sectionId: string,
			parameterId: string,
			patch: Partial<Omit<TemplateParameterDraft, "id">>,
		) => {
			setForm((current) => ({
				...current,
				sections: current.sections.map((section) =>
					section.id !== sectionId
						? section
						: {
								...section,
								parameters: section.parameters.map((parameter) =>
									parameter.id === parameterId
										? { ...parameter, ...patch }
										: parameter,
								),
							},
				),
			}));
		},
		[],
	);

	const removeParameter = useCallback(
		(sectionId: string, parameterId: string) => {
			setForm((current) => ({
				...current,
				sections: current.sections.map((section) =>
					section.id !== sectionId
						? section
						: {
								...section,
								parameters: section.parameters.filter(
									(parameter) => parameter.id !== parameterId,
								),
							},
				),
			}));
		},
		[],
	);

	// ── Criteria list items (nested inside a parameter) ──────────────────
	const addCriterion = useCallback((sectionId: string, parameterId: string) => {
		setForm((current) => ({
			...current,
			sections: current.sections.map((section) =>
				section.id !== sectionId
					? section
					: {
							...section,
							parameters: section.parameters.map((parameter) =>
								parameter.id !== parameterId
									? parameter
									: { ...parameter, criteria: [...parameter.criteria, ""] },
							),
						},
			),
		}));
	}, []);

	const updateCriterion = useCallback(
		(sectionId: string, parameterId: string, index: number, value: string) => {
			setForm((current) => ({
				...current,
				sections: current.sections.map((section) =>
					section.id !== sectionId
						? section
						: {
								...section,
								parameters: section.parameters.map((parameter) =>
									parameter.id !== parameterId
										? parameter
										: {
												...parameter,
												criteria: parameter.criteria.map((criterion, i) =>
													i === index ? value : criterion,
												),
											},
								),
							},
				),
			}));
		},
		[],
	);

	const removeCriterion = useCallback(
		(sectionId: string, parameterId: string, index: number) => {
			setForm((current) => ({
				...current,
				sections: current.sections.map((section) =>
					section.id !== sectionId
						? section
						: {
								...section,
								parameters: section.parameters.map((parameter) =>
									parameter.id !== parameterId
										? parameter
										: {
												...parameter,
												criteria: parameter.criteria.filter(
													(_, i) => i !== index,
												),
											},
								),
							},
				),
			}));
		},
		[],
	);

	// ── Derived summary — used by the preview card and readiness bar ────
	const sectionCount = form.sections.length;
	const pointCount = form.sections.reduce(
		(total, section) => total + section.parameters.length,
		0,
	);

	return {
		form,
		setField,
		addSection,
		updateSection,
		removeSection,
		addParameter,
		updateParameter,
		removeParameter,
		addCriterion,
		updateCriterion,
		removeCriterion,
		sectionCount,
		pointCount,
	};
}
