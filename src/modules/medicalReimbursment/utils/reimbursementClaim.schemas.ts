import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Medical claim — zod schemas (single source of truth for validation)         */
/*                                                                            */
/* Mirrors backend/src/modules/mediclaim/mediclaim.validation.ts. The backend  */
/* re-validates everything; these exist so the user sees field-level errors   */
/* before a round trip. Keep the two in sync.                                 */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

export const COVERAGE_VALUES = ["SELF", "SPOUSE", "BOTH"] as const;

/**
 * Claim heads a claimant can pick on this form. EXCESS_HOSPITALISATION is
 * intentionally NOT selectable (non-hospitalisation form) but still exists in
 * ALL_CLAIM_HEAD_VALUES so old bills that carry it can be displayed.
 */
export const CLAIM_HEAD_VALUES = [
	"VISIT_FEES",
	"MEDICINES_INVESTIGATIONS",
	"OPHTHALMIC_TREATMENT",
	"EXECUTIVE_HEALTH_CHECKUP",
] as const;

export const ALL_CLAIM_HEAD_VALUES = [
	...CLAIM_HEAD_VALUES,
	"EXCESS_HOSPITALISATION",
] as const;

export const PATIENT_VALUES = ["SELF", "SPOUSE"] as const;

const REMOVED_CLAIM_HEADS: string[] = ["EXCESS_HOSPITALISATION"];

export const NAME_REGEX = /^[\p{L}][\p{L}\s.'-]*$/u;
export const TICKET_REGEX = /^[A-Za-z0-9-]+$/;
/**
 * Bill / invoice number: letters and digits, plus "-" and "/" inside
 * (e.g. MI-5532, INV/2026/0412). The input upper-cases as you type
 * (sanitizeBillNumberInput); lower case is still accepted for older bills.
 */
export const BILL_NUMBER_REGEX = /^[A-Za-z0-9](?:[A-Za-z0-9/-]*[A-Za-z0-9])?$/;
export const AMOUNT_REGEX = /^(\d+(\.\d{0,2})?|\.\d{1,2})$/; // matches sanitizeAmountInput output
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const MOBILE_REGEX = /^[6-9]\d{9}$/; // Indian mobile numbers
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sanity ceiling for a single bill (₹10 lakh) — catches typos like an extra zero. */
export const MAX_BILL_AMOUNT = 10_00_000;
export const MAX_REMARKS_LENGTH = 500;
export const MAX_REASON_LENGTH = 1000;

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
 * Must return a plain boolean: zod's refine treats any truthy value as valid.
 */
export const isNotInFuture = (value: string): boolean => value <= todayIso();

/* -------------------------------------------------------------------------- */
/* Building blocks                                                             */
/* -------------------------------------------------------------------------- */

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
const positiveAmount = (label = "Amount", max = MAX_BILL_AMOUNT) =>
	z
		.string({ message: `${label} is required.` })
		.trim()
		.min(1, `${label} is required.`)
		.regex(
			AMOUNT_REGEX,
			`Enter a valid ${label.toLowerCase()} (numbers only, max 2 decimals).`,
		)
		.refine((v) => Number(v) > 0, `${label} must be greater than 0.`)
		.refine(
			(v) => Number(v) <= max,
			`${label} cannot exceed ${inr.format(max)}.`,
		);

/** Money that may be 0 (e.g. an approver approving 0 with a remark). */
const nonNegativeAmount = (label: string) =>
	z
		.string({ message: `${label} is required.` })
		.trim()
		.min(1, `${label} is required.`)
		.regex(
			AMOUNT_REGEX,
			`Enter a valid ${label.toLowerCase()} (numbers only, max 2 decimals).`,
		);

const requireSpouseName = (
	value: { coverageType?: string; spouseName?: string },
	ctx: z.RefinementCtx,
) => {
	const name = value.spouseName?.trim() ?? "";
	const needsSpouse =
		value.coverageType === "SPOUSE" || value.coverageType === "BOTH";
	if (needsSpouse && !name) {
		ctx.addIssue({
			code: "custom",
			path: ["spouseName"],
			message: "Spouse name is required.",
		});
		return;
	}
	if (name && needsSpouse && !NAME_REGEX.test(name)) {
		ctx.addIssue({
			code: "custom",
			path: ["spouseName"],
			message: "Spouse name can only contain letters, spaces and . ' -",
		});
	}
};

/* -------------------------------------------------------------------------- */
/* 1. Initiation (THCM user starts a claim) + Excel import rows                */
/* -------------------------------------------------------------------------- */

export const medicalClaimInitiationSchema = z.object({
	employeeName: personName("Employee name").refine(
		(v) => v.length >= 2,
		"Employee name must be at least 2 characters.",
	),
	ticketNumber: requiredText("Ticket number", 20).regex(
		TICKET_REGEX,
		"Ticket number can only contain letters, numbers and hyphens.",
	),
	email: z
		.string({ message: "Employee email is required." })
		.trim()
		.min(1, "Employee email is required.")
		.max(254, "Email is too long.")
		.regex(EMAIL_REGEX, "Enter a valid email address.")
		.transform((v) => v.toLowerCase()),
	mobile: z
		.string({ message: "Phone number is required." })
		.trim()
		.min(1, "Phone number is required.")
		.transform((v) =>
			v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""),
		)
		.pipe(
			z
				.string()
				.regex(
					MOBILE_REGEX,
					"Enter a valid 10-digit mobile number starting with 6-9.",
				),
		),
});
export type MedicalClaimInitiationInput = z.infer<
	typeof medicalClaimInitiationSchema
