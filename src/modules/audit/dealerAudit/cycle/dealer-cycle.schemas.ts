// modules/audit/dealerAudit/cycle/dealer-cycle.schemas.ts
//
// Wizard validation. One schema per step so the "Next" button validates only
// what the user has seen, plus a whole-form schema run again before launch.

import { z } from "zod";
import { dealerCycleContent, formatCycleMessage } from "./dealer-cycle.content";
import { countUnassigned } from "./dealer-cycle.logic";
import type { CreateAuditCycleFormValues } from "./dealer-cycle.types";

const msg = dealerCycleContent.validation;

export const CYCLE_NAME_MAX = 120;
export const CYCLE_NOTES_MAX = 500;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const todayIso = (now: Date): string => {
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
};

export const cycleDetailsSchema = (now: Date = new Date()) =>
	z
		.object({
			name: z
				.string()
				.trim()
				.min(1, msg.nameRequired)
				.max(CYCLE_NAME_MAX, formatCycleMessage(msg.nameTooLong, { max: CYCLE_NAME_MAX })),
			templateId: z.string().min(1, msg.templateRequired),
			periodType: z.enum(["QUARTERLY", "YEARLY"]),
			year: z.number().int(),
			quarter: z
				.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
				.nullable(),
			dueDate: z.string().min(1, msg.dueDateRequired).regex(DATE_RE, msg.dueDateInvalid),
			notes: z
				.string()
				.max(CYCLE_NOTES_MAX, formatCycleMessage(msg.notesTooLong, { max: CYCLE_NOTES_MAX })),
		})
		.superRefine((values, ctx) => {
			if (values.periodType === "QUARTERLY" && values.quarter === null) {
				ctx.addIssue({ code: "custom", path: ["quarter"], message: msg.quarterRequired });
			}
			if (DATE_RE.test(values.dueDate) && values.dueDate < todayIso(now)) {
				ctx.addIssue({ code: "custom", path: ["dueDate"], message: msg.dueDatePast });
			}
		});

/** `ineligibleIds` = selected dealers the eligibility check rejected. */
export const cycleDealersSchema = (ineligibleIds: ReadonlySet<string> = new Set()) =>
	z
		.object({ dealerIds: z.array(z.string()).min(1, msg.dealersRequired) })
		.superRefine((values, ctx) => {
			if (values.dealerIds.some((id) => ineligibleIds.has(id))) {
				ctx.addIssue({ code: "custom", path: ["dealerIds"], message: msg.dealersIneligible });
			}
		});

export const cycleReviewersSchema = z
	.object({
		dealerIds: z.array(z.string()),
		reviewerByDealer: z.record(z.string(), z.string()),
	})
	.superRefine((values, ctx) => {
		if (countUnassigned(values.dealerIds, values.reviewerByDealer) > 0) {
			ctx.addIssue({ code: "custom", path: ["reviewerByDealer"], message: msg.reviewersMissing });
		}
	});

export type CycleStepErrors = Readonly<Record<string, string>>;

/** Flattens a zod result into { fieldPath: firstMessage }. */
export const toStepErrors = (result: z.ZodSafeParseResult<unknown>): CycleStepErrors => {
	if (result.success) return {};
	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const key = issue.path.join(".") || "form";
		if (!(key in errors)) errors[key] = issue.message;
	}
	return errors;
};

export const validateCycleDetails = (
	values: CreateAuditCycleFormValues,
	now: Date = new Date(),
): CycleStepErrors =>
	toStepErrors(
		cycleDetailsSchema(now).safeParse({
			name: values.name,
			templateId: values.templateId,
			periodType: values.periodType,
			year: values.year,
			quarter: values.quarter,
			dueDate: values.dueDate,
			notes: values.notes,
		}),
	);

export const validateCycleDealers = (
	values: CreateAuditCycleFormValues,
	ineligibleIds: ReadonlySet<string>,
): CycleStepErrors =>
	toStepErrors(cycleDealersSchema(ineligibleIds).safeParse({ dealerIds: values.dealerIds }));

export const validateCycleReviewers = (
	values: CreateAuditCycleFormValues,
): CycleStepErrors =>
	toStepErrors(
		cycleReviewersSchema.safeParse({
			dealerIds: values.dealerIds,
			reviewerByDealer: values.reviewerByDealer,
		}),
	);

/** Full check before launch. Returns the first failing step, or null. */
export const findFirstInvalidStep = (
	values: CreateAuditCycleFormValues,
	ineligibleIds: ReadonlySet<string>,
	now: Date = new Date(),
): "DETAILS" | "DEALERS" | "REVIEWERS" | null => {
	if (Object.keys(validateCycleDetails(values, now)).length > 0) return "DETAILS";
	if (Object.keys(validateCycleDealers(values, ineligibleIds)).length > 0) return "DEALERS";
	if (Object.keys(validateCycleReviewers(values)).length > 0) return "REVIEWERS";
	return null;
};
