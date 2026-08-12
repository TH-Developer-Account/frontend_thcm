import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "../../../context/Auth/AuthContext";

import {
	guestVendorOnboardingApi,
	type PublicVendorSessionResponse,
} from "./api/guestVendorOnboarding.api";

import type {
	VendorCreationFormOneDraftSubmission,
	VendorCreationFormOneSubmission,
} from "../../vendorOnboarding/hooks/useVendorCreationForm";

import type {
	VendorCreationFormOneValues,
	VendorFormErrors,
} from "../../vendorOnboarding/types/vendorOnboarding.types";

import {
	buildPublicFormData,
	getErrorMessage,
	getMissingDocuments,
} from "../../vendorOnboarding/helpers/vendor.onboarding.helper";
import { guestVendorQueryKeys } from "./guestVendorOnboarding.config";

const EMPTY_FORM_ONE: VendorCreationFormOneValues = {
	vendorName: "",
	address: "",
	state: "",
	city: "",
	pinCode: "",
	mobile: "",
	email: "",
	msmeVendor: "",
	msmeCertificateAttached: "",
	ndaObtained: "",
};
const normalizePublicFormOneValues = (
	data: PublicVendorSessionResponse,
): VendorCreationFormOneValues => {
	const source =
		data.partOne && Object.keys(data.partOne).length > 0 ? data.partOne : data;

	return {
		...EMPTY_FORM_ONE,
		...source,
		vendorName: source.vendorName ?? data.vendorName ?? "",
		email: source.email ?? data.email ?? "",
		mobile: source.mobile ?? data.mobile ?? "",
	};
};

type UsePublicVendorOnboardingFormParams = {
	token: string;
	onSubmitted?: () => void | Promise<void>;
};

export const usePublicVendorOnboardingForm = ({
	token,
	onSubmitted,
}: UsePublicVendorOnboardingFormParams) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const [editedValues, setEditedValues] =
		useState<VendorCreationFormOneValues>();

	const [formOneErrors, setFormOneErrors] = useState<
		VendorFormErrors<VendorCreationFormOneValues>
	>({});

	const sessionQuery = useQuery({
		queryKey: guestVendorQueryKeys.publicSession(token),
		queryFn: () => guestVendorOnboardingApi.getPublicSession(token),
		enabled: Boolean(token),
		retry: 1,
		refetchOnWindowFocus: false,
		staleTime: 0,
	});

	const initialValues = useMemo(
		() =>
			sessionQuery.data
				? normalizePublicFormOneValues(sessionQuery.data)
				: EMPTY_FORM_ONE,
		[sessionQuery.data],
	);

	const formOneValues = editedValues ?? initialValues;

	const handleFormOneChange = useCallback(
		<K extends keyof VendorCreationFormOneValues>(
			key: K,
			value: VendorCreationFormOneValues[K],
		) => {
			setEditedValues((current) => ({
				...(current ?? initialValues),
				[key]: value,
			}));

			setFormOneErrors((current) => ({
				...current,
				[key]: undefined,
			}));
		},
		[initialValues],
	);

	const submitMutation = useMutation({
		mutationFn: (submission: VendorCreationFormOneSubmission) =>
			guestVendorOnboardingApi.submitInitialForm({
				token,
				formData: buildPublicFormData(formOneValues, submission, "SUBMIT"),
			}),

		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: guestVendorQueryKeys.listing(),
			});
			await onSubmitted?.();
		},
	});

	const draftMutation = useMutation({
		mutationFn: (submission: VendorCreationFormOneDraftSubmission) =>
			guestVendorOnboardingApi.saveInitialDraft({
				token,
				formData: buildPublicFormData(formOneValues, submission, "DRAFT"),
			}),

		onSuccess: async (result) => {
			showToast({
				type: "success",
				title: "Draft saved",
				description:
					result.message || "Your vendor details were saved successfully.",
			});

			setEditedValues(undefined);
			await sessionQuery.refetch();
		},
	});

	const handleSubmit = useCallback(
		async (submission: VendorCreationFormOneSubmission) => {
			if (!token) return;

			if (!submission.dpdpConsent) {
				showToast({
					type: "error",
					title: "Required information missing",
					description: "Please accept the Data Privacy Notice.",
				});
				return;
			}

			const missingDocuments = getMissingDocuments(submission, formOneValues);

			if (missingDocuments.length > 0) {
				showToast({
					type: "error",
					title: "Required information missing",
					description: `Please upload: ${missingDocuments.join(", ")}`,
				});
				return;
			}

			try {
				await submitMutation.mutateAsync(submission);
			} catch (error) {
				showToast({
					type: "error",
					title: "Submission failed",
					description: getErrorMessage(error, "Failed to submit vendor form."),
				});
			}
		},
		[formOneValues, showToast, submitMutation, token],
	);

	const handleSaveDraft = useCallback(
		async (submission: VendorCreationFormOneDraftSubmission) => {
			if (!token) return;

			try {
				await draftMutation.mutateAsync(submission);
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to save draft",
					description: getErrorMessage(error, "Failed to save vendor draft."),
				});
			}
		},
		[draftMutation, showToast, token],
	);

	return {
		formOneValues,
		formOneErrors,
		documents: sessionQuery.data?.documents ?? [],
		correctionReason: sessionQuery.data?.correctionReason ?? null,

		isLoading: sessionQuery.isLoading,
		isError: sessionQuery.isError,
		error: sessionQuery.error,

		isSubmitting: submitMutation.isPending,
		isSavingDraft: draftMutation.isPending,
		mutationLoading: submitMutation.isPending || draftMutation.isPending,

		handleFormOneChange,
		handleSubmit,
		handleSaveDraft,
	};
};
