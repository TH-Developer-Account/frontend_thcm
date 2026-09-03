import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
	businessPartnerApi,
	businessPartnerKeys,
} from "../api/businessPartner.api";

import {
	useBusinessPartnerAddressMutations,
	useBusinessPartnerPeopleMutations,
} from "./useBusinessPartnerMutations";

import {
	mapAddressFormToPayload,
	mapAddressToForm,
	mapPeopleToPayload,
} from "../utils/businessPartner.mapper";

import {
	DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
	type BPAddressFormState,
	type BPAddressPermissions,
	type BPAddressViewModel,
	type BPContactViewModel,
	type BPPeoplePermissions,
	type BusinessPartnerAddressPayload,
	type UpdateBusinessPartnerPeoplePayload,
} from "../utils/bp.types";

const BUSINESS_PARTNER_QUERY_OPTIONS = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

/* Business partner detail query */

export const useBusinessPartner = (businessPartnerId?: string | null) => {
	const normalizedId = businessPartnerId?.trim() ?? "";

	return useQuery({
		queryKey: businessPartnerKeys.detail(normalizedId),
		queryFn: () => businessPartnerApi.getById(normalizedId),
		enabled: Boolean(normalizedId),
		...BUSINESS_PARTNER_QUERY_OPTIONS,
	});
};

/* Address logic */

const EMPTY_ADDRESS_FORM: BPAddressFormState = {
	label: "",
	addressType: "",
	copyFromAddressId: "",

	address: "",
	city: "",
	state: "",
	country: "",
	pincode: "",
	region: "",
	zone: "",
	branch: "",

	latitude: "",
	longitude: "",

	email: "",
	phoneNumber: "",
	website: "",

	isDefault: false,
};

export const useBPAddressManager = (
	businessPartnerId: string,
	initialAddresses: BPAddressViewModel[],
	permissions: BPAddressPermissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS.address,
) => {
	const [form, setForm] = useState<BPAddressFormState>(() => ({
		...EMPTY_ADDRESS_FORM,
	}));

	const [editingId, setEditingId] = useState<string | null>(null);

	const {
		createAddress,
		updateAddress,
		deleteAddress,
		setDefaultAddress,

		isCreatingAddress,
		isUpdatingAddress,
		isDeletingAddress,
		isSettingDefault,

		createAddressError,
		updateAddressError,
		deleteAddressError,
		setDefaultAddressError,
	} = useBusinessPartnerAddressMutations(businessPartnerId);

	const defaultAddress = useMemo(
		() =>
			initialAddresses.find((address) => address.isDefault) ??
			initialAddresses[0] ??
			null,
		[initialAddresses],
	);

	const otherAddresses = useMemo(
		() =>
			initialAddresses.filter((address) => address.id !== defaultAddress?.id),
		[initialAddresses, defaultAddress?.id],
	);

	const handleChange = useCallback(
		<K extends keyof BPAddressFormState>(
			key: K,
			value: BPAddressFormState[K],
		) => {
			setForm((current) => ({
				...current,
				[key]: value,
			}));
		},
		[],
	);

	const resetForm = useCallback(() => {
		setForm({
			...EMPTY_ADDRESS_FORM,
		});

		setEditingId(null);
	}, []);

	const handleCopyAddress = useCallback(
		(sourceAddressId: string) => {
			const sourceAddress = initialAddresses.find(
				(address) => address.id === sourceAddressId,
			);

			if (!sourceAddress) {
				setForm((current) => ({
					...current,
					copyFromAddressId: "",
				}));

				return;
			}

			setForm((current) => ({
				...current,

				label: current.label,
				addressType: current.addressType,
				copyFromAddressId: sourceAddressId,

				address: sourceAddress.address,
				city: sourceAddress.city ?? "",
				state: sourceAddress.state ?? "",
				country: sourceAddress.country ?? "",
				pincode: sourceAddress.pincode ?? "",
				region: sourceAddress.region ?? "",
				zone: sourceAddress.zone ?? "",
				branch: sourceAddress.branch ?? "",

				latitude: sourceAddress.latitude?.toString() ?? "",
				longitude: sourceAddress.longitude?.toString() ?? "",

				email: sourceAddress.email ?? "",
				phoneNumber: sourceAddress.phoneNumber ?? "",
				website: sourceAddress.website ?? "",

				isDefault: false,
			}));
		},
		[initialAddresses],
	);

	const handleEditAddress = useCallback(
		(addressId: string) => {
			if (!permissions.canUpdateAddress) {
				return;
			}

			const address = initialAddresses.find((item) => item.id === addressId);

			if (!address) {
				return;
			}

			setForm(mapAddressToForm(address));
			setEditingId(address.id);
		},
		[permissions.canUpdateAddress, initialAddresses],
	);

	const handleAddAddress = useCallback(async () => {
		const canSubmit = editingId
			? permissions.canUpdateAddress
			: permissions.canCreateAddress;

		if (!canSubmit) {
			return;
		}

		let payload: BusinessPartnerAddressPayload;

		try {
			payload = mapAddressFormToPayload(form);
		} catch {
			return;
		}

		try {
			if (editingId) {
				await updateAddress({
					addressId: editingId,
					payload,
				});
			} else {
				await createAddress(payload);
			}

			resetForm();
		} catch {
			/*
			 * The mutation exposes the error.
			 * Keep the form open for retry.
			 */
		}
	}, [
		permissions.canCreateAddress,
		permissions.canUpdateAddress,
		createAddress,
		editingId,
		form,
		resetForm,
		updateAddress,
	]);

	const handleSetDefault = useCallback(
		async (addressId: string) => {
			if (!permissions.canSetDefaultAddress) {
				return;
			}

			try {
				await setDefaultAddress(addressId);
			} catch {
				// Mutation exposes the error.
			}
		},
		[permissions.canSetDefaultAddress, setDefaultAddress],
	);

	const handleRemoveAddress = useCallback(
		async (addressId: string) => {
			if (!permissions.canDeleteAddress) {
				return;
			}

			const target = initialAddresses.find(
				(address) => address.id === addressId,
			);

			if (!target || target.isDefault) {
				return;
			}

			try {
				await deleteAddress(addressId);

				if (editingId === addressId) {
					resetForm();
				}
			} catch {
				// Mutation exposes the error.
			}
		},
		[
			permissions.canDeleteAddress,
			deleteAddress,
			editingId,
			initialAddresses,
			resetForm,
		],
	);

	return {
		form,
		defaultAddress,
		otherAddresses,
		editingId,
		isEditing: Boolean(editingId),

		handleChange,
		handleCopyAddress,
		handleAddAddress,
		handleEditAddress,
		handleSetDefault,
		handleRemoveAddress,
		resetForm,

		isSaving: isCreatingAddress || isUpdatingAddress,
		isDeleting: isDeletingAddress,
		isSettingDefault,

		createAddressError,
		updateAddressError,
		deleteAddressError,
		setDefaultAddressError,

		canCreateAddress: permissions.canCreateAddress,
		canUpdateAddress: permissions.canUpdateAddress,
		canDeleteAddress: permissions.canDeleteAddress,
		canSetDefaultAddress: permissions.canSetDefaultAddress,
	};
};

