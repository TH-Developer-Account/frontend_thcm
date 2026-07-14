import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { vendorOnboardingApi } from "../api/vendorOnboarding.api";

export type VendorOnboardingInitiationPayload = {
	vendorName: string;
	email: string;
	mobile: string;
};

export type VendorOnboardingInitiationErrors = Partial<
	Record<keyof VendorOnboardingInitiationPayload, string>
>;

const initialFormValues: VendorOnboardingInitiationPayload = {
	vendorName: "",
	email: "",
	mobile: "",
};

type UseVendorOnboardingInitiationParams = {
	initialValues?: Partial<VendorOnboardingInitiationPayload>;
	initiationId?: string;
	onSubmitSuccess?: () => void | Promise<void>;
	onUpdateSuccess?: () => void | Promise<void>;
};

export const useVendorOnboardingInitiation = ({
	initialValues,
	initiationId,
	onSubmitSuccess,
	onUpdateSuccess,
}: UseVendorOnboardingInitiationParams = {}) => {
	const navigate = useNavigate();

	const resolvedInitialValues = useMemo<VendorOnboardingInitiationPayload>(
		() => ({
			...initialFormValues,
			...initialValues,
		}),
		[initialValues],
	);

	const [values, setValues] = useState<VendorOnboardingInitiationPayload>(
		resolvedInitialValues,
	);

	const [errors, setErrors] = useState<VendorOnboardingInitiationErrors>({});

	const isEditMode = Boolean(initiationId);

	useEffect(() => {
		setValues(resolvedInitialValues);
		setErrors({});
	}, [resolvedInitialValues]);

	const submitMutation = useMutation({
		mutationFn: vendorOnboardingApi.createInitiation,
		onSuccess: async () => {
			await onSubmitSuccess?.();
			navigate("/vendor/listing?tab=initiation");
		},
		onError: (error) => {
			console.error("Vendor initiation submit failed:", error);
		},
	});

	const updateMutation = useMutation({
		mutationFn: vendorOnboardingApi.updateInitiation,
		onSuccess: async () => {
			await onUpdateSuccess?.();
			navigate("/vendor/listing?tab=initiation");
		},
		onError: (error) => {
			console.error("Vendor initiation update failed:", error);
		},
	});

	const isSubmitting = submitMutation.isPending || updateMutation.isPending;

	const isDirty = useMemo(
		() => JSON.stringify(values) !== JSON.stringify(resolvedInitialValues),
		[values, resolvedInitialValues],
	);

	const handleChange = <K extends keyof VendorOnboardingInitiationPayload>(
		key: K,
		value: VendorOnboardingInitiationPayload[K],
	) => {
		setValues((currentValues) => ({
			...currentValues,
			[key]: value,
		}));

		setErrors((currentErrors) => ({
			...currentErrors,
			[key]: "",
		}));
	};

	const handleReset = () => {
		setValues(resolvedInitialValues);
		setErrors({});
	};

	const handleSubmit = () => {
		if (isSubmitting) {
			return;
		}

		if (isEditMode && initiationId) {
			updateMutation.mutate({
				id: initiationId,
				payload: values,
			});

			return;
		}

		submitMutation.mutate(values);
	};

	return {
		values,
		errors,
		isEditMode,
		isDirty,
		isSubmitting,

		handleChange,
		handleReset,
		handleSubmit,

		submitMutation,
		updateMutation,
	};
};
