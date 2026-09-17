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
	type BPPeopleSelection,
	type BPContactViewModel,
	type BPPersonViewModel,
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

/* -------------------------------------------------------------------------
 * Contact tab (BPContact.tsx) — list logic for BPContactViewModel rows.
 *
 * Deliberately NOT shared with useBPPeopleManager below, even though
 * the two started out structurally similar: contacts carry
 * contact-specific fields (phone, PAN) and their own add flow (search
 * existing user OR add manually), and are expected to diverge further
 * as contact-specific features (e.g. editing manual contacts) are
 * added. Keeping them separate avoids threading a shared abstraction
 * through unrelated future changes.
 * ---------------------------------------------------------------------- */

const getContactPriority = (contact: BPContactViewModel): number => {
	if (contact.isOwner) {
		return 0;
	}

	if (contact.isMainContact) {
		return 1;
	}

	return 2;
};

export const useBPContactsManager = (
	businessPartnerId: string,
	contacts: BPContactViewModel[],
	permissions: BPPeoplePermissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS.people,
) => {
	const {
		updatePeople,
		removeContact,

		isUpdatingPeople,
		isRemovingContact,

		updatePeopleError,
		removeContactError,
	} = useBusinessPartnerPeopleMutations(businessPartnerId);

	const sortedContacts = useMemo(
		() =>
			[...contacts].sort(
				(firstContact, secondContact) =>
					getContactPriority(firstContact) - getContactPriority(secondContact),
			),
		[contacts],
	);

	const handleSetMainContact = useCallback(
		async (contact: BPContactViewModel) => {
			if (
				!permissions.canSetMainContact ||
				contact.isMainContact ||
				!contact.userId
			) {
				return;
			}

			const linkedPeople: BPPeopleSelection[] = contacts
				.filter(
					(
						currentContact,
					): currentContact is BPContactViewModel & { userId: string } =>
						Boolean(currentContact.userId),
				)
				.map((currentContact) => ({
					userId: currentContact.userId,
					name: currentContact.name,
					email: currentContact.email ?? "",
					isOwner: currentContact.isOwner,
					isMainContact: currentContact.isMainContact,
					isDefault: currentContact.isDefault,
					id: currentContact.id,
					businessPartnerId:
						currentContact.businessPartnerId ?? businessPartnerId,
					phoneNumber: currentContact.phoneNumber,
					panNumber: currentContact.panNumber,
					role: currentContact.role,
				}));

			const payload = mapPeopleToPayload(linkedPeople, contact.userId);

			try {
				await updatePeople(payload);
			} catch {
				// Mutation exposes the error.
			}
		},
		[permissions.canSetMainContact, contacts, businessPartnerId, updatePeople],
	);

	const handleRemoveContact = useCallback(
		async (contact: BPContactViewModel) => {
			if (!permissions.canRemovePeople || contact.isOwner) {
				return;
			}

			try {
				await removeContact(contact.id);
			} catch {
				// Mutation exposes the error.
			}
		},
		[permissions.canRemovePeople, removeContact],
	);

	return {
		sortedContacts,

		handleSetMainContact,
		handleRemoveContact,

		isUpdatingContacts: isUpdatingPeople,
		isRemovingContact,
		isContactsMutationPending: isUpdatingPeople || isRemovingContact,

		updateContactsError: updatePeopleError,
		removeContactError,

		canSetMainContact: permissions.canSetMainContact,
		canRemoveContact: permissions.canRemovePeople,
	};
};

/* -------------------------------------------------------------------------
 * People tab (BPPeople.tsx) — list logic for BPPersonViewModel rows.
 *
 * Separate from useBPContactsManager above by design: people carry only
 * userId/name/email/isOwner/isMainContact/isDefault (no phone/PAN), and
 * the People tab's add flow only ever attaches existing users (see
 * useBPAddExistingPeopleForm below) — no manual-entry path. Kept apart
 * so contact-only features (manual entry, editing, phone/PAN fields)
 * never leak into this hook, and vice versa.
 * ---------------------------------------------------------------------- */

