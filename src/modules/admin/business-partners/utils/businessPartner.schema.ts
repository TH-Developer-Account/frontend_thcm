import { z } from "zod";

import { businessPartnerContent } from "../../../../content/businessPartner.content";
import type {
	// BusinessPartnerAddressType,
	BusinessPartnerEntityType,
	BusinessPartnerOfficeType,
	BusinessPartnerType,
} from "../utils/bp.types";

import {
	GSTIN_REGEX,
	MOBILE_REGEX,
	PAN_REGEX,
	PIN_CODE_REGEX,
	getGstinPanMatchStatus,
} from "../../../../utils/form.validation";
const messages = businessPartnerContent.validation;

// -----------------------------------------------------------------------------
// Enum sources — kept in sync with the unions in bp.types.ts via `satisfies`.
// -----------------------------------------------------------------------------

const BUSINESS_PARTNER_TYPES = [
	"DEALER",
	"CUSTOMER",
	"TATA-Hitachi",
	"PLANT",
] as const satisfies readonly BusinessPartnerType[];

const OFFICE_TYPES = [
	"HEAD_OFFICE",
	"BRANCH_OFFICE",
] as const satisfies readonly BusinessPartnerOfficeType[];

const ENTITY_TYPES = [
	"COMPANY",
	"PARTNERSHIP",
	"PROPRIETORSHIP",
	"INDIVIDUAL",
	"OTHER",
] as const satisfies readonly BusinessPartnerEntityType[];

// const ADDRESS_TYPES = [
// 	"HEAD_OFFICE",
// 	"BRANCH_OFFICE",
// 	"PLANT",
// 	"BILLING_ADDRESS",
// 	"SHIPPING_ADDRESS",
// 	"WAREHOUSE",
// ] as const satisfies readonly BusinessPartnerAddressType[];

// -----------------------------------------------------------------------------
// Shared field helpers
// -----------------------------------------------------------------------------

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEBSITE_PATTERN = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i;

const optionalText = z.string().trim();

/**
 * Required-select check. Deliberately NOT written as `v !== ""`: TS 5.5+
 * infers that as a type predicate, which makes Zod narrow the schema's
 * output type (dropping "") while RHF defaults still need "". Keeping input
 * and output types identical avoids resolver/useForm generic mismatches
 * across @hookform/resolvers versions.
 */
const isSelected = (value: string): boolean => value.length > 0;

const requiredText = (message: string) => z.string().trim().min(1, message);

/** Empty string or a valid YYYY-MM-DD date (what formatDateOnlyAPI produces). */
const optionalIsoDate = z
	.string()
	.trim()
	.refine(
		(value) =>
			value === "" ||
			(ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value))),
		messages.invalidDate,
	);

// -----------------------------------------------------------------------------
// Mobile number — input mask (used by the field's onChange, not by Zod)
// -----------------------------------------------------------------------------

/**
 * Digits only, max 10. A pasted "+91 98765 43210" (12 digits) or
 * "09876543210" (11 digits) is reduced to the 10-digit number. The rule
 * itself stays in the schema (INDIAN_MOBILE_PATTERN) — this only shapes
 * what the user can type.
 */
export const normalizeMobileInput = (raw: string): string => {
	const digits = raw.replace(/\D/g, "");

	if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
	if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);

	return digits.slice(0, 10);
};

export type CoordinateAxis = "latitude" | "longitude";

const COORDINATE_LIMITS: Record<CoordinateAxis, number> = {
	latitude: 90,
	longitude: 180,
};

const COORDINATE_HEMISPHERES: Record<CoordinateAxis, string> = {
	latitude: "NS",
	longitude: "EW",
};

const COORDINATE_NUMBER = String.raw`\d+(?:\.\d+)?`;

// [hemisphere] ±degrees [°] [hemisphere]
const DECIMAL_COORDINATE_PATTERN = new RegExp(
	String.raw`^([NSEW])?\s*([+-]?${COORDINATE_NUMBER})\s*°?\s*([NSEW])?$`,
);

