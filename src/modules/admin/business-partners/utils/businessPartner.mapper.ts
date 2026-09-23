import type { User } from "../../user-profile/types/profile.types";
import type {
	BPAddressCardFormValues,
	BPGeneralInfoFormValues,
} from "../utils/businessPartner.schema";
import {
	formatDateOnlyAPI,
	parseDateOnly,
	toPrismaDateTime,
} from "../../../../utils/format";
import type {
	ApiEnvelope,
	BPAddressFormState,
	BPAddressViewModel,
	BPBranchViewModel,
	BPContactViewModel,
	BusinessPartner,
	BusinessPartnerAddress,
	BusinessPartnerAddressPayload,
	BusinessPartnerBranch,
	BusinessPartnerContact,
	BusinessPartnerDetail,
	BusinessPartnerListingParams,
	BusinessPartnerListItem,
	BusinessPartnerViewModel,
	UpdateBusinessPartnerPeoplePayload,
	BusinessPartnerFormState,
	CreateBusinessPartnerPayload,
	UpdateBusinessPartnerPayload,
	BPPeopleSelection,
	BPPersonViewModel,
	BPUserRow,
	BPUserViewModel,
	NormalizedBusinessPartnerListingParams,
} from "./bp.types";

const text = (value: unknown): string =>
	typeof value === "string" ? value.trim() : "";

/**
 * Form date-only string -> ISO DateTime Prisma accepts ("2026-09-01T00:00:00.000Z").
 * Accepts YYYY-MM-DD and DD-MM-YYYY; empty/invalid -> null.
 */
const toApiDateTime = (value?: string | null): string | null => {
	const date = parseDateOnly(value?.trim());
	return date ? toPrismaDateTime(formatDateOnlyAPI(date)) : null;
};

export const mapBusinessPartnerListItem = (
	item: BusinessPartnerListItem,
): BusinessPartner => ({
	id: item.id,
	bpShortName: item.bpShortName ?? "",
	internalId: item.internalId ?? item.bpId ?? item.s4Id ?? "",
	externalId: item.externalId ?? item.vendorId ?? "",
	organizationName: item.organizationName ?? item.bpName ?? "",
	region: item.region ?? "",
	mainContact: item.mainContact ?? "",
	address: item.address ?? "",
	joinedOn: item.joinedOn ?? null,
	officeType: item.officeType,
	bpType: item.bpType,
	gst: item.gst ?? "",
	status: item.status ?? (item.isActive ? "Active" : "Inactive"),
});

export const getPrimaryContact = (partner?: BusinessPartnerDetail) => {
	const contacts = partner?.contacts ?? [];
	return (
		contacts.find((contact) => Boolean(contact.isMainContact)) ?? contacts[0]
	);
};
export const getContactName = (contact?: Record<string, unknown>): string =>
	text(contact?.name) ||
	[text(contact?.firstName), text(contact?.lastName)].filter(Boolean).join(" ");
export const getContactPhone = (contact?: Record<string, unknown>): string =>
	text(contact?.mobileNumber) || text(contact?.mobile) || text(contact?.phone);
export const getAddressText = (address?: Record<string, unknown>): string =>
	[
		address?.address,
		address?.addressLine1,
		address?.addressLine2,
		address?.city,
		address?.state,
		address?.country,
		address?.postalCode ?? address?.pinCode,
	]
		.map(text)
		.filter(Boolean)
		.join(", ");

export const mapContact = (
	contact: BusinessPartnerContact,
): BPContactViewModel => ({
	id: contact.id,
	userId: contact.userId ?? null,
	businessPartnerId: contact.businessPartnerId,

	name: text(contact.name) || "Unnamed contact",
	email: text(contact.email),
	phoneNumber: text(contact.phoneNumber),
	panNumber: text(contact.panNumber),

	role: contact.isOwner
		? "Owner"
		: contact.isMainContact
			? "Main Contact"
			: "Contact",

	isOwner: contact.isOwner,
	isMainContact: contact.isMainContact,
	isDefault: contact.isDefault,
});

/** Maps the API's `contacts` array into BPContactViewModel[]. */
export const mapContacts = (
	contacts: BusinessPartnerContact[] | undefined,
): BPContactViewModel[] => (contacts ?? []).map(mapContact);

