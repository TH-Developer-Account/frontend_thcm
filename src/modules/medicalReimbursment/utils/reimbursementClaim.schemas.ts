import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Constants (single source of truth - derive GRADE_OPTIONS / CLAIM_HEAD_OPTIONS */
/* labels from these so the UI and the schemas can never drift apart)          */
/* -------------------------------------------------------------------------- */

export const GRADE_VALUES = [
	"EG-3",
	"EG-4",
	"TM-5",
	"TM-4",
	"TM-3",
	"TM-2",
	"TM-1",
	"TM-0",
	"TS-2",
	"TS-1",
	"TE-3",
] as const;

export const COVERAGE_VALUES = ["SELF", "SPOUSE", "BOTH"] as const;

/** EXCESS_HOSPITALISATION intentionally removed: this form is non-hospitalisation only. */
export const CLAIM_HEAD_VALUES = [
	"VISIT_FEES",
	"MEDICINES_INVESTIGATIONS",
	"OPHTHALMIC_TREATMENT",
	"EXECUTIVE_HEALTH_CHECKUP",
	"EXCESS_HOSPITALISATION",
] as const;

export const PATIENT_VALUES = ["SELF", "SPOUSE"] as const;

/** Heads that used to exist and may still arrive from old drafts / the API. */
const REMOVED_CLAIM_HEADS = ["EXCESS_HOSPITALISATION"];

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                       */
/* -------------------------------------------------------------------------- */

const NAME_REGEX = /^[\p{L}][\p{L}\s.'-]*$/u;
const TICKET_REGEX = /^[A-Za-z0-9-]+$/;
const BILL_NUMBER_REGEX = /^\d+$/; // digits only — matches sanitizeWholeNumberInput output
const AMOUNT_REGEX = /^(\d+(\.\d{0,2})?|\.\d{1,2})$/; // matches sanitizeAmountInput output
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/; // Indian mobile numbers

const inr = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

/** Today as YYYY-MM-DD in the user's local timezone (not UTC). */
export const todayIso = (): string => {
	const d = new Date();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${mm}-${dd}`;
};

/**
 * true when the YYYY-MM-DD date is today or earlier.
 *
 * NOTE: the previous version returned `true | string`. zod's refine treats any
 * truthy value as "valid", so the error string made future dates PASS.
 * This must return a plain boolean.
 */
export const isNotInFuture = (value: string): boolean => value <= todayIso();

const requiredText = (label: string, max = 100) =>
	z
		.string({ message: `${label} is required.` })
		.trim()
		.min(1, `${label} is required.`)
		.max(max, `${label} must be at most ${max} characters.`);

const personName = (label: string) =>
	requiredText(label).regex(
		NAME_REGEX,
		`${label} can only contain letters, spaces and . ' -`,
	);

const isoDate = (label: string) =>
	z
		.string({ message: `${label} is required.` })
		.trim()
		.min(1, `${label} is required.`)
		.regex(ISO_DATE_REGEX, `${label} must be a valid date.`)
		.refine(
			(v) => !Number.isNaN(new Date(`${v}T00:00:00`).getTime()),
			`${label} must be a valid date.`,
		);

/** Required date, today or in the past. */
const pastOrPresentDate = (label: string) =>
	isoDate(label).refine(isNotInFuture, `${label} cannot be in the future.`);

/** Positive money, kept as a string because the form stores amounts as strings. */
const positiveAmount = (label = "Amount") =>
	z
		.string({ message: `${label} is required.` })
		.trim()
		.min(1, `${label} is required.`)
		.regex(
			AMOUNT_REGEX,
			`Enter a valid ${label.toLowerCase()} (max 2 decimals).`,
		)
		.refine((v) => Number(v) > 0, `${label} must be greater than 0.`);

/** Money that may be 0 (e.g. an approver approving 0 with a remark). */
const nonNegativeAmount = (label: string) =>
	z
		.string({ message: `${label} is required.` })
		.trim()
		.min(1, `${label} is required.`)
		.regex(
			AMOUNT_REGEX,
			`Enter a valid ${label.toLowerCase()} (max 2 decimals).`,
		);

const requireSpouseName = (
	value: { coverageType?: string; spouseName?: string },
	ctx: z.RefinementCtx,
) => {
	if (value.coverageType !== "SPOUSE" && value.coverageType !== "BOTH") return;
	const name = value.spouseName?.trim() ?? "";
	if (!name) {
		ctx.addIssue({
			code: "custom",
			path: ["spouseName"],
			message: "Spouse name is required.",
		});
	} else if (!NAME_REGEX.test(name)) {
		ctx.addIssue({
			code: "custom",
			path: ["spouseName"],
			message: "Spouse name can only contain letters, spaces and . ' -",
		});
	}
};

/* -------------------------------------------------------------------------- */
/* 1. Initiation form (THCM user starts a claim / Excel import row)            */
/* -------------------------------------------------------------------------- */

export const medicalClaimInitiationSchema = z.object({
	employeeName: personName("Employee name"),
	ticketNumber: requiredText("Ticket number", 20).regex(
		TICKET_REGEX,
		"Ticket number can only contain letters, numbers and hyphens.",
	),
	email: z
		.string({ message: "Employee email is required." })
		.trim()
		.min(1, "Employee email is required.")
		.email("Enter a valid email address."),
	mobile: z
		.string({ message: "Phone number is required." })
		.trim()
		.min(1, "Phone number is required.")
		.regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number."),
});
export type MedicalClaimInitiationInput = z.infer<
	typeof medicalClaimInitiationSchema
>;

/** Excel import: same rules per row, plus the spreadsheet row number for error reports. */
export const medicalClaimInitiationImportRowSchema =
	medicalClaimInitiationSchema.extend({ row: z.number().int().positive() });

/* -------------------------------------------------------------------------- */
/* 2 + 3. Claim header (guest public form AND THCM user form)                  */
/* -------------------------------------------------------------------------- */

const headerFields = {
	location: requiredText("Location"),
	employeeName: personName("Employee name"),
	ticketNumber: requiredText("Ticket number", 20).regex(
		TICKET_REGEX,
		"Ticket number can only contain letters, numbers and hyphens.",
	),
	grade: z.enum(GRADE_VALUES, { message: "Select a grade." }),
	coverageType: z.enum(COVERAGE_VALUES, { message: "Select a coverage type." }),
	spouseName: z.string().trim().max(100, "Spouse name is too long."),
	claimDate: pastOrPresentDate("Date"),
	declarationAccepted: z
		.boolean()
		.refine((v) => v === true, "Please accept the declaration to continue."),
	// Read-only, pulled from records - never validated as user input.
	companySettledAmount: z.string().optional(),
	medicalAdvanceAmount: z
		.union([z.literal(""), positiveAmount("Advance amount")])
		.optional(),
	employeeSignature: z.string().trim().max(100).optional(),
};

/** "Submit Claim" - everything is required. */
export const reimbursementClaimHeaderSchema = z
	.object(headerFields)
	.superRefine(requireSpouseName);
export type ReimbursementClaimHeaderInput = z.infer<
	typeof reimbursementClaimHeaderSchema
>;

/** "Save as Draft" - only the minimum needed to identify the claim. */
export const reimbursementClaimDraftSchema = z
	.object({
		ticketNumber: headerFields.ticketNumber,
		grade: headerFields.grade,
		location: headerFields.location,
		coverageType: headerFields.coverageType,
		spouseName: headerFields.spouseName,
		employeeName: z.string().trim().max(100),
		// Optional for a draft, but if a date is there it still can't be in the future.
		claimDate: z
			.string()
			.optional()
			.refine((v) => !v || isNotInFuture(v), "Date cannot be in the future."),
		declarationAccepted: z.boolean().optional(),
		companySettledAmount: z.string().optional(),
		medicalAdvanceAmount: headerFields.medicalAdvanceAmount,
		employeeSignature: headerFields.employeeSignature,
	})
	.superRefine(requireSpouseName);

/* -------------------------------------------------------------------------- */
/* 4. One claim-head (bill) row                                                */
/* -------------------------------------------------------------------------- */

export interface ClaimHeadRowSchemaOptions {
	/** Eligibility year window (YYYY-MM-DD). Bills outside it are rejected. */
	yearStart?: string;
	yearEnd?: string;
}

export const createClaimHeadRowSchema = ({
	yearStart,
	yearEnd,
}: ClaimHeadRowSchemaOptions = {}) =>
	z
		.object({
			id: z.string().optional(),
			claimHead: z
				.string({ message: "Claim head is required." })
				.min(1, "Claim head is required.")
				.refine(
					(v) => !REMOVED_CLAIM_HEADS.includes(v),
					"Hospitalisation expenses are not covered by this form.",
				)
				.pipe(
					z.enum(CLAIM_HEAD_VALUES, { message: "Select a valid claim head." }),
				),
			billNumber: requiredText("Bill number", 50).regex(
				BILL_NUMBER_REGEX,
				"Bill number can only contain numbers.",
			),
			billName: requiredText("Bill name", 150),
			billDate: pastOrPresentDate("Bill date"),
			amount: positiveAmount("Amount"),
			patient: z.enum(PATIENT_VALUES).or(z.literal("")).nullish(),
			// Either a freshly picked File or an already-uploaded remote file.
			file: z.custom<File>().nullish(),
			attachment: z
				.object({ file: z.custom<File>().nullish(), url: z.string().nullish() })
				.passthrough()
				.nullish(),
		})
		.superRefine((row, ctx) => {
			if (!row.file && !row.attachment?.file && !row.attachment?.url) {
				ctx.addIssue({
					code: "custom",
					path: ["attachment"],
					message: "Attachment is required.",
				});
			}
			if (yearStart && row.billDate < yearStart) {
				ctx.addIssue({
					code: "custom",
					path: ["billDate"],
					message: `Bill date must be on or after ${yearStart}.`,
				});
			}
			if (yearEnd && row.billDate > yearEnd) {
				ctx.addIssue({
					code: "custom",
					path: ["billDate"],
					message: `Bill date must be on or before ${yearEnd}.`,
				});
			}
		});
export type ClaimHeadRowInput = z.infer<
	ReturnType<typeof createClaimHeadRowSchema>
>;

/* -------------------------------------------------------------------------- */
/* 5. Whole submission: header + rows + eligibility limit                      */
/* -------------------------------------------------------------------------- */

export interface SubmitSchemaOptions extends ClaimHeadRowSchemaOptions {
	/** Eligible - already settled this year (from the server, not the form). */
	remainingAmount?: number;
	/**
	 * true  -> claimed total above remaining eligibility is a hard error
	 * false -> only the UI warns; approvers decide (undecided - see option cards)
	 */
	enforceRemaining?: boolean;
}

export const createReimbursementClaimSubmitSchema = ({
	remainingAmount,
	enforceRemaining = true,
	...rowOptions
}: SubmitSchemaOptions = {}) =>
	z
		.object({
			values: reimbursementClaimHeaderSchema,
			lineItems: z
				.array(createClaimHeadRowSchema(rowOptions))
				.min(1, "Add at least one claim line item before submitting."),
		})
		.superRefine(({ lineItems }, ctx) => {
			if (enforceRemaining && typeof remainingAmount === "number") {
				const total = lineItems.reduce((sum, r) => sum + Number(r.amount), 0);
				if (total > remainingAmount) {
					ctx.addIssue({
						code: "custom",
						path: ["lineItems"],
						message: `Claimed total ${inr.format(total)} exceeds your remaining eligibility of ${inr.format(Math.max(remainingAmount, 0))}.`,
					});
				}
			}
		});

/* -------------------------------------------------------------------------- */
/* 6-8. Approver-side forms (THCM users only)                                  */
/* -------------------------------------------------------------------------- */

/** Approver edits "Approved Amount" and ticks "Approve" on a line item. */
export const lineItemApprovalSchema = z
	.object({
		amount: positiveAmount("Claimed amount"),
		approvedClaimAmount: nonNegativeAmount("Approved amount"),
		remarks: z
			.string()
			.trim()
			.max(500, "Remarks must be at most 500 characters.")
			.optional(),
	})
	.superRefine((item, ctx) => {
		const claimed = Number(item.amount);
		const approved = Number(item.approvedClaimAmount);
		if (approved > claimed) {
			ctx.addIssue({
				code: "custom",
				path: ["approvedClaimAmount"],
				message: "Approved amount cannot exceed the claimed amount.",
			});
		}
		if (approved < claimed && !item.remarks?.trim()) {
			ctx.addIssue({
				code: "custom",
				path: ["remarks"],
				message:
					"Remarks are required when approving less than the claimed amount.",
			});
		}
	});

/** "Save remarks" button next to a line item. */
export const lineItemRemarksSchema = z.object({
	remarks: z
		.string({ message: "Remarks are required." })
		.trim()
		.min(1, "Remarks are required.")
		.max(500, "Remarks must be at most 500 characters."),
});

/** Inline reason box for "Approve" and "Send for Clarification". */
export const approvalReasonSchema = z.object({
	reason: z
		.string({ message: "A reason is required to continue." })
		.trim()
		.min(1, "A reason is required to continue.")
		.max(1000, "Reason must be at most 1000 characters."),
});

/* -------------------------------------------------------------------------- */
/* 9. Eligibility (shown to guest AND THCM users)                              */
/* -------------------------------------------------------------------------- */

export const eligibilitySummarySchema = z
	.object({
		/** Proposed API field: this form is for retired employees only. */
		employeeStatus: z.literal("RETIRED", {
			message: "This claim form is only available to retired employees.",
		}),
		/** e.g. "FY 2026-27" or "CY 2026" - depends on how the company defines "year". */
		periodLabel: z.string().min(1),
		periodStart: z.string().regex(ISO_DATE_REGEX),
		periodEnd: z.string().regex(ISO_DATE_REGEX),
		totalEligible: z.number().nonnegative(),
		settled: z.number().nonnegative(),
		/** Submitted / under review, not yet settled. Optional - THCM view only. */
		pending: z.number().nonnegative().optional(),
	})
	.refine((s) => s.settled <= s.totalEligible, {
		message: "Settled amount cannot exceed total eligibility.",
		path: ["settled"],
	});
export type EligibilitySummary = z.infer<typeof eligibilitySummarySchema>;

/** Pure helper so every eligibility view (guest, THCM, any layout option) shows the same numbers. */
export function deriveEligibility(
	summary: Pick<EligibilitySummary, "totalEligible" | "settled">,
	claimingNow = 0,
) {
	const remaining = Math.max(summary.totalEligible - summary.settled, 0);
	const balanceAfter = remaining - claimingNow;
	return {
		remaining,
		balanceAfter,
		isOverLimit: balanceAfter < 0,
		percentSettled: summary.totalEligible
			? (summary.settled / summary.totalEligible) * 100
			: 0,
		percentThisClaim: summary.totalEligible
			? (Math.min(claimingNow, remaining) / summary.totalEligible) * 100
			: 0,
	};
}

/**
 * Financial year (Apr-Mar) containing `ref`. ASSUMPTION: "year" = financial year.
 * Only used for the panel label today; bill dates are not restricted to it.
 */
export function getFinancialYear(ref: Date = new Date()) {
	const startYear =
		ref.getMonth() >= 3 ? ref.getFullYear() : ref.getFullYear() - 1;
	return {
		label: `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`,
		start: `${startYear}-04-01`,
		end: `${startYear + 1}-03-31`,
	};
}

/* -------------------------------------------------------------------------- */
/* Error mapping: zod issues -> the shapes the hooks already use              */
/* -------------------------------------------------------------------------- */

/** Header / initiation forms -> `{ fieldName: message }` (first message per field). */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of error.issues) {
		let key = issue.path[0];
		if (key === "values") key = issue.path[1]; // submit schema wraps header in `values`
		if (key === "lineItems") key = "form"; // shown in the claim-head banner
		const name = String(key ?? "form");
		if (!(name in out)) out[name] = issue.message;
	}
	return out;
}

/** One claim-head row -> the `${field}-${rowId}` keys ClaimHeadEntryTable expects. */
export function toRowErrors(
	rowId: string,
	error: z.ZodError,
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of error.issues) {
		const field = String(issue.path[0] ?? "form");
		const key = `${field === "attachment" ? "file" : field}-${rowId}`;
		if (!(key in out)) out[key] = issue.message;
	}
	return out;
}
