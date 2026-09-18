// modules/audit/dealer-audit/dealer-audit.config.ts
import type { AuditModuleCapabilities } from "../shared/shared.audit.types";

export const DEALER_AUDIT_CAPABILITIES: AuditModuleCapabilities = {
	auditModule: "DEALER_AUDIT",
	hasSelfAssessment: true,
	hasReviewerScore: true,
	allowNotApplicable: true,
	evidenceCaptureMode: "LIVE_CAMERA_ONLY",
};
