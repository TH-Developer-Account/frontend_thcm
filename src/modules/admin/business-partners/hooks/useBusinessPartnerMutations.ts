import { useCallback } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
	businessPartnerApi,
	businessPartnerKeys,
} from "../api/businessPartner.api";

import type {
	BusinessPartnerAddressPayload,
	CreateBusinessPartnerPayload,
	UpdateBusinessPartnerPayload,
	UpdateBusinessPartnerPeoplePayload,
} from "../utils/bp.types";
import { getApiErrorMessage } from "../../../../utils/apiError.helper";
import { useToast } from "../../../../context/Auth/AuthContext";

const useRefreshBusinessPartner = (businessPartnerId: string) => {
	const queryClient = useQueryClient();

	return useCallback(
		() =>
			Promise.all([
				queryClient.invalidateQueries({
					queryKey: businessPartnerKeys.detail(businessPartnerId),
				}),
				queryClient.invalidateQueries({
					queryKey: businessPartnerKeys.lists(),
				}),
			]),
		[queryClient, businessPartnerId],
	);
};

export const useBusinessPartnerMutations = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const createMutation = useMutation({
		mutationFn: (payload: CreateBusinessPartnerPayload) =>
			businessPartnerApi.create(payload),

		onSuccess: (createdPartner) => {
			queryClient.setQueryData(
				businessPartnerKeys.detail(createdPartner.id),
				createdPartner,
			);

			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.lists(),
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Creation failed",
				description: getApiErrorMessage(
					error,
					"Unable to create business partner.",
				),
			});
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			businessPartnerId,
			payload,
		}: {
			businessPartnerId: string;
			payload: UpdateBusinessPartnerPayload;
		}) => businessPartnerApi.update(businessPartnerId, payload),

		onSuccess: (updatedPartner, variables) => {
			/*
			 * Use the route ID because that is the query key that
			 * originally loaded the edit form.
			 */
			queryClient.setQueryData(
				businessPartnerKeys.detail(variables.businessPartnerId),
				updatedPartner,
			);

			/*
			 * Also cache under the returned ID if the backend returns
			 * a different canonical ID.
			 */
			if (updatedPartner.id !== variables.businessPartnerId) {
				queryClient.setQueryData(
					businessPartnerKeys.detail(updatedPartner.id),
					updatedPartner,
				);
			}

			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.lists(),
			});

			// NOTE: useBusinessPartnerDetailForm already shows a success toast
			// on update, scoped to the section being edited. Not duplicating
			// it here to avoid a double toast on every save.
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Update failed",
				description: getApiErrorMessage(
					error,
					"Unable to update business partner.",
				),
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (businessPartnerId: string) =>
			businessPartnerApi.remove(businessPartnerId),

		onSuccess: (deletedPartnerId) => {
			queryClient.removeQueries({
				queryKey: businessPartnerKeys.detail(deletedPartnerId),
			});

			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.lists(),
			});

			showToast({
				type: "success",
				title: "Business partner removed",
				description: "The business partner was deactivated successfully.",
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Deletion failed",
				description: getApiErrorMessage(
					error,
					"Unable to remove business partner.",
				),
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

export const useBusinessPartnerPeopleMutations = (
	businessPartnerId: string,
) => {
	const normalizedId = businessPartnerId.trim();
	const { showToast } = useToast();

	const refreshBusinessPartner = useRefreshBusinessPartner(normalizedId);

	const addPeopleMutation = useMutation({
		mutationFn: (payload: UpdateBusinessPartnerPeoplePayload) =>
			businessPartnerApi.addPeople(normalizedId, payload),

		onSuccess: () => {
			void refreshBusinessPartner();
			showToast({
				type: "success",
				title: "Contacts added",
				description: "The contact(s) were added successfully.",
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Unable to add contacts",
				description: getApiErrorMessage(error, "Unable to add contacts."),
			});
		},
	});

	const updatePeopleMutation = useMutation({
		mutationFn: (payload: UpdateBusinessPartnerPeoplePayload) =>
			businessPartnerApi.updatePeople(normalizedId, payload),

		onSuccess: () => {
			void refreshBusinessPartner();
			showToast({
				type: "success",
				title: "Contacts updated",
				description: "Contact details were updated successfully.",
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Unable to update contacts",
				description: getApiErrorMessage(error, "Unable to update contacts."),
			});
		},
	});

	const removeContactMutation = useMutation({
		mutationFn: (contactId: string) =>
			businessPartnerApi.removeContact(normalizedId, contactId),

		onSuccess: () => {
			void refreshBusinessPartner();
			showToast({
				type: "success",
				title: "Contact removed",
				description: "The contact was removed successfully.",
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Unable to remove contact",
				description: getApiErrorMessage(error, "Unable to remove contact."),
			});
		},
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

export const useBusinessPartnerAddressMutations = (
	businessPartnerId: string,
) => {
	const normalizedId = businessPartnerId.trim();
	const { showToast } = useToast();

	const refreshBusinessPartner = useRefreshBusinessPartner(normalizedId);

	const createMutation = useMutation({
		mutationFn: (payload: BusinessPartnerAddressPayload) =>
			businessPartnerApi.createAddress(normalizedId, payload),

		onSuccess: () => {
			void refreshBusinessPartner();
			showToast({
				type: "success",
				title: "Address added",
				description: "The address was added successfully.",
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Unable to add address",
				description: getApiErrorMessage(error, "Unable to add address."),
			});
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			addressId,
			payload,
		}: {
			addressId: string;
			payload: BusinessPartnerAddressPayload;
		}) => businessPartnerApi.updateAddress(normalizedId, addressId, payload),

		onSuccess: () => {
			void refreshBusinessPartner();
			showToast({
				type: "success",
				title: "Address updated",
				description: "The address was updated successfully.",
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Unable to update address",
				description: getApiErrorMessage(error, "Unable to update address."),
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (addressId: string) =>
			businessPartnerApi.deleteAddress(normalizedId, addressId),

		onSuccess: () => {
			void refreshBusinessPartner();
			showToast({
				type: "success",
				title: "Address removed",
				description: "The address was removed successfully.",
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Unable to remove address",
				description: getApiErrorMessage(error, "Unable to remove address."),
			});
		},
	});

	const setDefaultMutation = useMutation({
		mutationFn: (addressId: string) =>
			businessPartnerApi.setDefaultAddress(normalizedId, addressId),

		onSuccess: () => {
			void refreshBusinessPartner();
			showToast({
				type: "success",
				title: "Default address updated",
				description: "The default address was set successfully.",
			});
		},

		onError: (error) => {
			showToast({
				type: "error",
				title: "Unable to set default address",
				description: getApiErrorMessage(
					error,
					"Unable to set default address.",
				),
			});
		},
	});

	return {
		createAddress: createMutation.mutateAsync,
		updateAddress: updateMutation.mutateAsync,
		deleteAddress: deleteMutation.mutateAsync,
		setDefaultAddress: setDefaultMutation.mutateAsync,

		isCreatingAddress: createMutation.isPending,
		isUpdatingAddress: updateMutation.isPending,
		isDeletingAddress: deleteMutation.isPending,
		isSettingDefault: setDefaultMutation.isPending,

		createAddressError: createMutation.error,
		updateAddressError: updateMutation.error,
		deleteAddressError: deleteMutation.error,
		setDefaultAddressError: setDefaultMutation.error,
	};
};