const getPersonPriority = (person: BPPersonViewModel): number => {
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
	people: BPPersonViewModel[],
	permissions: BPPeoplePermissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS.people,
) => {
	const {
		updatePeople,
		removeContact,

		isUpdatingPeople,
		isRemovingContact,

		updatePeopleError,
		removeContactError,
	} = useBusinessPartnerPeopleMutations(businessPartnerId);

	const sortedPeople = useMemo(
		() =>
			[...people].sort(
				(firstPerson, secondPerson) =>
					getPersonPriority(firstPerson) - getPersonPriority(secondPerson),
			),
		[people],
	);

	const handleSetMainContact = useCallback(
		async (person: BPPersonViewModel) => {
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
		async (person: BPPersonViewModel) => {
			if (!permissions.canRemovePeople || person.isOwner) {
				return;
			}

			try {
				await removeContact(person.userId);
			} catch {
				// Mutation exposes the error.
			}
		},
		[permissions.canRemovePeople, removeContact],
	);

	return {
		sortedPeople,

		handleSetMainContact,
		handleRemovePerson,

		isUpdatingPeople,
		isRemovingContact,
		isPeopleMutationPending: isUpdatingPeople || isRemovingContact,

		updatePeopleError,
		removeContactError,

		canSetMainContact: permissions.canSetMainContact,
		canRemovePeople: permissions.canRemovePeople,
	};
};

/* -------------------------------------------------------------------------
 * People tab — "Add People" flow (search + attach one or more existing
 * users in a single batch submit). Used only by BPPeople.tsx.
 * ---------------------------------------------------------------------- */

export const useBPAddExistingPeopleForm = (
	businessPartnerId: string,
	existingPeople: BPPersonViewModel[],
) => {
	const { addPeople, isAddingPeople, addPeopleError } =
		useBusinessPartnerPeopleMutations(businessPartnerId);

	const [selected, setSelected] = useState<BPPeopleSelection[]>([]);

	const existingUserIds = useMemo<string[]>(
		() =>
			existingPeople
				.map((person) => person.userId)
				.filter(
					(userId): userId is string =>
						typeof userId === "string" && userId.trim().length > 0,
				),
		[existingPeople],
	);

	const excludedUserIds = useMemo<string[]>(
		() => [...existingUserIds, ...selected.map((entry) => entry.userId)],
		[existingUserIds, selected],
	);

	const handleSelectUser = useCallback(
		(user: { value: string; label: string; email?: string } | null) => {
			if (!user) return;

			setSelected((current) => {
				if (current.some((entry) => entry.userId === user.value)) {
					return current;
				}

				const selectedPerson: BPPeopleSelection = {
					userId: user.value,
					name: user.label,
					email: user.email ?? "",
					isMainContact: false,
					isDefault: false,
					isOwner: false,
					businessPartnerId,
				};

				return [...current, selectedPerson];
			});
		},
		[businessPartnerId],
	);

	const handleRemoveSelected = useCallback((userId: string) => {
		setSelected((current) =>
			current.filter((entry) => entry.userId !== userId),
		);
	}, []);

	// Only one main contact can be picked in a single add — selecting one
	// clears any previously toggled entry.
	const handleToggleMainContact = useCallback((userId: string) => {
		setSelected((current) =>
			current.map((entry) => ({
				...entry,
				isMainContact: entry.userId === userId ? !entry.isMainContact : false,
			})),
		);
	}, []);

	const resetSelection = useCallback(() => {
		setSelected([]);
	}, []);

	const buildPayload = useCallback(
		(): UpdateBusinessPartnerPeoplePayload =>
			selected.map((entry) => ({
				userId: entry.userId,
				isMainContact: entry.isMainContact,
				isDefault: entry.isDefault,
			})),
		[selected],
	);

	const handleSubmit = useCallback(async (): Promise<boolean> => {
		if (selected.length === 0) return false;

		try {
			await addPeople(buildPayload());
			resetSelection();
			return true;
		} catch {
			// Mutation exposes the error via addPeopleError.
			return false;
		}
	}, [selected.length, addPeople, buildPayload, resetSelection]);

	return {
		selected,
		excludedUserIds,

		handleSelectUser,
		handleRemoveSelected,
		handleToggleMainContact,
		resetSelection,
		handleSubmit,

		isSubmitting: isAddingPeople,
		error: addPeopleError,
	};
};
