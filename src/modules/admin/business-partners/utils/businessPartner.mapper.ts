import type {
	BusinessPartner,
	BusinessPartnerDetail,
	BusinessPartnerListApiItem,
} from "./bp.types";
const text = (value: unknown): string =>
	typeof value === "string" ? value.trim() : "";
export const mapBusinessPartnerListItem = (
	item: BusinessPartnerListApiItem,
): BusinessPartner => ({
	id: item.id,
	internalId: item.bpShortName || item.id,
	externalId: item.gst || "",
	organizationName: item.bpName,
	region: item.officeType.replaceAll("_", " "),
	mainContact: "",
	address: "",
	joinedOn: null,
	officeType: item.officeType,
	bpType: item.bpType,
	gst: item.gst || "",
	status: item.isActive ? "Active" : "Inactive",
});
export const getPrimaryContact = (partner?: BusinessPartnerDetail) => {
	const contacts = partner?.contacts ?? [];
	return (
		contacts.find((contact) =>
			Boolean(contact.isDefault ?? contact.isPrimary ?? contact.isMainContact),
		) ?? contacts[0]
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
