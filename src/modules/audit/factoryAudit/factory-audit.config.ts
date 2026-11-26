// modules/audit/factory-audit/factory-audit.config.ts
import type { AuditModuleCapabilities } from "../shared/templates/audit.template.types";

export const FACTORY_AUDIT_CAPABILITIES: AuditModuleCapabilities = {
	auditModule: "FACTORY_AUDIT",
	hasSelfAssessment: false, // no dealer step — reviewer scores directly on-site
	hasReviewerScore: true,
	allowNotApplicable: true,
	evidenceCaptureMode: "LIVE_CAMERA_ONLY",
};
