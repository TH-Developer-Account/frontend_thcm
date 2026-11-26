// modules/audit/shared/useAuditTemplateSections.ts
import { useCallback, useState } from "react";
import type {
	AuditTemplateSection,
	AuditTemplateParameter,
} from "../shared.audit.types";

const createEmptyParameter = (order: number): AuditTemplateParameter => ({
	id: crypto.randomUUID(),
	order,
	title: "",
	criteria: "",
	scoreMin: 0,
	scoreMax: 5,
	weight: 1,
	evidenceRequired: false,
	minEvidenceCount: null,
	maxEvidenceCount: null,
});

const createEmptySection = (order: number): AuditTemplateSection => ({
	id: crypto.randomUUID(),
	order,
	name: "",
	parameters: [createEmptyParameter(0)],
});

const reorder = <T extends { order: number }>(
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

export function useAuditTemplateSections(initial?: AuditTemplateSection[]) {
	const [sections, setSections] = useState<AuditTemplateSection[]>(
		initial ?? [createEmptySection(0)],
	);

	const addSection = useCallback(() => {
		setSections((current) => [...current, createEmptySection(current.length)]);
	}, []);

	const updateSection = useCallback(
		(sectionId: string, patch: Partial<AuditTemplateSection>) => {
			setSections((current) =>
				current.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
			);
		},
		[],
	);

	const removeSection = useCallback((sectionId: string) => {
		setSections((current) => current.filter((s) => s.id !== sectionId));
	}, []);

	const addParameter = useCallback((sectionId: string) => {
		setSections((current) =>
			current.map((s) =>
				s.id !== sectionId
					? s
					: {
							...s,
							parameters: [
								...s.parameters,
								createEmptyParameter(s.parameters.length),
							],
						},
			),
		);
	}, []);

	const updateParameter = useCallback(
		(
			sectionId: string,
			parameterId: string,
			patch: Partial<AuditTemplateParameter>,
		) => {
			setSections((current) =>
				current.map((s) =>
					s.id !== sectionId
						? s
						: {
								...s,
								parameters: s.parameters.map((p) =>
									p.id === parameterId ? { ...p, ...patch } : p,
								),
							},
				),
			);
		},
		[],
	);

	const removeParameter = useCallback(
		(sectionId: string, parameterId: string) => {
			setSections((current) =>
				current.map((s) =>
					s.id !== sectionId
						? s
						: {
								...s,
								parameters: s.parameters.filter((p) => p.id !== parameterId),
							},
				),
			);
		},
		[],
	);

	const moveParameter = useCallback(
		(sectionId: string, parameterIndex: number, direction: "up" | "down") => {
			setSections((current) =>
				current.map((s) =>
					s.id !== sectionId
						? s
						: {
								...s,
								parameters: reorder(s.parameters, parameterIndex, direction),
							},
				),
			);
		},
		[],
	);

	return {
		sections,
		setSections,
		addSection,
		updateSection,
		removeSection,
		addParameter,
		updateParameter,
		removeParameter,
		moveParameter,
	};
}
