// Public surface of the Dealer Audit module. Pages are NOT re-exported here
// so routes can lazy-load them; import them via React.lazy(() => import(...)).

export { dealerAuditSidebar } from "./dealerAudit.sidebar";
export { DEALER_AUDIT_ROUTES } from "./dealer-audit.routes";
export { dealerAuditKeys } from "./dealer-audit.queries";
export {
	getDealerAuditPermissions,
	resolveAuditPermissions,
	getAssessmentMode,
} from "./dealer-audit.permissions";
export type { DealerAuditPermissions } from "./dealer-audit.permissions";
export {
	ALLOWED_AUDIT_TRANSITIONS,
	canTransitionAuditStatus,
	getAuditStatusLabel,
} from "./dealer-audit.status";
export type {
	DealerAudit,
	DealerAuditRole,
	DealerAuditStatus,
} from "./dealer-audit.types";
