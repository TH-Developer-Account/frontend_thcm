// modules/audit/shared/AuditTemplate-template-builder.context.tsx
import { createContext, useContext, type ReactNode } from "react";
import type {
	AuditTemplateSection,
	AuditTemplateParameter,
} from "../shared.audit.types";

interface TemplateBuilderContextValue {
	sections: AuditTemplateSection[];
	updateSection: (
		sectionId: string,
		patch: Partial<AuditTemplateSection>,
	) => void;
	removeSection: (sectionId: string) => void;
	addSection: () => void;
	updateParameter: (
		sectionId: string,
		parameterId: string,
		patch: Partial<AuditTemplateParameter>,
	) => void;
	removeParameter: (sectionId: string, parameterId: string) => void;
	addParameter: (sectionId: string) => void;
	moveParameter: (
		sectionId: string,
		parameterIndex: number,
		direction: "up" | "down",
	) => void;
}

const TemplateBuilderContext =
	createContext<TemplateBuilderContextValue | null>(null);

export function AuditTemplateBuilderProvider({
	value,
	children,
}: {
	value: TemplateBuilderContextValue;
	children: ReactNode;
}) {
	return (
		<TemplateBuilderContext.Provider value={value}>
			{children}
		</TemplateBuilderContext.Provider>
	);
}

// AuditTemplateTemplateSectionCard → AuditTemplateTemplateParameterEditor no longer
// need onChange/onRemove/onMove passed down two levels — each calls this.
export function useAuditTemplateBuilder() {
	const ctx = useContext(TemplateBuilderContext);
	if (!ctx) {
		throw new Error(
			"useAuditTemplateBuilder must be used inside AuditTemplateBuilderProvider",
		);
	}
	return ctx;
}
