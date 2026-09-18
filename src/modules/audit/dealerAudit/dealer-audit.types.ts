// modules/audit/dealer-audit/dealer-audit.types.ts

import type { ChecklistTemplateStatus } from "../shared/checklist/ChecklistCard";
import type {
	AuditEvidence,
	AuditTemplateSection,
	AuditTemplateStatus,
} from "../shared/shared.audit.types";
import type { ChecklistTemplateParameter } from "./checklist-library.constants";

// ── Roles ─────────────────────────────────────────────────────────────

export type DealerAuditRole =
	| "ADMIN"
	| "DEALER"
	| "REVIEWER"
	| "REVIEWER_MANAGER"
	| "APPROVER"
	| "AUDIT_MANAGER"
	| "READ_ONLY";

// ── Dealer Audit Checklist instance (dealer-specific display wrapper) ──

export type DealerAuditChecklist = {
	auditId: string;
	dealerName: string;
	location: string;
	sections: AuditTemplateSection[];
};

// ─────────────────────────────────────────────────────────────────────
// Checklist Item Forms / Mutations
// ─────────────────────────────────────────────────────────────────────

export type ChecklistItemFormValues = {
	score: number | null;
	remarks: string;
	evidence: AuditEvidence[];
};

export type UpdateChecklistItemPayload = ChecklistItemFormValues & {
	status: AuditTemplateStatus;
};

export interface ChecklistTemplateSection {
	id: string;
	order: number;
	name: string;
	parameters: ChecklistTemplateParameter[];
}

// ---- Form / draft values (builder-local, pre-save) ----
export interface ChecklistTemplateFormValues {
	name: string;
	description: string;
	auditCategory: string;
	facilityType?: string;
	sections: ChecklistTemplateSection[];
}

// ---- Request payloads ----
export interface CreateChecklistTemplatePayload {
	name: string;
	description: string;
	auditCategory: string;
	facilityType?: string;
	sections: Omit<ChecklistTemplateSection, "id">[];
}

export interface UpdateChecklistTemplatePayload extends Partial<CreateChecklistTemplatePayload> {
	id: string;
}

export interface ChecklistTemplateListParams {
	search?: string;
	status?: ChecklistTemplateStatus | "all";
	page?: number;
	pageSize?: number;
}
