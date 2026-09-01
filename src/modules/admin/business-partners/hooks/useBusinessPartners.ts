import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { ServerAxios } from "../../../../services/ServerAxios";

import type {
	BusinessPartner,
	BusinessPartnerAddress,
	BusinessPartnerBranch,
	BusinessPartnerContact,
	BusinessPartnerDetail,
	BusinessPartnerListingResult,
} from "../utils/bp.types";

const API_URL = "/bp";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export type BusinessPartnerListingParams = {
	search?: string;
	status?: string[];
	zone?: string[];
	page?: number;
	limit?: number;
};

export type CreateBusinessPartnerPayload = Omit<
	BusinessPartnerDetail,
	"id" | "branches" | "parent"
>;

export type UpdateBusinessPartnerPayload =
	Partial<CreateBusinessPartnerPayload>;

type ApiEnvelope<T> = {
	data: T;
};

type BusinessPartnerListApiResponse = {
	data?: BusinessPartnerListItem[];
	rows?: BusinessPartnerListItem[];
	total?: number;
	totalCount?: number;
	page?: number;
	page_index?: number;
	limit?: number;
	page_size?: number;
	totalPages?: number;
	total_pages?: number;
};

type BusinessPartnerListItem = {
	id: string;
	bpName: string;
	bpShortName?: string | null;
	officeType: BusinessPartnerDetail["officeType"];
	bpType: string;
	gst?: string | null;
	isActive: boolean;
	internalId?: string | null;
	externalId?: string | null;
	organizationName?: string | null;
	region?: string | null;
	mainContact?: string | null;
	address?: string | null;
	joinedOn?: string | null;
	status?: "Active" | "Inactive";
	bpId?: string | null;
	s4Id?: string | null;
	vendorId?: string | null;
};

export type BPAddressViewModel = {
	id: string;
	label: string;
	addressType: string;
	address: string;
	city: string;
	state: string;
	country: string;
	pincode: string;
	region: string;
	zone: string;
	branch: string;
	email: string;
	phoneNumber: string;
	website: string;
	isDefault: boolean;
};

export type BPContactViewModel = {
	id: string;
	name: string;
	email: string;
	phoneNumber: string;
	panNumber: string;
	role: "Owner" | "Main Contact" | "Contact";
	isOwner: boolean;
	isMainContact: boolean;
};

export type BPBranchViewModel = {
	id: string;
	name: string;
	status: "Active" | "Inactive";
};

export type BusinessPartnerViewModel = {
	partner: BusinessPartnerDetail;
	primaryAddress: BPAddressViewModel | null;
	primaryContact: BPContactViewModel | null;
	addresses: BPAddressViewModel[];
	people: BPContactViewModel[];
	mainContacts: BPContactViewModel[];
	branches: BPBranchViewModel[];
	contact: {
		name: string;
		email: string;
		mobileNumber: string;
		phone: string;
		fax: string;
		status: string;
		mainContactPerson: string;
		mainContactNumber: string;
		state: string;
		city: string;
		country: string;
	};
	organization: {
		orgName: string;
		joinedOn: string;
		branches: string;
		gstNo: string;
		panNo: string;
		registrationNo: string;
		bpCode: string;
		zone: string;
		segment: string;
		category: string;
		partnerType: string;
		status: string;
		website: string;
	};
};

const text = (value?: string | null): string => value?.trim() ?? "";

