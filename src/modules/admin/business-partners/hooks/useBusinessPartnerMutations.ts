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

	const refreshBusinessPartner = useRefreshBusinessPartner(normalizedId);

	const addPeopleMutation = useMutation({
		mutationFn: (payload: UpdateBusinessPartnerPeoplePayload) =>
			businessPartnerApi.addPeople(normalizedId, payload),

		onSuccess: () => {
			void refreshBusinessPartner();
		},
	});

	const updatePeopleMutation = useMutation({
		mutationFn: (payload: UpdateBusinessPartnerPeoplePayload) =>
			businessPartnerApi.updatePeople(normalizedId, payload),

		onSuccess: () => {
			void refreshBusinessPartner();
		},
	});

	const removeContactMutation = useMutation({
		mutationFn: (contactId: string) =>
			businessPartnerApi.removeContact(normalizedId, contactId),

		onSuccess: () => {
			void refreshBusinessPartner();
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

	const refreshBusinessPartner = useRefreshBusinessPartner(normalizedId);

	const createMutation = useMutation({
		mutationFn: (payload: BusinessPartnerAddressPayload) =>
			businessPartnerApi.createAddress(normalizedId, payload),

		onSuccess: () => {
			void refreshBusinessPartner();
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
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (addressId: string) =>
			businessPartnerApi.deleteAddress(normalizedId, addressId),

		onSuccess: () => {
			void refreshBusinessPartner();
		},
	});

	const setDefaultMutation = useMutation({
		mutationFn: (addressId: string) =>
			businessPartnerApi.setDefaultAddress(normalizedId, addressId),

		onSuccess: () => {
			void refreshBusinessPartner();
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