// [hemisphere] ±degrees° minutes' [seconds"] [hemisphere]
const DMS_COORDINATE_PATTERN = new RegExp(
	String.raw`^([NSEW])?\s*([+-]?\d+)\s*°\s*(${COORDINATE_NUMBER})\s*'\s*(?:(${COORDINATE_NUMBER})\s*"\s*)?([NSEW])?$`,
);

const normalizeCoordinateText = (value: string): string =>
	value
		.trim()
		.toUpperCase()
		.replace(/[º˚]/g, "°")
		.replace(/[’‘′`´]/g, "'")
		.replace(/[”“″]/g, '"')
		.replace(/''/g, '"');

export const parseCoordinate = (
	value: string,
	axis: CoordinateAxis,
): number | null => {
	const text = normalizeCoordinateText(value);
	if (!text) return null;

	let prefix: string | undefined;
	let suffix: string | undefined;
	let rawDegrees: string;
	let minutes = 0;
	let seconds = 0;

	const decimalMatch = DECIMAL_COORDINATE_PATTERN.exec(text);
	const dmsMatch = decimalMatch ? null : DMS_COORDINATE_PATTERN.exec(text);

	if (decimalMatch) {
		prefix = decimalMatch[1];
		rawDegrees = decimalMatch[2] ?? "";
		suffix = decimalMatch[3];
	} else if (dmsMatch) {
		const rawSeconds = dmsMatch[4];
		prefix = dmsMatch[1];
		rawDegrees = dmsMatch[2] ?? "";
		minutes = Number(dmsMatch[3]);
		seconds = rawSeconds === undefined ? 0 : Number(rawSeconds);
		suffix = dmsMatch[5];

		// Fractional minutes are only valid when there are no seconds.
		if (rawSeconds !== undefined && !Number.isInteger(minutes)) return null;
		if (minutes >= 60 || seconds >= 60) return null;
	} else {
		return null;
	}

	if (prefix && suffix) return null;

	const hemisphere = prefix ?? suffix;
	const hasSign = /^[+-]/.test(rawDegrees);

	if (hemisphere) {
		if (!COORDINATE_HEMISPHERES[axis].includes(hemisphere)) return null;
		// "-41°N" is ambiguous — reject instead of picking one.
		if (hasSign) return null;
	}

	const magnitude =
		Math.abs(Number(rawDegrees)) + minutes / 60 + seconds / 3600;
	const isNegative =
		rawDegrees.startsWith("-") || hemisphere === "S" || hemisphere === "W";
	const decimalDegrees = isNegative ? -magnitude : magnitude;

	if (
		!Number.isFinite(decimalDegrees) ||
		Math.abs(decimalDegrees) > COORDINATE_LIMITS[axis]
	) {
		return null;
	}

	return decimalDegrees;
};

const optionalCoordinate = (axis: CoordinateAxis, message: string) =>
	z
		.string()
		.trim()
		.refine(
			(value) => value === "" || parseCoordinate(value, axis) !== null,
			message,
		);

/** Optional GSTIN: empty, or a structurally valid GSTIN (case-insensitive). */
const optionalGstin = z
	.string()
	.trim()
	.refine(
		(value) => value === "" || GSTIN_REGEX.test(value.toUpperCase()),
		messages.gstInvalid,
	);

/** Optional PAN: empty, or a structurally valid PAN (case-insensitive). */
const optionalPan = z
	.string()
	.trim()
	.refine(
		(value) => value === "" || PAN_REGEX.test(value.toUpperCase()),
		messages.panInvalid,
	);

/**
 * GSTIN embeds the PAN (chars 3–12). Same rule Vendor Onboarding uses.
 * getGstinPanMatchStatus returns "incomplete" unless both are individually
 * valid, so this never stacks on a format error or fires when one is empty.
 */
const refineGstPanMatch = (
	values: { gst: string; panNumber: string },
	ctx: z.RefinementCtx,
) => {
	if (getGstinPanMatchStatus(values.gst, values.panNumber) === "mismatch") {
		ctx.addIssue({
			code: "custom",
			path: ["panNumber"],
			message: messages.panGstMismatch,
		});
	}
};

export const bpOrganizationTaxSchema = z
	.object({
		gst: optionalGstin,
		panNumber: optionalPan,
	})
	.superRefine(refineGstPanMatch);

export type BPOrganizationTaxValues = z.infer<typeof bpOrganizationTaxSchema>;

export const BP_ORGANIZATION_TAX_FIELD_ORDER: Array<
	keyof BPOrganizationTaxValues
> = ["gst", "panNumber"];

export const bpGeneralInfoSchema = z
	.object({
		bpName: requiredText(messages.bpNameRequired),
		bpType: z
			.union([z.literal(""), z.enum(BUSINESS_PARTNER_TYPES)])
			.refine(isSelected, messages.bpTypeRequired),
		officeType: z
			.union([z.literal(""), z.enum(OFFICE_TYPES)])
			.refine(isSelected, messages.officeTypeRequired),
		parentId: optionalText,
		entityType: z.union([z.literal(""), z.enum(ENTITY_TYPES)]),
		joinedOn: optionalIsoDate,
		legalTradeName: optionalText,
		gst: optionalGstin,
		panNumber: optionalPan,
	})
	.superRefine((values, ctx) => {
		// Existing business rule: a branch office must point at its parent BP.
		if (values.officeType === "BRANCH_OFFICE" && values.parentId === "") {
			ctx.addIssue({
				code: "custom",
				path: ["parentId"],
				message: messages.parentIdRequired,
			});
		}

		refineGstPanMatch(values, ctx);
	});

export type BPGeneralInfoFormValues = z.infer<typeof bpGeneralInfoSchema>;

export const BP_GENERAL_INFO_FIELD_ORDER: Array<keyof BPGeneralInfoFormValues> =
	[
		"bpName",
		"bpType",
		"officeType",
		"parentId",
		"entityType",
		"joinedOn",
		"legalTradeName",
		"gst",
		"panNumber",
	];

// -----------------------------------------------------------------------------
// Card 3 — Address Information (create only on this page; existing addresses
// keep using BPAddress / BPAddressFormCard)
// -----------------------------------------------------------------------------

export const bpAddressSchema = z.object({
	label: optionalText,
	// addressType: z
	// 	.union([z.literal(""), z.enum(ADDRESS_TYPES)])
	// 	.refine(isSelected, messages.addressTypeRequired),
	address: requiredText(messages.addressRequired),
	city: requiredText(messages.cityRequired),
	state: requiredText(messages.stateRequired),
	country: requiredText(messages.countryRequired),
	pincode: requiredText(messages.pincodeRequired).regex(
		PIN_CODE_REGEX,
		messages.pincodeInvalid,
	),
	region: optionalText,
	zone: optionalText,
	branch: optionalText,
	latitude: optionalCoordinate("latitude", messages.latitudeInvalid),
	longitude: optionalCoordinate("longitude", messages.longitudeInvalid),
	email: z
		.string()
		.trim()
		.refine(
			(value) => value === "" || z.string().email().safeParse(value).success,
			messages.emailInvalid,
		),
	// Still strips spaces/dashes so existing stored values like
	// "98765 43210" validate when an old address is edited; new input is
	// already digits-only via normalizeMobileInput.
	phoneNumber: z
		.string()
		.trim()
		.refine(
			(value) => value === "" || MOBILE_REGEX.test(value.replace(/[\s-]/g, "")),
			messages.phoneInvalid,
		),
	website: z
		.string()
		.trim()
		.refine(
			(value) => value === "" || WEBSITE_PATTERN.test(value),
			messages.websiteInvalid,
		),
	isDefault: z.boolean(),
});

export type BPAddressCardFormValues = z.infer<typeof bpAddressSchema>;

export const BP_ADDRESS_FIELD_ORDER: Array<keyof BPAddressCardFormValues> = [
	"label",
	"city",
	"state",
	"country",
	"pincode",
	"region",
	"zone",
	"branch",
	"latitude",
	"longitude",
	"email",
	"phoneNumber",
	"website",
	"address",
];