/** Maps a single "person" record — a linked user selection, distinct
 * from a contact (no phone/PAN/isOwner on people). */
export const mapPerson = (person: BPPeopleSelection): BPPersonViewModel => ({
	userId: person.userId,
	name: text(person.name) || "Unnamed person",
	email: text(person.email),
	isOwner: person.isOwner,
	isMainContact: person.isMainContact,
	isDefault: person.isDefault,
	phoneNumber: person.phoneNumber,
	panNumber: person.panNumber,
	id: person.id,
	role: person.role,
	businessPartnerId: person.businessPartnerId,
});

/** Maps the API's `people` array into BPPersonViewModel[]. */
export const mapPeople = (
	people: BPPeopleSelection[] | undefined,
): BPPersonViewModel[] => (people ?? []).map(mapPerson);

/** Maps a raw GET /users row (see BPUserRow) into the BP Users tab's
 * view model. Used only by businessPartnerApi.getUsers. */
export const mapBPUser = (row: BPUserRow): BPUserViewModel => ({
	id: row.id,
	name:
		[text(row.first_name), text(row.last_name)].filter(Boolean).join(" ") ||
		"Unnamed user",
	email: text(row.email),
	phoneNumber: text(row.phone_number),
	role: text(row.role) || text(row.designation),
	department: text(row.department),
	isDefaultContact: Boolean(row.isDefaultContact),
	isActive: row.is_active !== false,
});

export const mapBranch = (
	branch: BusinessPartnerBranch,
): BPBranchViewModel => ({
	id: branch.id,
	name: text(branch.bpName) || "Unnamed branch",
	status: branch.isActive ? "Active" : "Inactive",
});

export const mapBusinessPartnerView = (
	partner: BusinessPartnerDetail,
): BusinessPartnerViewModel => {
	const addresses = (partner.addresses ?? []).map(mapAddress);
	const contacts = mapContacts(partner.contacts);
	const people = mapPeople(partner.people);
	const branches = (partner.branches ?? []).map(mapBranch);
	const primaryAddress =
		addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
	const primaryContact =
		contacts.find((contact) => contact.isMainContact) ?? contacts[0] ?? null;

	return {
		partner,
		primaryAddress,
		primaryContact,
		addresses,
		contacts,
		people,
		mainContacts: contacts.filter((contact) => contact.isMainContact),
		branches,
		contact: {
			name: text(partner.legalTradeName) || partner.bpName,
			email: primaryContact?.email || primaryAddress?.email || "",
			mobileNumber: primaryContact?.phoneNumber || "",
			phone: primaryAddress?.phoneNumber || "",
			fax: "",
			status: partner.isActive ? "Active" : "Inactive",
			mainContactPerson: primaryContact?.name || "",
			mainContactNumber: primaryContact?.phoneNumber || "",
			state: primaryAddress?.state || "",
			city: primaryAddress?.city || "",
			country: primaryAddress?.country || "",
		},
		organization: {
			orgName: text(partner.legalTradeName) || partner.bpName,
			joinedOn: text(partner.joinedOn),
			branches: String(branches.length),
			gstNo: text(partner.gst),
			panNo: text(partner.panNumber),
			registrationNo: text(partner.c4cId) || text(partner.bydId),
			bpCode: text(partner.vendorCode) || text(partner.internalId),
			zone: primaryAddress?.zone || partner.officeType.replaceAll("_", " "),
			segment: text(partner.entityType),
			category: partner.bpType,
			partnerType: partner.bpType,
			status: partner.isActive ? "Active" : "Inactive",
			website: primaryAddress?.website || "",
		},
	};
};

export const unwrapData = <T>(value: T | ApiEnvelope<T>): T => {
	if (typeof value === "object" && value !== null && "data" in value) {
		return value.data;
	}

	return value;
};

export const normalizeListingParams = (
	params: BusinessPartnerListingParams = {},
): NormalizedBusinessPartnerListingParams => ({
	search: params.search?.trim() ?? "",
	status: params.status ?? [],
	zone: params.zone ?? [],
	pageIndex: Math.max(params.pageIndex ?? 1, 1),
	pageSize: Math.max(params.pageSize ?? 20, 1),
});

// People mapping

