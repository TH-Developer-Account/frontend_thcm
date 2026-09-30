import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { vendorInitationApi } from "../api/vendorOnboarding.api";
import {
	useSendBackToVendorMutation,
	useVendorInitiationDetailQuery,
} from "../queries/useVendorMutations";
import type { VendorOnboardingInitiationPayload } from "../types/vendorListing.types";
import {
	vendorInitiationSchema,
	type VendorInitiationFormValues,
} from "../schemas/vendorInitiation.schema";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import { useToast } from "../../../context/Auth/AuthContext";
import { vendorContent } from "../../../content/vendor.content";

const toastContent = vendorContent.toast.initiation;

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

	// `vendorName` is not collected by the visible form (its FormInput has
	// been intentionally commented out upstream) but the payload type still
	// carries it, so it rides along outside React Hook Form/Zod rather than
	// being silently dropped by the resolver's schema-stripping behaviour.
	const vendorNameRef = useRef(initialResolvedValues.vendorName);

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isDirty, isSubmitting: isFormSubmitting },
	} = useForm<VendorInitiationFormValues>({
		resolver: zodResolver(vendorInitiationSchema),
		// Validate on every keystroke, per explicit request — errors should
		// appear as the user types, not only once they blur the field.
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: initialResolvedValues,
	});

	const isEditMode = Boolean(initiationId);

	const detailQuery = useVendorInitiationDetailQuery(
		shouldFetchDetails ? resolvedInitiationId : "",
	);

	useEffect(() => {
		if (!shouldFetchDetails || !detailQuery.data) {
			return;
		}
		const mappedValues = mapInitiationDetailsToForm(detailQuery.data);

		vendorNameRef.current = mappedValues.vendorName;
		reset(mappedValues);
	}, [detailQuery.data, shouldFetchDetails, reset]);

	useEffect(() => {
		if (shouldFetchDetails) {
			return;
		}

		vendorNameRef.current = initialResolvedValues.vendorName;
		reset(initialResolvedValues);
	}, [initialResolvedValues, shouldFetchDetails, reset]);

	const submitMutation = useMutation({
		mutationFn: vendorInitationApi.createInitiation,
		onSuccess: async () => {
			await onSubmitSuccess?.();
			navigate("/vendor-onboarding/listing");
			showSuccessToast(
				showToast,
				toastContent.createSuccessDescription,
				toastContent.createSuccessTitle,
			);
		},
		onError: (error) => {
			showApiErrorToast(
				showToast,
				error,
				toastContent.createErrorFallback,
				toastContent.createErrorTitle,
			);
		},
	});

	const updateMutation = useMutation({
		mutationFn: vendorInitationApi.updateInitiation,
		onSuccess: async () => {
			await onUpdateSuccess?.();
			navigate("/vendor-onboarding/listing");
			showSuccessToast(
				showToast,
				toastContent.updateSuccessDescription,
				toastContent.updateSuccessTitle,
			);
		},
		onError: (error) => {
			// Previously this only logged to the console — the user got no
			// feedback at all when an update silently failed. Now it goes
			// through the same centralized toast path as every other
			// mutation in this module.
			showApiErrorToast(
				showToast,
				error,
				toastContent.updateErrorFallback,
				toastContent.updateErrorTitle,
			);
		},
	});

	const isSubmitting =
		isFormSubmitting || submitMutation.isPending || updateMutation.isPending;

	const handleReset = () => {
		reset();
	};

	const onValid = (formValues: VendorInitiationFormValues) => {
		const payload: VendorOnboardingInitiationPayload = {
			...formValues,
			vendorName: vendorNameRef.current,
		};

		if (isEditMode && resolvedInitiationId) {
			updateMutation.mutate({
				id: resolvedInitiationId,
				payload,
			});

			return;
		}

		submitMutation.mutate(payload);
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
				toastContent.sendBackSuccessDescription,
				toastContent.sendBackSuccessTitle,
			);
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				toastContent.sendBackErrorFallback,
				toastContent.sendBackErrorTitle,
			);
		}
	};

	return {
		register,
		control,
		errors,

		isEditMode,
		isDirty,
		isSubmitting,

		isDetailLoading: detailQuery.isLoading,
		isDetailFetching: detailQuery.isFetching,
		isDetailError: detailQuery.isError,
		detailError: detailQuery.error,

		handleReset,
		// Exposed raw (not pre-applied) so the form calls
		// `handleSubmit(onValid)` directly inline in its <form onSubmit={...}>
		// — the same pattern the Login forms already use, and the one RHF's
		// own lint rules expect: calling handleSubmit() during render is only
		// recognized as safe when it's the JSX event-handler expression
		// itself, not a value precomputed and stored in this hook.
		handleSubmit,
		onValid,
		handleSendBackToVendor,
		submitMutation,
		updateMutation,
	};
};

export type { VendorInitiationFormValues };
