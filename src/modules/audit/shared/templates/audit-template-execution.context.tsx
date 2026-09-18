// modules/audit/shared/AuditTemplate-execution.context.tsx
import { createContext, useContext, type ReactNode } from "react";
import type {
	AuditInstance,
	AuditModuleCapabilities,
	AuditTemplateParameter,
} from "../shared.audit.types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AuditTemplateExecutionContextValue {
	instance: AuditInstance;
	capabilities: AuditModuleCapabilities;
	permissions: {
		canEditSelfAssessment: boolean;
		canReview: boolean;
	};
	saveStatusByItemId: Record<string, SaveStatus>;
	saveParameter: (
		itemId: string,
		patch: Partial<AuditTemplateParameter>,
	) => void;
}

const AuditTemplateExecutionContext =
	createContext<AuditTemplateExecutionContextValue | null>(null);

export function AuditTemplateExecutionProvider({
	value,
	children,
}: {
	value: AuditTemplateExecutionContextValue;
	children: ReactNode;
}) {
	return (
		<AuditTemplateExecutionContext.Provider value={value}>
			{children}
		</AuditTemplateExecutionContext.Provider>
	);
}

/**
 * AuditTemplateItemView, ScoreSelector, LivePhotoUploadField and any card
 * nested under them call this directly instead of receiving
 * onScoreChange/onEvidenceChange/permissions threaded down as props.
 */
export function useAuditTemplateExecution() {
	const ctx = useContext(AuditTemplateExecutionContext);
	if (!ctx) {
		throw new Error(
			"useAuditTemplateExecution must be used inside AuditTemplateExecutionProvider",
		);
	}
	return ctx;
}
