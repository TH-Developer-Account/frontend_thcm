import type { User } from "../../user-profile/types/profile.types";
import type {
	ApiEnvelope,
	BPAddressViewModel,
	BPBranchViewModel,
	BPContactViewModel,
	BusinessPartner,
	BusinessPartnerAddress,
	BusinessPartnerBranch,
	BusinessPartnerContact,
	BusinessPartnerDetail,
	BusinessPartnerListingParams,
	BusinessPartnerListItem,
	BusinessPartnerViewModel,
	UpdateBusinessPartnerPeoplePayload,
} from "./bp.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const text = (value: unknown): string =>
	typeof value === "string" ? value.trim() : "";

export const mapBusinessPartnerListItem = (
	item: BusinessPartnerListItem,
): BusinessPartner => ({
	id: item.id,
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

export const mapAddress = (
	address: BusinessPartnerAddress,
): BPAddressViewModel => ({
	id: address.id,
	label: address.isDefault
		? "Default Address"
		: text(address.branch) || "Address",
	addressType: text(address.branch) || "Business Address",
	address: text(address.address),
	city: text(address.city),
	state: text(address.state),
	country: text(address.country),
	pincode: text(address.pincode),
	region: text(address.region),
	zone: text(address.zone),
	branch: text(address.branch),
	email: text(address.email),
	phoneNumber: text(address.phoneNo),
	website: text(address.website),
	isDefault: address.isDefault,
});

export const mapContact = (
	contact: BusinessPartnerContact,
): BPContactViewModel => ({
	id: contact.id,
	userId: contact.userId,
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
	const people = (partner.contacts ?? []).map(mapContact);
	const branches = (partner.branches ?? []).map(mapBranch);
	const primaryAddress =
		addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
	const primaryContact =
		people.find((contact) => contact.isMainContact) ?? people[0] ?? null;

	return {
		partner,
		primaryAddress,
		primaryContact,
		addresses,
		people,
		mainContacts: people.filter((contact) => contact.isMainContact),
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
	params: BusinessPartnerListingParams,
): Required<BusinessPartnerListingParams> => ({
	search: params.search?.trim() ?? "",
	status: params.status ?? [],
	zone: params.zone ?? [],
	page: Math.max(params.page ?? DEFAULT_PAGE, 1),
	limit: Math.max(params.limit ?? DEFAULT_PAGE_SIZE, 1),
});

export const mapAddBusinessPartnerContactPayload = (
	user: User,
): UpdateBusinessPartnerPeoplePayload => [
	{
		userId: user.id,
		isMainContact: false,
	},
];

export const mapPeopleToPayload = (
	people: BPContactViewModel[],
	mainContactUserId: string,
): UpdateBusinessPartnerPeoplePayload =>
	people.map((person) => ({
		userId: person.userId,
		isMainContact: person.userId === mainContactUserId,
	}));
