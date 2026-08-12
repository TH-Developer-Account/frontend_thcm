import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "../../../context/Auth/AuthContext";

import { guestVendorOnboardingApi } from "./api/guestVendorOnboarding.api";

import type { VendorCreationFormOneSubmission } from "../../vendorOnboarding/forms/VendorCreationFormOne";

import type {
	VendorCreationFormOneValues,
	VendorFormErrors,
} from "../../vendorOnboarding/types/vendorOnboarding.types";

import {
	buildPublicFormData,
	getErrorMessage,
	getMissingDocuments,
	normalizeVendorOnboardingResponse,
} from "../../vendorOnboarding/helpers/vendor.onboarding.helper";
import {
	canGuestEditVendorOnboarding,
	guestVendorQueryKeys,
} from "./guestVendorOnboarding.config";

export const useGuestVendorOnboardingForm = (onboardingId: string) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const [editedValues, setEditedValues] =
		useState<VendorCreationFormOneValues>();

	const [formOneErrors, setFormOneErrors] = useState<
		VendorFormErrors<VendorCreationFormOneValues>
	>({});

	const detailQuery = useQuery({
		queryKey: guestVendorQueryKeys.detail(onboardingId),
		queryFn: () => guestVendorOnboardingApi.getById(onboardingId),
		enabled: Boolean(onboardingId),
		staleTime: 0,
		retry: 1,
		refetchOnWindowFocus: false,
	});

	const normalizedDetail = useMemo(
		() =>
			detailQuery.data
				? normalizeVendorOnboardingResponse(detailQuery.data)
				: undefined,
		[detailQuery.data],
	);

	const formOneValues = editedValues ?? normalizedDetail?.partOne ?? {};

	const handleFormOneChange = useCallback(
		<K extends keyof VendorCreationFormOneValues>(
			key: K,
			value: VendorCreationFormOneValues[K],
		) => {
			setEditedValues((current) => ({
				...(current ?? normalizedDetail?.partOne ?? {}),
				[key]: value,
			}));

			setFormOneErrors((current) => ({
				...current,
				[key]: undefined,
			}));
		},
		[normalizedDetail?.partOne],
	);

	const updateMutation = useMutation({
		mutationFn: (submission: VendorCreationFormOneSubmission) =>
			guestVendorOnboardingApi.updateFormOne({
				onboardingId,
				formData: buildPublicFormData(formOneValues, submission, "SUBMIT"),
			}),

		onSuccess: async () => {
			setEditedValues(undefined);
			setFormOneErrors({});

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: guestVendorQueryKeys.detail(onboardingId),
				}),
				queryClient.invalidateQueries({
					queryKey: guestVendorQueryKeys.listing(),
				}),
			]);
		},
	});

	const handleSubmit = useCallback(
		async (submission: VendorCreationFormOneSubmission) => {
			const missingDocuments = getMissingDocuments(
				submission,
				formOneValues,
				false,
			);

			if (missingDocuments.length > 0) {
				showToast({
					type: "error",
					title: "Required information missing",
					description: `Please upload: ${missingDocuments.join(", ")}`,
				});
				return undefined;
			}

			try {
				return await updateMutation.mutateAsync(submission);
			} catch (error) {
				showToast({
					type: "error",
					title: "Submission failed",
					description: getErrorMessage(
						error,
						"Unable to submit your vendor form.",
					),
				});

				return undefined;
			}
		},
		[formOneValues, showToast, updateMutation],
	);

	const status = normalizedDetail?.status;

	const canEdit = canGuestEditVendorOnboarding(status);

	const submitError = updateMutation.error
		? getErrorMessage(
				updateMutation.error,
				"Unable to submit your vendor form.",
			)
		: undefined;

	return {
		formOneValues,
		formTwoValues: normalizedDetail?.partTwo ?? {},
		formOneErrors,
		documents: normalizedDetail?.documents ?? [],
		referenceNumber: normalizedDetail?.referenceNumber,
		status,

		canEdit,

		isLoading: detailQuery.isLoading,
		isFetching: detailQuery.isFetching,
		isError: detailQuery.isError,
		error: detailQuery.error,

		isSubmitting: updateMutation.isPending,
		submitError,

		handleFormOneChange,
		handleSubmit,
		refetch: detailQuery.refetch,
	};
};
