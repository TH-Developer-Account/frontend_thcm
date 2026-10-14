// modules/audit/dealerAudit/dealer-audit.schemas.ts
//
// Dealer-specific validation: whole-audit checks that depend on the dealer
// status model, and the schemas for dealer workflow actions (create audit,
// clarification request, approve, reject, reassign, re-audit).
//
// Item-level validation (score, remarks, evidence, reviewer decision) is
// shared with Factory Audit: ../shared/execution/audit-execution.validation.

import { z } from "zod";
import { DEALER_AUDIT_RULES } from "./dealer-audit.config";
import {
	dealerAuditContent as content,
	formatDealerAuditMessage as format,
} from "./dealer-audit.content";
import { isClarificationStatus } from "./dealer-audit.status";
import type { DealerAuditChecklistItem, DealerAuditStatus } from "./dealer-audit.types";
import {
	validateItemsForReviewSubmission,
	validateItemsForSelfSubmission,
	type AuditValidationResult,
} from "../shared/execution/audit-execution.validation";

const msg = content.validation;
const { text } = DEALER_AUDIT_RULES;

/** Dealer rule: during a clarification only the flagged items are re-answered. */
export const validateAuditForSubmission = (
	items: readonly DealerAuditChecklistItem[],
	status: DealerAuditStatus,
): AuditValidationResult =>
	validateItemsForSelfSubmission(items, isClarificationStatus(status));

export const validateReviewForSubmission = (
	items: readonly DealerAuditChecklistItem[],
): AuditValidationResult => validateItemsForReviewSubmission(items);

// ── Workflow-action schemas ───────────────────────────────────────────

const requiredText = (
	requiredMessage: string,
	max: number,
	tooLongMessage: string,
) =>
	z
		.string()
		.trim()
		.min(1, requiredMessage)
		.max(max, format(tooLongMessage, { max }));

const dateString = z
	.string()
	.min(1, msg.dueDateRequired)
	.regex(/^\d{4}-\d{2}-\d{2}$/, msg.dueDateInvalid);

const todayIso = (now: Date): string => {
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
};

export const createDealerAuditSchema = (now: Date = new Date()) =>
	z
		.object({
			templateId: z.string().min(1, msg.templateRequired),
			dealerIds: z.array(z.string()).min(1, msg.dealersRequired),
			reviewerId: z.string().min(1, msg.reviewerRequired),
			periodType: z.enum(["QUARTERLY", "YEARLY"]),
			year: z.number().int(),
			quarter: z
				.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
				.nullable(),
			dueDate: dateString,
		})
		.superRefine((values, ctx) => {
			if (values.periodType === "QUARTERLY" && values.quarter === null) {
				ctx.addIssue({
					code: "custom",
					path: ["quarter"],
					message: msg.quarterRequired,
				});
			}
			if (
				/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate) &&
				values.dueDate < todayIso(now)
			) {
				ctx.addIssue({
					code: "custom",
					path: ["dueDate"],
					message: msg.dueDatePast,
				});
			}
		});

export const raiseClarificationSchema = z.object({
	itemIds: z.array(z.string()).min(1, msg.clarificationItemsRequired),
	remarks: requiredText(
		msg.clarificationRemarksRequired,
		text.clarificationMaxLength,
		msg.reasonTooLong,
	),
});

/** Approval comments are optional but bounded. */
export const approveAuditSchema = z.object({
	remarks: z
		.string()
		.trim()
		.max(text.reasonMaxLength, format(msg.reasonTooLong, { max: text.reasonMaxLength })),
});

export const rejectAuditSchema = z.object({
	reason: requiredText(
		msg.rejectReasonRequired,
		text.reasonMaxLength,
		msg.reasonTooLong,
	),
});

export const reassignReviewerSchema = z.object({
	reviewerId: z.string().min(1, msg.reassignReviewerRequired),
	reason: z
		.string()
		.trim()
		.min(text.reasonMinLength, format(msg.reasonTooShort, { min: text.reasonMinLength }))
		.max(text.reasonMaxLength, format(msg.reasonTooLong, { max: text.reasonMaxLength })),
});

export const reAuditSchema = (now: Date = new Date()) =>
	z
		.object({
			reason: z
				.string()
				.trim()
				.min(text.reasonMinLength, format(msg.reasonTooShort, { min: text.reasonMinLength }))
				.max(text.reasonMaxLength, format(msg.reasonTooLong, { max: text.reasonMaxLength })),
			dueDate: dateString,
		})
		.superRefine((values, ctx) => {
			if (
				/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate) &&
				values.dueDate < todayIso(now)
			) {
				ctx.addIssue({
					code: "custom",
					path: ["dueDate"],
					message: msg.dueDatePast,
				});
			}
		});

export type RaiseClarificationFormValues = z.infer<typeof raiseClarificationSchema>;
export type ApproveAuditFormValues = z.infer<typeof approveAuditSchema>;
export type RejectAuditFormValues = z.infer<typeof rejectAuditSchema>;
export type ReassignReviewerFormValues = z.infer<typeof reassignReviewerSchema>;
export type ReAuditFormValues = z.infer<ReturnType<typeof reAuditSchema>>;
