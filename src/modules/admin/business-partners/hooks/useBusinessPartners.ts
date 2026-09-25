import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	businessPartnerApi,
	businessPartnerKeys,
} from "../api/businessPartner.api";

import { useBusinessPartnerContactMutations } from "./useBusinessPartnerMutations";

import {
	DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
	type BPContactViewModel,
	type BPPeoplePermissions,
	type BPUserViewModel,
} from "../utils/bp.types";

import { getApiErrorMessage } from "../../../../utils/apiError.helper";
import { useToast } from "../../../../context/Auth/AuthContext";

const BUSINESS_PARTNER_QUERY_OPTIONS = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

/* -------------------------------------------------------------------------
 * Contact tab (BPContact.tsx) — list logic for BPContactViewModel rows.
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
		updateContact,
		deleteContact,

		isUpdatingContact,
		isDeletingContact,

		updateContactError,
		deleteContactError,
	} = useBusinessPartnerContactMutations(businessPartnerId);

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
				isUpdatingContact
			) {
				return;
			}

			try {
				await updateContact({
					contactId: contact.id,
					payload: {
						isMainContact: true,
					},
				});
			} catch {
				// Mutation exposes the error.
			}
		},
		[permissions.canSetMainContact, isUpdatingContact, updateContact],
	);

	const handleRemoveContact = useCallback(
		async (contact: BPContactViewModel) => {
			if (
				!permissions.canRemovePeople ||
				contact.isOwner ||
				isDeletingContact
			) {
				return;
			}

			try {
				await deleteContact(contact.id);
			} catch {
				// Mutation exposes the error.
			}
		},
		[permissions.canRemovePeople, isDeletingContact, deleteContact],
	);

	return {
		sortedContacts,

		handleSetMainContact,
		handleRemoveContact,

		isUpdatingContacts: isUpdatingContact,
		isRemovingContact: isDeletingContact,
		isContactsMutationPending: isUpdatingContact || isDeletingContact,

		updateContactsError: updateContactError,
		removeContactError: deleteContactError,

		canSetMainContact: permissions.canSetMainContact,
		canRemoveContact: permissions.canRemovePeople,
	};
};

/* -------------------------------------------------------------------------
 * Users tab — read-only listing of Users scoped to this business partner
 * (GET /users?businessPartnerId=...). This is the Users module's own
 * listing, filtered — not a business-partner sub-resource. The only
 * supported action is setting a user as the default contact and toggling
 * active status.
 * ---------------------------------------------------------------------- */
export const useBPUsersManager = (businessPartnerId: string) => {
	const normalizedId = businessPartnerId.trim();
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const usersQuery = useQuery({
		queryKey: businessPartnerKeys.usersOfPartner(normalizedId),
		queryFn: () => businessPartnerApi.getUsers(normalizedId),
		enabled: Boolean(normalizedId),
		...BUSINESS_PARTNER_QUERY_OPTIONS,
	});

	const setDefaultMutation = useMutation({
		mutationFn: (userId: string) => businessPartnerApi.setDefaultUser(userId),

		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.usersOfPartner(normalizedId),
			});

			showToast({
				type: "success",
				title: "Default user updated",
				description:
					"The user was set as the default contact for this business partner.",
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Unable to set default user",
				description: getApiErrorMessage(
					error,
					"Unable to set the default user.",
				),
			});
		},
	});

	const setActiveStatusMutation = useMutation({
		mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
			businessPartnerApi.setUserActiveStatus(userId, isActive),

		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.usersOfPartner(normalizedId),
			});

			showToast({
				type: "success",
				title: variables.isActive ? "User activated" : "User deactivated",
				description: variables.isActive
					? "The user was activated successfully."
					: "The user was deactivated successfully.",
			});
		},

		onError: (error, variables) => {
			showToast({
				type: "error",
				title: variables.isActive
					? "Unable to activate user"
					: "Unable to deactivate user",
				description: getApiErrorMessage(
					error,
					variables.isActive
						? "Unable to activate the user."
						: "Unable to deactivate the user.",
				),
			});
		},
	});

	const handleSetDefaultUser = useCallback(
		async (user: BPUserViewModel) => {
			if (user.isDefaultContact || setDefaultMutation.isPending) {
				return;
			}

			try {
				await setDefaultMutation.mutateAsync(user.id);
			} catch {
				// Mutation exposes error via toast.
			}
		},
		[setDefaultMutation],
	);

	const handleToggleActiveStatus = useCallback(
		async (user: BPUserViewModel) => {
			if (setActiveStatusMutation.isPending) {
				return;
			}

			try {
				await setActiveStatusMutation.mutateAsync({
					userId: user.id,
					isActive: !user.isActive,
				});
			} catch {
				// Mutation exposes error via toast.
			}
		},
		[setActiveStatusMutation],
	);

	return {
		users: usersQuery.data ?? [],
		isLoading: usersQuery.isLoading,
		isFetching: usersQuery.isFetching,
		error: usersQuery.error,

		handleSetDefaultUser,
		isSettingDefault: setDefaultMutation.isPending,

		handleToggleActiveStatus,
		isTogglingActiveStatus: setActiveStatusMutation.isPending,
	};
};