const mapAddress = (address: BusinessPartnerAddress): BPAddressViewModel => ({
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

const mapContact = (contact: BusinessPartnerContact): BPContactViewModel => ({
	id: contact.id,
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

const mapBranch = (branch: BusinessPartnerBranch): BPBranchViewModel => ({
	id: branch.id,
	name: text(branch.bpName) || "Unnamed branch",
	status: branch.isActive ? "Active" : "Inactive",
});

const mapBusinessPartnerView = (
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

const unwrapData = <T>(value: T | ApiEnvelope<T>): T => {
	if (typeof value === "object" && value !== null && "data" in value) {
		return value.data;
	}

	return value;
};

const normalizeListingParams = (
	params: BusinessPartnerListingParams,
): Required<BusinessPartnerListingParams> => ({
	search: params.search?.trim() ?? "",
	status: params.status ?? [],
	zone: params.zone ?? [],
	page: Math.max(params.page ?? DEFAULT_PAGE, 1),
	limit: Math.max(params.limit ?? DEFAULT_PAGE_SIZE, 1),
});

const mapBusinessPartnerListItem = (
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

const fetchBusinessPartners = async (
	params: Required<BusinessPartnerListingParams>,
): Promise<BusinessPartnerListingResult> => {
	const response = await ServerAxios.get<
		BusinessPartnerListApiResponse | BusinessPartnerListItem[]
	>(API_URL, {
		params: {
			search: params.search || undefined,
			status: params.status.length ? params.status : undefined,
			zone: params.zone.length ? params.zone : undefined,
			page: params.page,
			limit: params.limit,
		},
	});

	const body = response.data;
	const rawRows = Array.isArray(body) ? body : (body.rows ?? body.data ?? []);

	const rows = rawRows.map((item) => mapBusinessPartnerListItem(item));

	const totalCount = Array.isArray(body)
		? rows.length
		: (body.totalCount ?? body.total ?? rows.length);

	const page = Array.isArray(body)
		? params.page
		: (body.page ?? body.page_index ?? params.page);

	const limit = Array.isArray(body)
		? params.limit
		: (body.limit ?? body.page_size ?? params.limit);

	const totalPages = Array.isArray(body)
		? Math.max(Math.ceil(totalCount / limit), 1)
		: (body.totalPages ??
			body.total_pages ??
			Math.max(Math.ceil(totalCount / limit), 1));

	return {
		rows,
		totalCount,
		page,
		limit,
		totalPages,
	};
};

const fetchBusinessPartner = async (
	businessPartnerId: string,
): Promise<BusinessPartnerDetail> => {
	const response = await ServerAxios.get<
		BusinessPartnerDetail | ApiEnvelope<BusinessPartnerDetail>
	>(`${API_URL}/${encodeURIComponent(businessPartnerId)}`);

	return unwrapData(response.data);
};

export const businessPartnerKeys = {
	all: ["business-partners"] as const,

	lists: () => [...businessPartnerKeys.all, "list"] as const,

	list: (params: Required<BusinessPartnerListingParams>) =>
		[...businessPartnerKeys.lists(), params] as const,

	details: () => [...businessPartnerKeys.all, "detail"] as const,

	detail: (businessPartnerId: string) =>
		[...businessPartnerKeys.details(), businessPartnerId] as const,
};

const BUSINESS_PARTNER_QUERY_OPTIONS = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

export const useBusinessPartnerListing = (
	params: BusinessPartnerListingParams = {},
) => {
	const normalizedParams = normalizeListingParams(params);

	return useQuery({
		queryKey: businessPartnerKeys.list(normalizedParams),
		queryFn: () => fetchBusinessPartners(normalizedParams),
		placeholderData: keepPreviousData,
		...BUSINESS_PARTNER_QUERY_OPTIONS,
	});
};

export const useBusinessPartner = (businessPartnerId?: string | null) => {
	const normalizedId = businessPartnerId?.trim() ?? "";

	return useQuery({
		queryKey: businessPartnerKeys.detail(normalizedId),
		queryFn: () => fetchBusinessPartner(normalizedId),
		enabled: Boolean(normalizedId),
		...BUSINESS_PARTNER_QUERY_OPTIONS,
	});
};

export const useBusinessPartnerView = (businessPartnerId?: string | null) => {
	const normalizedId = businessPartnerId?.trim() ?? "";

	return useQuery({
		queryKey: businessPartnerKeys.detail(normalizedId),
		queryFn: () => fetchBusinessPartner(normalizedId),
		select: mapBusinessPartnerView,
		enabled: Boolean(normalizedId),
		...BUSINESS_PARTNER_QUERY_OPTIONS,
	});
};

export const useBusinessPartnerMutations = () => {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: async (payload: CreateBusinessPartnerPayload) => {
			const response = await ServerAxios.post<
				BusinessPartnerDetail | ApiEnvelope<BusinessPartnerDetail>
			>(API_URL, payload);

			return unwrapData(response.data);
		},
		onSuccess: (createdPartner) => {
			queryClient.setQueryData(
				businessPartnerKeys.detail(createdPartner.id),
				createdPartner,
			);

			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.lists(),
			});
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({
			businessPartnerId,
			payload,
		}: {
			businessPartnerId: string;
			payload: UpdateBusinessPartnerPayload;
		}) => {
			const response = await ServerAxios.patch<
				BusinessPartnerDetail | ApiEnvelope<BusinessPartnerDetail>
			>(`${API_URL}/${encodeURIComponent(businessPartnerId)}`, payload);

			return unwrapData(response.data);
		},
		onSuccess: (updatedPartner) => {
			queryClient.setQueryData(
				businessPartnerKeys.detail(updatedPartner.id),
				updatedPartner,
			);

			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.lists(),
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (businessPartnerId: string) => {
			await ServerAxios.delete(
				`${API_URL}/${encodeURIComponent(businessPartnerId)}`,
			);

			return businessPartnerId;
		},
		onSuccess: (deletedPartnerId) => {
			queryClient.removeQueries({
				queryKey: businessPartnerKeys.detail(deletedPartnerId),
			});

			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.lists(),
			});
		},
	});

	const refreshBusinessPartners = () =>
		queryClient.invalidateQueries({
			queryKey: businessPartnerKeys.lists(),
		});

	const refreshBusinessPartner = (businessPartnerId: string) =>
		queryClient.invalidateQueries({
			queryKey: businessPartnerKeys.detail(businessPartnerId),
		});

	return {
		createBusinessPartner: createMutation.mutateAsync,
		updateBusinessPartner: updateMutation.mutateAsync,
		deleteBusinessPartner: deleteMutation.mutateAsync,

		refreshBusinessPartners,
		refreshBusinessPartner,

		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,

		createError: createMutation.error,
		updateError: updateMutation.error,
		deleteError: deleteMutation.error,
	};
};

export type BPAddressFormState = {
	label: string;
	addressType: string;
	address: string;
};

const EMPTY_ADDRESS_FORM: BPAddressFormState = {
	label: "",
	addressType: "",
	address: "",
};

export const useBPAddressManager = (initialAddresses: BPAddressViewModel[]) => {
	const [addresses, setAddresses] = useState<BPAddressViewModel[]>(
		() => initialAddresses,
	);

	const [form, setForm] = useState<BPAddressFormState>(EMPTY_ADDRESS_FORM);

	const [editingId, setEditingId] = useState<string | null>(null);

	const defaultAddress = useMemo(
		() =>
			addresses.find((address) => address.isDefault) ?? addresses[0] ?? null,
		[addresses],
	);

	const otherAddresses = useMemo(
		() => addresses.filter((address) => address.id !== defaultAddress?.id),
		[addresses, defaultAddress?.id],
	);

	const handleChange = useCallback(
		(key: keyof BPAddressFormState, value: string) => {
			setForm((current) => ({
				...current,
				[key]: value,
			}));
		},
		[],
	);

	const resetForm = useCallback(() => {
		setForm(EMPTY_ADDRESS_FORM);
		setEditingId(null);
	}, []);

	const handleAddAddress = useCallback(() => {
		const normalizedAddress = form.address.trim();

		if (!normalizedAddress) return;

		if (editingId) {
			setAddresses((current) =>
				current.map((address) =>
					address.id === editingId
						? {
								...address,
								label: form.label.trim(),
								addressType: form.addressType,
								address: normalizedAddress,
							}
						: address,
				),
			);

			resetForm();
			return;
		}

		const newAddress: BPAddressViewModel = {
			id: crypto.randomUUID(),
			label: form.label.trim() || "New Address",
			addressType: form.addressType || "Business Address",
			address: normalizedAddress,

			city: "",
			state: "",
			country: "",
			pincode: "",
			region: "",
			zone: "",
			branch: "",
			email: "",
			phoneNumber: "",
			website: "",

			isDefault: addresses.length === 0,
		};

		setAddresses((current) => [...current, newAddress]);

		resetForm();
	}, [addresses.length, editingId, form, resetForm]);

	const handleEditAddress = useCallback(
		(addressId: string) => {
			const target = addresses.find((address) => address.id === addressId);

			if (!target) return;

			setForm({
				label: target.label,
				addressType: target.addressType,
				address: target.address,
			});

			setEditingId(target.id);
		},
		[addresses],
	);

	const handleSetDefault = useCallback((addressId: string) => {
		setAddresses((current) =>
			current.map((address) => ({
				...address,
				isDefault: address.id === addressId,
			})),
		);
	}, []);

	const handleRemoveAddress = useCallback(
		(addressId: string) => {
			setAddresses((current) => {
				const target = current.find((address) => address.id === addressId);

				if (!target || target.isDefault) {
					return current;
				}

				return current.filter((address) => address.id !== addressId);
			});

			if (editingId === addressId) {
				resetForm();
			}
		},
		[editingId, resetForm],
	);

	return {
		form,
		addresses,
		defaultAddress,
		otherAddresses,
		editingId,
		isEditing: Boolean(editingId),

		handleChange,
		handleAddAddress,
		handleEditAddress,
		handleSetDefault,
		handleRemoveAddress,
		resetForm,
	};
};
