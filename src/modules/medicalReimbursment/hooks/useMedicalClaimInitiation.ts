import * as React from "react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import {
	useInitiateMedicalClaimMutation,
	useMedicalClaimDetailQuery,
	useResendMedicalClaimLinkMutation,
} from "../hooks/useMedicalClaimMutations";
import type {
	MedicalClaimInitiationErrors,
	MedicalClaimInitiationPayload,
	MedicalClaimInitiationValues,
} from "../types/medicalClaimInitiation.types";
import type { MedicalClaimDetail } from "../types/medicalClaimListing.types";

const EMPTY_VALUES: MedicalClaimInitiationValues = {
	employeeName: "",
	email: "",
	mobile: "",
	status: undefined,
	referenceNumber: "",
	ticketNumber: "",
};

type UseMedicalClaimInitiationArgs = {
	claimId?: string;
	initialValues?: Partial<MedicalClaimInitiationValues>;
	shouldFetchDetails?: boolean;
	onSubmitSuccess?: () => void | Promise<void>;
};

const mapDetailToForm = (
	response:
		| Partial<MedicalClaimInitiationValues>
		| MedicalClaimDetail
		| null
		| undefined,
): MedicalClaimInitiationValues => ({
	employeeName: response?.employeeName ?? "",
	email: response?.email ?? "",
	mobile: response?.mobile ?? "",
	ticketNumber: response?.ticketNumber ?? "",
	// status: response?.status,
	// referenceNumber: response?.referenceNumber ?? "",
});

export const useMedicalClaimInitiation = ({
	claimId,
	initialValues,
	shouldFetchDetails = false,
	onSubmitSuccess,
}: UseMedicalClaimInitiationArgs = {}) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const params = useParams<{ id?: string; claimId?: string }>();
	const resolvedClaimId = claimId ?? params.claimId ?? params.id ?? "";
	const initialResolvedValues = useMemo(
		() => ({ ...EMPTY_VALUES, ...initialValues }),
		[initialValues],
	);
	const [values, setValues] = useState(initialResolvedValues);
	const [originalValues, setOriginalValues] = useState(initialResolvedValues);
	const [errors, setErrors] = useState<MedicalClaimInitiationErrors>({});
	const detailQuery = useMedicalClaimDetailQuery(
		resolvedClaimId,
		shouldFetchDetails,
	);
	const initiateMutation = useInitiateMedicalClaimMutation();
	const resendLinkMutation = useResendMedicalClaimLinkMutation();

	React.useEffect(() => {
		if (!shouldFetchDetails || !detailQuery.data) return;
		const mapped = mapDetailToForm(detailQuery.data);
		setValues(mapped);
		setOriginalValues(mapped);
		setErrors({});
	}, [detailQuery.data, shouldFetchDetails]);

	React.useEffect(() => {
		if (shouldFetchDetails) return;
		setValues(initialResolvedValues);
		setOriginalValues(initialResolvedValues);
		setErrors({});
	}, [initialResolvedValues, shouldFetchDetails]);

	const isDirty = useMemo(
		() => JSON.stringify(values) !== JSON.stringify(originalValues),
		[originalValues, values],
	);

	const handleChange = <K extends keyof MedicalClaimInitiationPayload>(
		key: K,
		value: MedicalClaimInitiationPayload[K],
	) => {
		setValues((current) => ({ ...current, [key]: value }));
		setErrors((current) => ({ ...current, [key]: undefined }));
	};

	const validate = () => {
		const next: MedicalClaimInitiationErrors = {};
		if (!values.employeeName.trim())
			next.employeeName = "Employee name is required.";
		if (!/^\S+@\S+\.\S+$/.test(values.email.trim()))
			next.email = "Enter a valid email address.";
		if (!/^\d{10}$/.test(values.mobile.trim()))
			next.mobile = "Enter a valid 10-digit mobile number.";
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = () => {
		console.log(values, "vl");

		if (!validate()) return;
		initiateMutation.mutate(
			{
				employeeName: values.employeeName.trim(),
				email: values.email.trim(),
				mobile: values.mobile.trim(),
				ticketNumber: values.ticketNumber.trim(),
			},
			{
				onSuccess: async () => {
					await onSubmitSuccess?.();
					showSuccessToast(
						showToast,
						"The medical claim was initiated and the access link was sent successfully.",
						"Submitted successfully",
					);
					navigate("/medi-claim/listing");
				},
				onError: (error) =>
					showApiErrorToast(
						showToast,
						error,
						"Medical claim initiation failed",
					),
			},
		);
	};

	const handleResendLink = async () => {
		if (!resolvedClaimId) return;
		try {
			await resendLinkMutation.mutateAsync(resolvedClaimId);
			showSuccessToast(
				showToast,
				"The medical claim access link was re-sent successfully.",
				"Link sent",
			);
		} catch (error) {
			showApiErrorToast(showToast, error, "Unable to re-send link");
		}
	};

	const handleReset = () => {
		setValues(originalValues);
		setErrors({});
	};

	return {
		values,
		errors,
		resolvedClaimId,
		isDirty,
		isSubmitting: initiateMutation.isPending,
		isResendingLink: resendLinkMutation.isPending,
		isDetailLoading: detailQuery.isLoading,
		isDetailFetching: detailQuery.isFetching,
		isDetailError: detailQuery.isError,
		detailError: detailQuery.error,
		handleChange,
		handleReset,
		handleSubmit,
		handleResendLink,
		initiateMutation,
		resendLinkMutation,
	};
};
