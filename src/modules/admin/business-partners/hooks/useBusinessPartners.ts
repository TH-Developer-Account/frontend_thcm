import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { ServerAxios } from "../../../../services/ServerAxios";
import type {
	ApiEnvelope,
	BPAddressFormState,
	BPAddressViewModel,
	BusinessPartnerContact,
	BusinessPartnerDetail,
	BusinessPartnerListApiResponse,
	BusinessPartnerListingParams,
	BusinessPartnerListingResult,
	BusinessPartnerListItem,
	CreateBusinessPartnerPayload,
	UpdateBusinessPartnerPeoplePayload,
	UpdateBusinessPartnerPayload,
} from "../utils/bp.types";
import {
	mapBusinessPartnerListItem,
	unwrapData,
	normalizeListingParams,
	mapBusinessPartnerView,
} from "../utils/businessPartner.mapper";

const API_URL = "/bp";

const EMPTY_ADDRESS_FORM: BPAddressFormState = {
	label: "",
	addressType: "",
	address: "",
};

const BUSINESS_PARTNER_QUERY_OPTIONS = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

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

export const useBusinessPartnerPeopleMutations = (
	businessPartnerId: string,
) => {
	const queryClient = useQueryClient();

	const contactsUrl = `${API_URL}/${encodeURIComponent(
		businessPartnerId,
	)}/contacts`;

	const refreshBusinessPartner = () =>
		queryClient.invalidateQueries({
			queryKey: businessPartnerKeys.detail(businessPartnerId),
		});

	const addPeopleMutation = useMutation({
		mutationFn: async (payload: UpdateBusinessPartnerPeoplePayload) => {
			const response = await ServerAxios.post<
				BusinessPartnerContact[] | ApiEnvelope<BusinessPartnerContact[]>
			>(contactsUrl, payload);

			return unwrapData(response.data);
		},
		onSuccess: refreshBusinessPartner,
	});

	const updatePeopleMutation = useMutation({
		mutationFn: async (payload: UpdateBusinessPartnerPeoplePayload) => {
			const response = await ServerAxios.patch<
				BusinessPartnerContact[] | ApiEnvelope<BusinessPartnerContact[]>
			>(contactsUrl, payload);

			return unwrapData(response.data);
		},
		onSuccess: refreshBusinessPartner,
	});

	const removeContactMutation = useMutation({
		mutationFn: async (contactId: string) => {
			await ServerAxios.delete(
				`${contactsUrl}/${encodeURIComponent(contactId)}`,
			);

			return contactId;
		},
		onSuccess: refreshBusinessPartner,
	});

	return {
		addPeople: addPeopleMutation.mutateAsync,
		updatePeople: updatePeopleMutation.mutateAsync,
		removeContact: removeContactMutation.mutateAsync,

		isAddingPeople: addPeopleMutation.isPending,
		isUpdatingPeople: updatePeopleMutation.isPending,
		isRemovingContact: removeContactMutation.isPending,

		addPeopleError: addPeopleMutation.error,
		updatePeopleError: updatePeopleMutation.error,
		removeContactError: removeContactMutation.error,
	};
};