export const mapAddBusinessPartnerContactPayload = (
	user: User,
): UpdateBusinessPartnerPeoplePayload => [
	{
		userId: user.id,
		isMainContact: false,
		isDefault: false,
	},
];

export const mapPeopleToPayload = (
	people: BPPeopleSelection[],
	mainContactUserId?: string,
	defaultContactUserId?: string,
): UpdateBusinessPartnerPeoplePayload =>
	people.map((person) => ({
		userId: person.userId,
		isMainContact: mainContactUserId
			? person.userId === mainContactUserId
			: person.isMainContact,
		isDefault: defaultContactUserId
			? person.userId === defaultContactUserId
			: person.isDefault,
	}));

// Address mapping

export const formatAddressType = (value: string): string =>
	value
		.toLowerCase()
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

export const mapAddress = (
	address: BusinessPartnerAddress,
): BPAddressViewModel => {
	// const addressType = address.addressType ?? "HEAD_OFFICE";

	return {
		id: address.id,
		businessPartnerId: address.businessPartnerId,

		label: address.isDefault ? "Default Address" : "",
		// : formatAddressType(addressType),

		// addressType,
		address: text(address.address),

		city: text(address.city),
		state: text(address.state),
		country: text(address.country),
		pincode: text(address.pincode),
		region: text(address.region),
		zone: text(address.zone),
		branch: text(address.branch),

		latitude: address.latitude || null,
		longitude: address.longitude || null,

		email: text(address.email),
		phoneNumber: text(address.phoneNo),
		website: text(address.website),

		isDefault: address.isDefault,
	};
};

const nullableText = (value: string | undefined | null): string | null =>
	value?.trim() || null;