>;

/** Excel import: same rules per row, plus the spreadsheet row number. */
export const medicalClaimInitiationImportRowSchema =
	medicalClaimInitiationSchema.extend({ row: z.number().int().positive() });

/* -------------------------------------------------------------------------- */
/* 2. Claim header (public token form, guest portal, THCM view)                */
/* -------------------------------------------------------------------------- */

export interface HeaderSchemaOptions {
	/** Grades the user may pick (from the backend grade list). Empty = don't check. */
	allowedGrades?: readonly string[];
}

const gradeField = (allowedGrades?: readonly string[]) =>
	z
		.string({ message: "Select a grade." })
		.trim()
		.min(1, "Select a grade.")
		.refine(
			(v) => !allowedGrades?.length || allowedGrades.includes(v),
			"Select a valid grade.",
		);

const optionalAdvance = z
	.union([z.literal(""), positiveAmount("Advance amount")])
	.optional();

export const createReimbursementClaimHeaderSchema = ({
	allowedGrades,
}: HeaderSchemaOptions = {}) =>
	z
		.object({
			location: requiredText("Location"),
			employeeName: personName("Employee name"),
			// Prefilled by HR at initiation and never editable by the claimant —
			// validated only for format when present.
			ticketNumber: z
				.string()
				.trim()
				.max(20, "Ticket number must be at most 20 characters.")
				.refine(
					(v) => !v || TICKET_REGEX.test(v),
					"Ticket number can only contain letters, numbers and hyphens.",
				)
				.optional(),
			grade: gradeField(allowedGrades),
			coverageType: z.enum(COVERAGE_VALUES, {
				message: "Select a coverage type.",
			}),
			spouseName: z.string().trim().max(100, "Spouse name is too long."),
			claimDate: pastOrPresentDate("Date"),
			declarationAccepted: z
				.boolean()
				.refine(
					(v) => v === true,
					"Please accept the declaration to continue.",
				),
			// Read-only, pulled from records - never validated as user input.
			companySettledAmount: z.string().optional(),
			medicalAdvanceAmount: optionalAdvance,
			employeeSignature: z.string().trim().max(100).optional(),
		})
		.superRefine(requireSpouseName);

/** "Submit Claim" - everything is required. */
export const reimbursementClaimHeaderSchema =
	createReimbursementClaimHeaderSchema();
export type ReimbursementClaimHeaderInput = z.infer<
	typeof reimbursementClaimHeaderSchema
>;

/**
 * "Save as Draft" - nothing is required (partial saves are the point of a
 * draft), but anything that IS filled in must still be well-formed.
 */
export const reimbursementClaimDraftSchema = z
	.object({
		ticketNumber: z.string().trim().max(20).optional(),
		grade: z.string().trim().max(20, "Select a valid grade.").optional(),
		location: z
			.string()
			.trim()
			.max(100, "Location must be at most 100 characters.")
			.optional(),
		coverageType: z.union([z.literal(""), z.enum(COVERAGE_VALUES)]).optional(),
		spouseName: z
			.string()
			.trim()
			.max(100, "Spouse name is too long.")
			.optional(),
		employeeName: z.string().trim().max(100).optional(),
		claimDate: z
			.string()
			.optional()
			.refine((v) => !v || isNotInFuture(v), "Date cannot be in the future."),
		declarationAccepted: z.boolean().optional(),
		companySettledAmount: z.string().optional(),
		medicalAdvanceAmount: optionalAdvance,
		employeeSignature: z.string().trim().max(100).optional(),
	})
	.superRefine((value, ctx) => {
		const name = value.spouseName?.trim();
		if (name && !NAME_REGEX.test(name)) {
			ctx.addIssue({
				code: "custom",
				path: ["spouseName"],
				message: "Spouse name can only contain letters, spaces and . ' -",
			});
		}
	});

/* -------------------------------------------------------------------------- */
/* 3. One claim-head (bill) row                                                */
/* -------------------------------------------------------------------------- */

