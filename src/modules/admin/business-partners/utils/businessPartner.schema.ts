import { z } from "zod";

import { businessPartnerContent } from "../../../../content/businessPartner.content";
import type {
	// BusinessPartnerAddressType,
	BusinessPartnerEntityType,
	BusinessPartnerOfficeType,
	BusinessPartnerType,
} from "../utils/bp.types";

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
const INDIAN_PIN_PATTERN = /^[1-9]\d{5}$/;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
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

/** Empty string or a valid YYYY-MM-DD date (what formatDateOnly produces). */
const optionalIsoDate = z
	.string()
	.trim()
	.refine(
		(value) =>
			value === "" ||
			(ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value))),
		messages.invalidDate,
	);

const optionalCoordinate = (limit: number, message: string) =>
	z
		.string()
		.trim()
		.refine((value) => {
			if (value === "") return true;
			const parsed = Number(value);
			return Number.isFinite(parsed) && Math.abs(parsed) <= limit;
		}, message);

// -----------------------------------------------------------------------------
// Card 1 — General Information (create + update)
//
// Selects start as "" (nothing chosen), so each enum is unioned with "" and a
// refine rejects the empty choice for required selects. The resulting type
// matches the existing `X | ""` convention in BusinessPartnerFormState.
// -----------------------------------------------------------------------------

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
	})
	.superRefine((values, ctx) => {
		// Existing business rule (previously enforced only by the mapper
		// throwing): a branch office must point at its parent BP.
		if (values.officeType === "BRANCH_OFFICE" && values.parentId === "") {
			ctx.addIssue({
				code: "custom",
				path: ["parentId"],
				message: messages.parentIdRequired,
			});
		}
	});

export type BPGeneralInfoFormValues = z.infer<typeof bpGeneralInfoSchema>;

/** Field order used to focus the first invalid field on submit. */
export const BP_GENERAL_INFO_FIELD_ORDER: Array<keyof BPGeneralInfoFormValues> =
	[
		"bpName",
		"bpType",
		"officeType",
		"parentId",
		"entityType",
		"joinedOn",
		"legalTradeName",
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
		INDIAN_PIN_PATTERN,
		messages.pincodeInvalid,
	),
	region: optionalText,
	zone: optionalText,
	branch: optionalText,
	latitude: optionalCoordinate(90, messages.latitudeInvalid),
	longitude: optionalCoordinate(180, messages.longitudeInvalid),
	email: z
		.string()
		.trim()
		.refine(
			(value) => value === "" || z.string().email().safeParse(value).success,
			messages.emailInvalid,
		),
	phoneNumber: z
		.string()
		.trim()
		.refine(
			(value) =>
				value === "" || INDIAN_MOBILE_PATTERN.test(value.replace(/[\s-]/g, "")),
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