const nullableNumber = (value: string | undefined | null): number | null => {
	if (!value) return null;

	const normalizedValue = value.trim();

	if (!normalizedValue) return null;

	const parsedValue = Number(normalizedValue);

	return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const mapAddressToForm = (
	address: BPAddressViewModel,
): BPAddressFormState => ({
	label: address.label,
	// addressType: address.addressType,
	copyFromAddressId: "",

	address: address.address,
	city: address.city,
	state: address.state,
	country: address.country,
	pincode: address.pincode,
	region: address.region,
	zone: address.zone,
	branch: address.branch,

	latitude: address.latitude?.toString() ?? "",
	longitude: address.longitude?.toString() ?? "",

	email: address.email,
	phoneNumber: address.phoneNumber,
	website: address.website,

	isDefault: address.isDefault,
});

export const mapAddressFormToPayload = (
	form: BPAddressFormState,
): BusinessPartnerAddressPayload => {
	// if (!form.addressType) {
	// 	throw new Error("Address type is required");
	// }

	const address = form.address.trim();

	if (!address) {
		throw new Error("Address is required");
	}

	return {
		// addressType: form.addressType,
		address,
		label: nullableText(form.label),
		city: nullableText(form.city),
		state: nullableText(form.state),
		country: nullableText(form.country),
		pincode: nullableText(form.pincode),
		region: nullableText(form.region),
		zone: nullableText(form.zone),
		branch: nullableText(form.branch),

		latitude: nullableNumber(form.latitude),
		longitude: nullableNumber(form.longitude),

		email: nullableText(form.email),
		phoneNo: nullableText(form.phoneNumber),
		website: nullableText(form.website),

		isDefault: form.isDefault,
	};
};

export const cleanText = (value?: string | null): string => value?.trim() ?? "";

export const toNullableNumber = (value?: string | null): number | null => {
	const normalizedValue = cleanText(value);

	if (!normalizedValue) return null;

	const parsedValue = Number(normalizedValue);

	return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const EMPTY_BUSINESS_PARTNER_FORM: BusinessPartnerFormState = {
	internalId: "",
	vendorId: "",
	bpId: "",
	s4Id: "",
	bydId: "",
	c4cId: "",

	bpName: "",
	bpShortName: "",
	legalTradeName: "",

	gst: "",
	panNumber: "",
	vendorCode: "",

	officeType: "",
	bpType: "",
	entityType: "",

	isKeyAccount: false,
	isActive: true,

	joinedOn: "",
	parentId: "",

	mobileNumber: "",
	email: "",
	fax: "",
	telephone: "",
	// mainContactName: "",
	// mainContactNumber: "",
};

export const mapBusinessPartnerToForm = (
	partner: BusinessPartnerDetail,
): BusinessPartnerFormState => ({
	internalId: cleanText(partner.internalId),
	vendorId: cleanText(partner.vendorId),
	bpId: cleanText(partner.bpId),
	s4Id: cleanText(partner.s4Id),
	bydId: cleanText(partner.bydId),
	c4cId: cleanText(partner.c4cId),

	bpName: cleanText(partner.bpName),
	bpShortName: cleanText(partner.bpShortName),
	legalTradeName: cleanText(partner.legalTradeName),

	gst: cleanText(partner.gst),
	panNumber: cleanText(partner.panNumber),
	vendorCode: cleanText(partner.vendorCode),

	officeType: partner.officeType,
	bpType: partner.bpType,
	entityType: partner.entityType ?? "",

	isKeyAccount: partner.isKeyAccount,
	isActive: partner.isActive,

	joinedOn: partner.joinedOn?.slice(0, 10) ?? "",
	parentId: cleanText(partner.parentId),

	mobileNumber: cleanText(partner.mobileNumber),
	email: cleanText(partner.email),
	fax: cleanText(partner.fax),
	telephone: cleanText(partner.telephone),
	// mainContactName: cleanText(partner.mainContactName),
	// mainContactNumber: cleanText(partner.mainContactNumber),
});

/**
 * GENERAL tab -> PATCH /bp/:id (editing an existing BP).
 */
export const mapGeneralFormToUpdatePayload = (
	form: BusinessPartnerFormState,
): UpdateBusinessPartnerPayload => {
	const internalId = form.internalId.trim();
	const bpName = form.bpName.trim();

	// if (!internalId) throw new Error("Internal ID is required");
	if (!bpName) throw new Error("Business partner name is required");
	if (!form.officeType) throw new Error("Office type is required");
	if (!form.bpType) throw new Error("Business partner type is required");

	if (form.officeType === "BRANCH_OFFICE" && !form.parentId.trim()) {
		throw new Error("Parent business partner is required for a branch");
	}

	return {
		internalId,
		bpName,
		bpShortName: nullableText(form.bpShortName),
		// officeType: form.officeType,
		bpType: form.bpType,
		isKeyAccount: form.isKeyAccount,
		isActive: form.isActive,
		// parentId: nullableText(form.parentId),
	};
};

/**
 * ORGANIZATION tab -> PATCH /bp/:id only (never used at creation time).
 */
export const mapOrganizationFormToUpdatePayload = (
	form: BusinessPartnerFormState,
): UpdateBusinessPartnerPayload => ({
	vendorId: nullableText(form.vendorId),
	bpId: nullableText(form.bpId),
	s4Id: nullableText(form.s4Id),
	bydId: nullableText(form.bydId),
	c4cId: nullableText(form.c4cId),
	legalTradeName: nullableText(form.legalTradeName),
	gst: nullableText(form.gst)?.toUpperCase() ?? null,
	panNumber: nullableText(form.panNumber)?.toUpperCase() ?? null,
	vendorCode: nullableText(form.vendorCode),
	entityType: form.entityType || null,
	joinedOn: toApiDateTime(form.joinedOn),
});

/**
 * CONTACT tab -> PATCH /bp/:id by default (same pattern as Organization).
 * If contact info ends up living on a dedicated resource instead,
 * this is the only function that needs to change — everything above
 * it (the hook, the form component) stays the same.
 */
export const mapContactFormToUpdatePayload = (
	form: BusinessPartnerFormState,
): UpdateBusinessPartnerPayload => ({
	mobileNumber: nullableText(form.mobileNumber),
	email: nullableText(form.email)?.toLowerCase() ?? null,
	fax: nullableText(form.fax),
	telephone: nullableText(form.telephone),
	// mainContactName: nullableText(form.mainContactName),
	// mainContactNumber: nullableText(form.mainContactNumber),
});

// -----------------------------------------------------------------------------
// Create/Update page cards (RHF + Zod). Values arriving here have already
// passed the Zod schema, so these functions only sanitize and reshape — they
// never validate for the user. The narrowing guards below exist purely for
// TypeScript and are unreachable after a successful schema parse.
// -----------------------------------------------------------------------------

export const EMPTY_BP_GENERAL_INFO_FORM: BPGeneralInfoFormValues = {
	bpName: "",
	bpType: "",
	officeType: "",
	parentId: "",
	entityType: "",
	joinedOn: "",
	legalTradeName: "",
};

export const mapPartnerToGeneralInfoForm = (
	partner: BusinessPartnerDetail,
): BPGeneralInfoFormValues => ({
	bpName: cleanText(partner.bpName),
	bpType: partner.bpType ?? "",
	officeType: partner.officeType ?? "",
	parentId: cleanText(partner.parentId),
	entityType: partner.entityType ?? "",
	joinedOn: partner.joinedOn?.slice(0, 10) ?? "",
	legalTradeName: cleanText(partner.legalTradeName),
});

const assertSelected = <T extends string>(
	value: T | "",
	fieldLabel: string,
): T => {
	if (!value) {
		throw new Error(`${fieldLabel} is required`);
	}

	return value;
};

/**
 * Card 1 (create) -> POST /business-partner.
 *
 * Identifier/tax fields stay null here (they're edited later from BPTabs'
 * Organization tab). isKeyAccount/isActive keep the previous create defaults.
 */
export const mapGeneralInfoFormToCreatePayload = (
	values: BPGeneralInfoFormValues,
): CreateBusinessPartnerPayload => {
	const officeType = assertSelected(values.officeType, "Office type");

	return {
		bpName: values.bpName.trim(),
		bpShortName: null,
		officeType,
		bpType: assertSelected(values.bpType, "Business partner type"),
		entityType: values.entityType || null,
		legalTradeName: nullableText(values.legalTradeName),
		joinedOn: toApiDateTime(values.joinedOn),
		isKeyAccount: false,
		isActive: true,
		// Only a branch office has a parent; never send a stale id for a head office.
		parentId:
			officeType === "BRANCH_OFFICE" ? nullableText(values.parentId) : null,

		vendorId: null,
		bpId: null,
		s4Id: null,
		bydId: null,
		c4cId: null,
		gst: null,
		panNumber: null,
		vendorCode: null,
	};
};

/**
 * Card 1 (update) -> PATCH /business-partner/:id.
 *
 * officeType and parentId are intentionally omitted — the existing
 * mapGeneralFormToUpdatePayload never sent them either, so the card renders
 * them read-only in update mode.
 */
export const mapGeneralInfoFormToUpdatePayload = (
	values: BPGeneralInfoFormValues,
): UpdateBusinessPartnerPayload => ({
	bpName: values.bpName.trim(),
	bpType: assertSelected(values.bpType, "Business partner type"),
	entityType: values.entityType || null,
	legalTradeName: nullableText(values.legalTradeName),
	joinedOn: toApiDateTime(values.joinedOn),
});

export const createEmptyAddressCardForm = (
	isDefault: boolean,
): BPAddressCardFormValues => ({
	label: "",
	// addressType: "",
	address: "",
	city: "",
	state: "",
	country: "India",
	pincode: "",
	region: "",
	zone: "",
	branch: "",
	latitude: "",
	longitude: "",
	email: "",
	phoneNumber: "",
	website: "",
	isDefault,
});

/** Card 3 -> POST /business-partner/:id/addresses. */
export const mapAddressCardFormToPayload = (
	values: BPAddressCardFormValues,
): BusinessPartnerAddressPayload => {
	const phoneDigits = values.phoneNumber.replace(/\D/g, "");

	return {
		// addressType: assertSelected(values.addressType, "Address type"),
		address: values.address.trim(),
		label: nullableText(values.label),
		city: nullableText(values.city),
		state: nullableText(values.state),
		country: nullableText(values.country),
		pincode: nullableText(values.pincode),
		region: nullableText(values.region),
		zone: nullableText(values.zone),
		branch: nullableText(values.branch),

		latitude: toNullableNumber(values.latitude),
		longitude: toNullableNumber(values.longitude),

		email: nullableText(values.email)?.toLowerCase() ?? null,
		phoneNo: phoneDigits || null,
		website: nullableText(values.website),

		isDefault: values.isDefault,
	};
};