export interface ClaimHeadRowSchemaOptions {
	/** Eligibility window (YYYY-MM-DD). Bills outside it are rejected. */
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
				"Bill number can only contain letters, numbers, - and / (and must start and end with a letter or number).",
			),
			billName: requiredText("Bill description", 150),
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
		.passthrough()
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
/* 4. Whole submission: header + rows + eligibility limit                      */
/* -------------------------------------------------------------------------- */

export interface SubmitSchemaOptions
	extends ClaimHeadRowSchemaOptions, HeaderSchemaOptions {
	/** Eligible - already settled this year. */
	remainingAmount?: number;
	/** true -> claimed total above remaining eligibility is a hard error. */
	enforceRemaining?: boolean;
}

const billKey = (row: { claimHead?: string; billNumber?: string }) =>
	`${row.claimHead ?? ""}::${(row.billNumber ?? "").trim().toUpperCase()}`;

export const createReimbursementClaimSubmitSchema = ({
	remainingAmount,
	enforceRemaining = true,
	allowedGrades,
	...rowOptions
}: SubmitSchemaOptions = {}) =>
	z
		.object({
			values: createReimbursementClaimHeaderSchema({ allowedGrades }),
			lineItems: z
				.array(createClaimHeadRowSchema(rowOptions))
				.min(1, "Add at least one claim line item before submitting.")
				.max(50, "A claim can have at most 50 bills."),
		})
		.superRefine(({ lineItems }, ctx) => {
			const seen = new Set<string>();
			for (const row of lineItems) {
				const key = billKey(row);
				if (seen.has(key)) {
					ctx.addIssue({
						code: "custom",
						path: ["lineItems"],
						message: `Bill ${row.billNumber} is added twice under the same claim head.`,
					});
					return;
				}
				seen.add(key);
			}

			if (enforceRemaining && typeof remainingAmount === "number") {
				const total = lineItems.reduce((sum, r) => sum + Number(r.amount), 0);
				if (total > remainingAmount + 0.001) {
					ctx.addIssue({
						code: "custom",
						path: ["lineItems"],
						message: `Claimed total ${inr.format(total)} exceeds your remaining eligibility of ${inr.format(Math.max(remainingAmount, 0))}.`,
					});
				}
			}
		});

/* -------------------------------------------------------------------------- */
/* 5. Approver-side (THCM users only)                                          */
/* -------------------------------------------------------------------------- */

/** Approver edits "Approved Amount" and ticks "Approve" on a line item. */
export const lineItemApprovalSchema = z
	.object({
		amount: positiveAmount("Claimed amount"),
		approvedClaimAmount: nonNegativeAmount("Approved amount"),
		remarks: z
			.string()
			.trim()
			.max(
				MAX_REMARKS_LENGTH,
				`Remarks must be at most ${MAX_REMARKS_LENGTH} characters.`,
			)
			.optional()
			.nullable(),
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
		.max(
			MAX_REMARKS_LENGTH,
			`Remarks must be at most ${MAX_REMARKS_LENGTH} characters.`,
		),
});

/** Inline reason box for "Approve". */
export const approvalReasonSchema = z.object({
	reason: z
		.string({ message: "A reason is required to continue." })
		.trim()
		.min(1, "A reason is required to continue.")
		.max(
			MAX_REASON_LENGTH,
			`Reason must be at most ${MAX_REASON_LENGTH} characters.`,
		),
});

/** "Send for Clarification" — must tell the claimant what to fix. */
export const clarificationReasonSchema = z.object({
	reason: z
		.string({ message: "Tell the claimant what needs to be corrected." })
		.trim()
		.min(10, "Describe what needs to be corrected (at least 10 characters).")
		.max(
			MAX_REASON_LENGTH,
			`Reason must be at most ${MAX_REASON_LENGTH} characters.`,
		),
});

/* -------------------------------------------------------------------------- */
/* 6. Eligibility (shown to guest AND THCM users)                              */
/* -------------------------------------------------------------------------- */

/** Pure helper so every eligibility view shows the same numbers. */
export function deriveEligibility(
	summary: { totalEligible: number; settled: number },
	claimingNow = 0,
) {
	const remaining = Math.max(summary.totalEligible - summary.settled, 0);
	const balanceAfter = remaining - claimingNow;
	return {
		remaining,
		balanceAfter,
		isOverLimit: balanceAfter < 0,
		percentSettled: summary.totalEligible
			? Math.min((summary.settled / summary.totalEligible) * 100, 100)
			: 0,
		percentThisClaim: summary.totalEligible
			? (Math.min(claimingNow, remaining) / summary.totalEligible) * 100
			: 0,
	};
}

/**
 * Financial year (Apr-Mar) containing `ref`. Eligibility is counted per FY —
 * same rule as the backend (mediclaim.validation.ts → getFinancialYear).
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

/** First human-readable message — for toasts. */
export const firstErrorMessage = (
	error: z.ZodError,
	fallback = "Please check the highlighted fields.",
): string => error.issues[0]?.message ?? fallback;
