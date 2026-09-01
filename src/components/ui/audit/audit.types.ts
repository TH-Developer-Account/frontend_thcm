import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* Backend activity actions                                                   */
/* -------------------------------------------------------------------------- */

export const AUDIT_ACTIVITY_ACTIONS = [
	// Proposer domain
	"EPC_CREATED",
	"EPC_UPDATED",
	"EPF_CREATED",
	"EPF_UPDATED",
	"CRF_CREATED",
	"CRF_UPDATED",
	"EPC_RESUBMITTED",

	// Post-event domain
	"EPC_CONDUCTED",
	"EPC_CANCELLED",
	"REPORT_SUBMITTED",
	"REPORT_RESUBMITTED",
	"REPORT_VALIDATED",
	"REPORT_REJECTED",
	"REPORT_CLARIFICATION_REQUESTED",
	"EPC_CLOSED",

	// Vendor onboarding
	"VENDOR_ONBOARDING_INITIATED",
	"VENDOR_FORM_SUBMITTED",
	"VENDOR_ONBOARDING_SENT_FOR_APPROVAL",
	"VENDOR_ONBOARDING_CLOSED",

	// Medical claim
	"MEDICAL_CLAIM_INITIATED",
	"MEDICAL_CLAIM_SUBMITTED",
	"MEDICAL_CLAIM_RESUBMITTED",
	"MEDICAL_CLAIM_SENT_FOR_APPROVAL",
	"MEDICAL_CLAIM_CLOSED",

	// Approval and workflow
	"APPROVED",
	"REJECTED",
	"CLARIFY",
	"DEVIATION_RAISED",
] as const;

export type AuditActivityAction = (typeof AUDIT_ACTIVITY_ACTIONS)[number];

/* -------------------------------------------------------------------------- */
/* Normalized frontend actions                                                */
/* -------------------------------------------------------------------------- */

export const NORMALIZED_AUDIT_ACTIONS = [
	"CREATED",
	"INITIATED",
	"UPDATED",
	"SUBMITTED",
	"RESUBMITTED",
	"SENT_FOR_APPROVAL",
	"CONDUCTED",
	"CANCELLED",
	"VALIDATED",
	"APPROVED",
	"REJECTED",
	"CLARIFY",
	"CLARIFICATION_REQUESTED",
	"DEVIATION_RAISED",
	"ACCEPTED",
	"CLOSED",
	"WORKFLOW_ASSIGNED",
	"WORKFLOW_STARTED",
] as const;

export type NormalizedAuditAction = (typeof NORMALIZED_AUDIT_ACTIONS)[number];

/**
 * Allows known backend values while remaining forward-compatible
 * when the backend adds a new activity action.
 */
export type AuditAction = AuditActivityAction | (string & {});

/* -------------------------------------------------------------------------- */
/* Status types                                                               */
/* -------------------------------------------------------------------------- */

export const AUDIT_WORKFLOW_STATUSES = [
	"IN_PROGRESS",
	"APPROVED",
	"REJECTED",
	"SUPERSEDED",
] as const;

export type AuditWorkflowStatus = (typeof AUDIT_WORKFLOW_STATUSES)[number];

export const AUDIT_STAGE_STATUSES = [
	"PENDING",
	"IN_PROGRESS",
	"APPROVED",
	"REJECTED",
] as const;

export type AuditStageStatus = (typeof AUDIT_STAGE_STATUSES)[number];

export const AUDIT_APPROVAL_STATUSES = [
	"PENDING",
	"APPROVED",
	"REJECTED",
	"CLARIFY",
] as const;

export type AuditApprovalStatus = (typeof AUDIT_APPROVAL_STATUSES)[number];

export const AUDIT_REPORT_STATUSES = [
	"SUBMITTED",
	"VALIDATED",
	"REJECTED",
	"CLARIFICATION_REQUESTED",
] as const;

export type AuditReportStatus = (typeof AUDIT_REPORT_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/* Audit models                                                               */
/* -------------------------------------------------------------------------- */

export type AuditUser = {
	id: string;
	first_name: string;
	last_name: string;
	email?: string;
};

export type AuditMetadata = {
	reason?: string | null;
	status?: string | null;
	remarks?: string | null;
	comment?: string | null;
	previousStatus?: string | null;
	currentStatus?: string | null;
	[key: string]: unknown;
};

export type AuditLogEntry = {
	id: string;
	action: AuditAction;
	metadata?: AuditMetadata | null;
	actor: AuditUser | null;
	stageName?: string;
	createdAt: string;
};

/* -------------------------------------------------------------------------- */
/* API types                                                                  */
/* -------------------------------------------------------------------------- */

export type GetAuditLogParams = {
	subjectType: string;
	subjectId: string;
};

export type AuditApiAdapter = {
	getAuditLog: (params: GetAuditLogParams) => Promise<AuditLogEntry[]>;
};

export type ApiEnvelope<T> = {
	success?: boolean;
	data: T;
	subjectType?: string;
	subjectId?: string;
	totalEntries?: number;
};

export type ApiAuditUser = {
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;

	// Present in some backend responses.
	name?: string | null;
	role?: string | null;
};

export type ApiAuditLogEntry = {
	entryType?: "ACTIVITY_LOG" | string;
	id: string;
	action: AuditAction;
	metadata?: AuditMetadata | null;
	actor?: ApiAuditUser | null;

	workflowId?: string | null;
	workflowType?: string | null;
	isActiveWorkflow?: boolean | null;
	stageOrder?: number | null;
	stageName?: string | null;
	iteration?: number | null;
	isCurrentIteration?: boolean | null;

	createdAt: string;
};

/* -------------------------------------------------------------------------- */
/* Message types                                                              */
/* -------------------------------------------------------------------------- */

export type AuditMessageContext = {
	entry: AuditLogEntry;
	actorName: string;
	action: NormalizedAuditAction | string;
	rawAction: AuditAction;
	stageName?: string;
	reason?: string;
	stageSuffix: string;
	reasonSuffix: string;
	entityName: string;
};

export type AuditMessageFormatter = (context: AuditMessageContext) => string;

export type AuditActionMessage = string | AuditMessageFormatter;

export type AuditActionMessages = Record<string, AuditActionMessage>;

export type AuditMessageOptions = {
	/**
	 * Entity being acted on.
	 * Examples: "vendor onboarding request", "medical claim".
	 */
	entityName: string;

	/**
	 * Custom messages can be registered using either:
	 * - normalized action: SUBMITTED
	 * - raw action: MEDICAL_CLAIM_SUBMITTED
	 */
	actionMessages?: AuditActionMessages;

	formatTimestamp?: (date: string) => string;
	includeTimestamp?: boolean;
	includeActor?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Component types                                                            */
/* -------------------------------------------------------------------------- */

export type AuditLogSectionProps = {
	subjectType: string;
	subjectId: string;
	entityName: string;
	refreshKey?: string | number;
	title?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	api?: AuditApiAdapter;
	formatMessage?: (entry: AuditLogEntry) => ReactNode;
	actionMessages?: AuditActionMessages;
};

export type AuditLogRowProps = {
	entry: AuditLogEntry;
	entityName: string;
	actionMessages?: AuditActionMessages;
	formatMessage?: (entry: AuditLogEntry) => ReactNode;
};