/* People logic */

const getPeoplePriority = (person: BPContactViewModel): number => {
	if (person.isOwner) {
		return 0;
	}

	if (person.isMainContact) {
		return 1;
	}

	return 2;
};

export const useBPPeopleManager = (
	businessPartnerId: string,
	people: BPContactViewModel[],
	permissions: BPPeoplePermissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS.people,
) => {
	const {
		addPeople,
		updatePeople,
		removeContact,

		isAddingPeople,
		isUpdatingPeople,
		isRemovingContact,

		addPeopleError,
		updatePeopleError,
		removeContactError,
	} = useBusinessPartnerPeopleMutations(businessPartnerId);

	const sortedPeople = useMemo(
		() =>
			[...people].sort(
				(firstPerson, secondPerson) =>
					getPeoplePriority(firstPerson) - getPeoplePriority(secondPerson),
			),
		[people],
	);

	const handleAddPeople = useCallback(
		async (payload: UpdateBusinessPartnerPeoplePayload) => {
			if (!permissions.canAddPeople) {
				return;
			}

			try {
				await addPeople(payload);
			} catch {
				// Mutation exposes the error.
			}
		},
		[permissions.canAddPeople, addPeople],
	);

	const handleSetMainContact = useCallback(
		async (person: BPContactViewModel) => {
			if (!permissions.canSetMainContact || person.isMainContact) {
				return;
			}

			const payload = mapPeopleToPayload(people, person.userId);

			try {
				await updatePeople(payload);
			} catch {
				// Mutation exposes the error.
			}
		},
		[permissions.canSetMainContact, people, updatePeople],
	);

	const handleRemovePerson = useCallback(
		async (person: BPContactViewModel) => {
			if (!permissions.canRemovePeople || person.isOwner) {
				return;
			}

			try {
				await removeContact(person.id);
			} catch {
				// Mutation exposes the error.
			}
		},
		[permissions.canRemovePeople, removeContact],
	);

	return {
		sortedPeople,

		handleAddPeople,
		handleSetMainContact,
		handleRemovePerson,

		isAddingPeople,
		isUpdatingPeople,
		isRemovingContact,
		isPeopleMutationPending:
			isAddingPeople || isUpdatingPeople || isRemovingContact,

		addPeopleError,
		updatePeopleError,
		removeContactError,

		canAddPeople: permissions.canAddPeople,
		canSetMainContact: permissions.canSetMainContact,
		canRemovePeople: permissions.canRemovePeople,
	};
};
