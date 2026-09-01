import * as React from "react";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { vendorInitationApi } from "../api/vendorOnboarding.api";
import {
	useSendBackToVendorMutation,
	useVendorInitiationDetailQuery,
} from "../queries/useVendorMutations";
import type { VendorOnboardingInitiationPayload } from "../types/vendorListing.types";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import { useToast } from "../../../context/Auth/AuthContext";

export type VendorOnboardingInitiationErrors = Partial<
	Record<keyof VendorOnboardingInitiationPayload, string>
>;

const initialFormValues: VendorOnboardingInitiationPayload = {
	vendorName: "",
	vendorReferenceName: "",
	email: "",
	mobile: "",
	status: "",
};

type UseVendorOnboardingInitiationParams = {
	initialValues?: Partial<VendorOnboardingInitiationPayload>;
	initiationId?: string;
	shouldFetchDetails?: boolean;
	onSubmitSuccess?: () => void | Promise<void>;
	onUpdateSuccess?: () => void | Promise<void>;
};
const mapInitiationDetailsToForm = (
	response: VendorOnboardingInitiationPayload | null | undefined,
): VendorOnboardingInitiationPayload => ({
	vendorName: response?.vendorName ?? "",
	vendorReferenceName: response?.vendorReferenceName ?? "",
	email: response?.email ?? "",
	mobile: response?.mobile ?? "",
	status: response?.status ?? "Pending",
});

export const useVendorOnboardingInitiation = ({
	initialValues,
	initiationId,
	shouldFetchDetails = false,
	onSubmitSuccess,
	onUpdateSuccess,
}: UseVendorOnboardingInitiationParams = {}) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const params = useParams<{
		id?: string;
		onboardingId?: string;
		vendorRequestId?: string;
	}>();

	const routeVendorId =
		params.onboardingId ?? params.vendorRequestId ?? params.id ?? "";

	const resolvedInitiationId = initiationId ?? routeVendorId;

	const initialResolvedValues = useMemo(
		() => ({
			...initialFormValues,
			...initialValues,
		}),
		[initialValues],
	);

	const [values, setValues] = useState<VendorOnboardingInitiationPayload>(
		initialResolvedValues,
	);

	const [originalValues, setOriginalValues] =
		useState<VendorOnboardingInitiationPayload>(initialResolvedValues);

	const [errors, setErrors] = useState<VendorOnboardingInitiationErrors>({});

	const isEditMode = Boolean(initiationId);

	const detailQuery = useVendorInitiationDetailQuery(
		shouldFetchDetails ? resolvedInitiationId : "",
	);

	React.useEffect(() => {
		if (!shouldFetchDetails || !detailQuery.data) {
			return;
		}
		const mappedValues = mapInitiationDetailsToForm(detailQuery.data);

		setValues(mappedValues);
		setOriginalValues(mappedValues);
		setErrors({});
	}, [detailQuery.data, shouldFetchDetails]);

	React.useEffect(() => {
		if (shouldFetchDetails) {
			return;
		}

		setValues(initialResolvedValues);
		setOriginalValues(initialResolvedValues);
	}, [initialResolvedValues, shouldFetchDetails]);

	const submitMutation = useMutation({
		mutationFn: vendorInitationApi.createInitiation,
		onSuccess: async () => {
			await onSubmitSuccess?.();
			navigate("/vendor/onboarding/listing");
			showSuccessToast(
				showToast,
				"The Vendor initiation was submitted successfully.",
				"Submitted successfully",
			);
		},
		onError: (error) => {
			console.error("Vendor initiation submit failed:", error);
			showApiErrorToast(showToast, error, "Vendor initiation submit failed");
		},
	});

	const updateMutation = useMutation({
		mutationFn: vendorInitationApi.updateInitiation,
		onSuccess: async () => {
			await onUpdateSuccess?.();
			navigate("/vendor/onboarding/listing");
		},
		onError: (error) => {
			console.error("Vendor initiation update failed:", error);
		},
	});

	const isSubmitting = submitMutation.isPending || updateMutation.isPending;

	const isDirty = useMemo(
		() => JSON.stringify(values) !== JSON.stringify(originalValues),
		[originalValues, values],
	);

	const handleChange = <K extends keyof VendorOnboardingInitiationPayload>(
		key: K,
		value: VendorOnboardingInitiationPayload[K],
	) => {
		setValues((previousValues) => ({
			...previousValues,
			[key]: value,
		}));

		setErrors((previousErrors) => ({
			...previousErrors,
			[key]: undefined,
		}));
	};

	const handleReset = () => {
		setValues(originalValues);
		setErrors({});
	};

	const handleSubmit = () => {
		if (isEditMode && resolvedInitiationId) {
			updateMutation.mutate({
				id: resolvedInitiationId,
				payload: values,
			});

			return;
		}

		submitMutation.mutate(values);
	};

	/*
	|--------------------------------------------------------------------------
	| Send back to vendor 
	|--------------------------------------------------------------------------
	*/
	const sendBackToVendorMutation = useSendBackToVendorMutation();

	const handleSendBackToVendor = async () => {
		if (!resolvedInitiationId) return;

		try {
			await sendBackToVendorMutation.mutateAsync(resolvedInitiationId);

			showSuccessToast(
				showToast,
				"The form was sent back to the vendor successfully.",
			);
		} catch (error) {
			showToast({
				type: "error",
				title: "Unable to send back",
				description:
					error instanceof Error
						? error.message
						: "Failed to send the form back to the vendor.",
			});
		}
	};

	return {
		values,
		errors,

		isEditMode,
		isDirty,
		isSubmitting,

		isDetailLoading: detailQuery.isLoading,
		isDetailFetching: detailQuery.isFetching,
		isDetailError: detailQuery.isError,
		detailError: detailQuery.error,

		handleChange,
		handleReset,
		handleSubmit,
		handleSendBackToVendor,
		submitMutation,
		updateMutation,
	};
};
