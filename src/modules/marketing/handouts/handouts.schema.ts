// handouts/handouts.schema.ts
// Zod schemas + UI-ready error mapping for the two Handouts forms.
// Same approach as crf/core/schema.ts: our own messages, first message per
// field, written against the common Zod API (v3/v4 safe).
//
// Souvenir LINES are not validated here — the request form reuses the CRF's
// validateCrfForm so quantity / SKU / stock rules stay identical to a CRF.

import { z } from "zod";

import { HANDOUT_LIMITS } from "./handouts.constants";

export const HANDOUT_MESSAGES = {
	purposeRequired: "Purpose is required.",
	purposeTooLong: `Purpose cannot exceed ${HANDOUT_LIMITS.PURPOSE} characters.`,
	requiredByRequired: "Required by date is required.",
	requiredByInvalid: "Enter a valid date.",
	requiredByPast: "Required by date cannot be in the past.",
	deliverToRequired: "Delivery location is required.",
	deliverToTooLong: `Delivery location cannot exceed ${HANDOUT_LIMITS.DELIVER_TO} characters.`,
	phoneRequired: "Contact number is required.",
	phoneInvalid: "Enter a valid 10-digit mobile number.",
	remarksTooLong: `Remarks cannot exceed ${HANDOUT_LIMITS.REMARKS} characters.`,
	itemsRequired: "Add at least one souvenir to the request.",
	tooManyItems: `A request can have at most ${HANDOUT_LIMITS.MAX_ITEMS} items.`,
	handedToRequired: "Enter the name of the person who received the items.",
	handedToTooShort: "Name must be at least 2 characters.",
	deliveredOnRequired: "Delivered on is required.",
	deliveredOnInvalid: "Enter a valid date and time.",
	deliveredOnFuture: "Delivered on cannot be in the future.",
	noteTooLong: `Note cannot exceed ${HANDOUT_LIMITS.NOTE} characters.`,
	itemsNotChecked: "Tick every item once it has been verified.",
} as const;

/** yyyy-mm-dd of today in local time (matches <input type="date">). */
export const todayInputValue = () => {
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** yyyy-mm-ddThh:mm of now in local time (matches datetime-local). */
export const nowInputValue = () => {
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${todayInputValue()}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

/* ========================================================================== */
/*                             Request details form                           */
/* ========================================================================== */

export const handoutDetailsSchema = z.object({
	purpose: z
		.string()
		.trim()
		.min(1, HANDOUT_MESSAGES.purposeRequired)
		.max(HANDOUT_LIMITS.PURPOSE, HANDOUT_MESSAGES.purposeTooLong),
	requiredBy: z
		.string()
		.min(1, HANDOUT_MESSAGES.requiredByRequired)
		.refine(
			(value) => !Number.isNaN(Date.parse(value)),
			HANDOUT_MESSAGES.requiredByInvalid,
		)
		// yyyy-mm-dd strings compare correctly as text.
		.refine(
			(value) => value >= todayInputValue(),
			HANDOUT_MESSAGES.requiredByPast,
		),
	deliverTo: z
		.string()
		.trim()
		.min(1, HANDOUT_MESSAGES.deliverToRequired)
		.max(HANDOUT_LIMITS.DELIVER_TO, HANDOUT_MESSAGES.deliverToTooLong),
	contactPhone: z
		.string()
		.trim()
		.min(1, HANDOUT_MESSAGES.phoneRequired)
		.regex(/^[6-9]\d{9}$/, HANDOUT_MESSAGES.phoneInvalid),
	remarks: z
		.string()
		.trim()
		.max(HANDOUT_LIMITS.REMARKS, HANDOUT_MESSAGES.remarksTooLong)
		.optional()
		.default(""),
});

export type HandoutDetailsValues = z.input<typeof handoutDetailsSchema>;
export type HandoutDetailsField = keyof HandoutDetailsValues;
export type HandoutDetailsErrors = Partial<Record<HandoutDetailsField, string>>;

export const EMPTY_HANDOUT_DETAILS: Required<HandoutDetailsValues> = {
	purpose: "",
	requiredBy: "",
	deliverTo: "",
	contactPhone: "",
	remarks: "",
};

/* ========================================================================== */
/*                           Delivery (hand over) form                        */
/* ========================================================================== */

export const handoutDeliverySchema = z.object({
	handedToName: z
		.string()
		.trim()
		.min(1, HANDOUT_MESSAGES.handedToRequired)
		.min(2, HANDOUT_MESSAGES.handedToTooShort),
	deliveredOn: z
		.string()
		.min(1, HANDOUT_MESSAGES.deliveredOnRequired)
		.refine(
			(value) => !Number.isNaN(Date.parse(value)),
			HANDOUT_MESSAGES.deliveredOnInvalid,
		)
		.refine(
			// 1 minute of slack so "now" never trips on clock rounding.
			(value) => Date.parse(value) <= Date.now() + 60_000,
			HANDOUT_MESSAGES.deliveredOnFuture,
		),
	note: z
		.string()
		.trim()
		.max(HANDOUT_LIMITS.NOTE, HANDOUT_MESSAGES.noteTooLong)
		.optional()
		.default(""),
});

export type HandoutDeliveryValues = z.input<typeof handoutDeliverySchema>;
export type HandoutDeliveryField = keyof HandoutDeliveryValues | "checked";
export type HandoutDeliveryErrors = Partial<
	Record<HandoutDeliveryField, string>
>;

/* ========================================================================== */
/*                               Error mapping                                */
/* ========================================================================== */

type ParseResult<TOut> =
	| { success: true; data: TOut }
	| { success: false; errors: Record<string, string> };

/** Runs a schema and keeps only the first message per top-level field. */
export const parseWithFieldErrors = <TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	input: unknown,
): ParseResult<z.output<TSchema>> => {
	const result = schema.safeParse(input);
	if (result.success) return { success: true, data: result.data };

	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const key = String(issue.path[0] ?? "form");
		errors[key] ??= issue.message;
	}
	return { success: false, errors };
};
