// modules/audit/dealer-audit/dealer-audit.types.ts
//
// Checklist-TEMPLATE types moved to ./templates/dealer-template.types.ts.
// This file keeps roles + execution-side types only.

import type {
	AuditEvidence,
	AuditTemplateSection,
	AuditTemplateStatus,
} from "../shared/shared.audit.types";

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
