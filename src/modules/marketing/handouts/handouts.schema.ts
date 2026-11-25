// handouts/handouts.schema.ts
// Zod schemas + UI-ready error mapping for the Handouts forms.
// Same approach as crf/core/schema.ts: our own messages, first message per
// field, written against the common Zod API (v3/v4 safe).
//
// Souvenir LINES are not validated here — the request form reuses the CRF's
// validateCrfForm so quantity / SKU / stock rules stay identical to a CRF.
//
// fulfillmentType / shippingAddress: the address block is only required when
// fulfillmentType is "SHIPPED" — enforced with superRefine rather than a
// discriminated union, so the form can keep one flat `values` object and
// just hide/show the address fields.

import { z } from "zod";

import { HANDOUT_LIMITS } from "./handouts.constants";
import type { HandoutDetail } from "./handouts.types";

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
  addressLine1Required: "Address line 1 is required.",
  addressCityRequired: "City is required.",
  addressStateRequired: "State is required.",
  addressPincodeRequired: "PIN code is required.",
  addressPincodeInvalid: "Enter a valid 6-digit PIN code.",
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
/*                               Shipping address                             */
/* ========================================================================== */

// Same field set as the CRF shop's own shipping address (OrderForm.tsx),
// minus "company" — Handouts has no dealer/company recipient concept.
export const handoutShippingAddressSchema = z.object({
  line1: z.string().trim().min(1, HANDOUT_MESSAGES.addressLine1Required),
  line2: z.string().trim().optional().default(""),
  landmark: z.string().trim().optional().default(""),
  city: z.string().trim().min(1, HANDOUT_MESSAGES.addressCityRequired),
  district: z.string().trim().optional().default(""),
  state: z.string().trim().min(1, HANDOUT_MESSAGES.addressStateRequired),
  pincode: z
    .string()
    .trim()
    .min(1, HANDOUT_MESSAGES.addressPincodeRequired)
    .regex(/^\d{6}$/, HANDOUT_MESSAGES.addressPincodeInvalid),
  country: z.string().trim().optional().default("India"),
  gstin: z.string().trim().optional().default(""),
});

export type HandoutShippingAddressValues = z.input<
  typeof handoutShippingAddressSchema
>;
export type HandoutShippingAddressField = keyof HandoutShippingAddressValues;

// Same fields, no content rules — used only for the *edit-time* shape of
// the form's shippingAddress object (which is always present, as empty
// strings, even in HAND_DELIVERY mode). `.partial()` on the strict schema
// above would keep each field's own min()/regex() whenever a value is
// actually present (not undefined) — and an empty string IS present — so
// it would fail on every untouched field outside SHIPPED mode. Real
// content validation for SHIPPED happens only in the superRefine below,
// against the strict schema.
const handoutShippingAddressLooseSchema = z.object({
  line1: z.string().optional().default(""),
  line2: z.string().optional().default(""),
  landmark: z.string().optional().default(""),
  city: z.string().optional().default(""),
  district: z.string().optional().default(""),
  state: z.string().optional().default(""),
  pincode: z.string().optional().default(""),
  country: z.string().optional().default(""),
  gstin: z.string().optional().default(""),
});

export const EMPTY_HANDOUT_SHIPPING_ADDRESS: Required<HandoutShippingAddressValues> =
  {
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
    gstin: "",
  };

/* ========================================================================== */
/*                             Request details form                           */
/* ========================================================================== */

const handoutDetailsBaseSchema = z.object({
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
  fulfillmentType: z.enum(["HAND_DELIVERY", "SHIPPED"]),
  // Always present on values (so controlled inputs never go undefined);
  // only validated as a whole, against the strict schema, when
  // fulfillmentType is "SHIPPED" (below) — see handoutShippingAddressLooseSchema.
  shippingAddress: handoutShippingAddressLooseSchema,
});

export const handoutDetailsSchema = handoutDetailsBaseSchema.superRefine(
  (values, ctx) => {
    if (values.fulfillmentType !== "SHIPPED") return;
    const result = handoutShippingAddressSchema.safeParse(
      values.shippingAddress ?? {},
    );
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: ["shippingAddress", ...issue.path] });
      }
    }
  },
);

export type HandoutDetailsValues = z.input<typeof handoutDetailsBaseSchema>;
export type HandoutDetailsField = keyof HandoutDetailsValues;
// Keyed loosely (not Partial<Record<HandoutDetailsField, ...>>) so a nested
// "shippingAddress.line1" path from superRefine maps to its own key.
export type HandoutDetailsErrors = Record<string, string | undefined>;

export const EMPTY_HANDOUT_DETAILS: Required<HandoutDetailsValues> = {
  purpose: "",
  requiredBy: "",
  deliverTo: "",
  contactPhone: "",
  remarks: "",
  fulfillmentType: "HAND_DELIVERY",
  shippingAddress: EMPTY_HANDOUT_SHIPPING_ADDRESS,
};

/**
 * Builds form values from an existing request — used by the Resubmit wizard
 * (useHandoutForm) and by the detail page's read-only "Handout Info" tab
 * (HandoutDetailPage), so the two never drift on which fields map where.
 */
export const detailsFromHandout = (
  handout: HandoutDetail,
): Required<HandoutDetailsValues> => ({
  purpose: handout.purpose,
  requiredBy: handout.requiredBy.slice(0, 10),
  deliverTo: handout.deliverTo,
  contactPhone: handout.contactPhone,
  remarks: handout.remarks ?? "",
  fulfillmentType: handout.fulfillmentType,
  shippingAddress: {
    line1: handout.shippingAddress?.line1 ?? "",
    line2: handout.shippingAddress?.line2 ?? "",
    landmark: handout.shippingAddress?.landmark ?? "",
    city: handout.shippingAddress?.city ?? "",
    district: handout.shippingAddress?.district ?? "",
    state: handout.shippingAddress?.state ?? "",
    pincode: handout.shippingAddress?.pincode ?? "",
    country: handout.shippingAddress?.country ?? "India",
    gstin: handout.shippingAddress?.gstin ?? "",
  },
});

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

/**
 * Runs a schema and keeps only the first message per field path. A nested
 * issue (e.g. shippingAddress → line1) maps to the dotted key
 * "shippingAddress.line1" rather than collapsing to "shippingAddress", so a
 * specific address field can show its own inline error.
 */
export const parseWithFieldErrors = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
): ParseResult<z.output<TSchema>> => {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    errors[key] ??= issue.message;
  }
  return { success: false, errors };
};
