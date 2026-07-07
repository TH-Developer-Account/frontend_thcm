import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import {
	useAcceptAndCloseVendorMutation,
	useAddVendorCommentMutation,
	useApproveVendorMutation,
	useClarifyVendorMutation,
	useCreateVendorFormOneMutation,
	useCreateVendorFormTwoMutation,
	useDeleteVendorMutation,
	useSubmitVendorSummaryMutation,
	useUpdateVendorFormOneMutation,
	useUpdateVendorFormTwoMutation,
	useVendorOnboardingDetailQuery,
} from "../queries/useVendorMutations";

import type {
	VendorCommentPayload,
	VendorCreationFormOneValues,
	VendorCreationFormTwoValues,
	VendorFormErrors,
	VendorViewerRole,
} from "../types/vendorOnboarding.types";

const vendorOnboardingSteps = [
	{ id: 1, label: "Vendor master details" },
	{ id: 2, label: "Finance & compliance" },
	{ id: 3, label: "Review & Submit" },
];

const initialFormOneValues: VendorCreationFormOneValues = {
	vendorCode: "",
	vendorType: "",
	companyCode: "",
	purchaseOrg: "",
	vendorName: "",
	completeAddress: "",
	msmeVendor: "",
	msmeCertificateAttached: "",
	city: "",
	pinCode: "",
	region: "",
};

const initialFormTwoValues: VendorCreationFormTwoValues = {
	mobile: "",
	email: "",
	bank: "",
	branch: "",
	ifscCode: "",
	bankAddress: "",
	accountNumber: "",
	paymentTerm: "",
	tds: "",
	gstin: "",
	pan: "",
	entityRegistrationNumber: "",
	vendorCategory: "",
	materialType: "",
	materialSubType: "",
	vendorSelfAssessmentObtained: "",
	ndaObtained: "",
	gpaObtained: "",
	relatedPartyToThcm: "",
	vendorAuditReportPrepared: "",
	remarks: "",
	reasonForOnboarding: "",
	proposedByName: "",
	proposedByDesignation: "",
	proposedDate: "",
	approvedByName: "",
	approvedByDesignation: "",
	approvalDate: "",
	gstCertificate: "",
	panNumber: "",
	bankCancelledCheque: "",
	certificateOfIncorporation: "",
	msmeCertificate: "",
	passportPhotograph: "",
};

const getErrorMessage = (error: unknown, fallback: string): string => {
	if (
		typeof error === "object" &&
		error !== null &&
		"response" in error &&
		typeof error.response === "object" &&
		error.response !== null &&
		"data" in error.response &&
		typeof error.response.data === "object" &&
		error.response.data !== null &&
		"message" in error.response.data &&
		typeof error.response.data.message === "string"
	) {
		return error.response.data.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return fallback;
};

const hasAnyFormValue = <T extends Record<string, unknown>>(
	values?: Partial<T> | null,
): boolean => {
	if (!values) return false;

	return Object.values(values).some((value) => {
		if (typeof value === "string") {
			return value.trim().length > 0;
		}

		return value !== null && value !== undefined;
	});
};

const validateFormOne = (
	values: VendorCreationFormOneValues,
): VendorFormErrors<VendorCreationFormOneValues> => {
	const errors: VendorFormErrors<VendorCreationFormOneValues> = {};

	if (!values.vendorType?.trim()) {
		errors.vendorType = "Vendor type is required.";
	}

	if (!values.companyCode?.trim()) {
		errors.companyCode = "Company code is required.";
	}

	if (!values.purchaseOrg?.trim()) {
		errors.purchaseOrg = "Purchase org is required.";
	}

	if (!values.vendorName?.trim()) {
		errors.vendorName = "Vendor name is required.";
	}

	if (!values.completeAddress?.trim()) {
		errors.completeAddress = "Complete address is required.";
	}

	if (!values.msmeVendor?.trim()) {
		errors.msmeVendor = "MSME vendor is required.";
	}

	if (!values.city?.trim()) {
		errors.city = "City is required.";
	}

	if (!values.pinCode?.trim()) {
		errors.pinCode = "Pin code is required.";
	}

	if (!values.region?.trim()) {
		errors.region = "Region is required.";
	}

	return errors;
};

const validateFormTwo = (
	values: VendorCreationFormTwoValues,
): VendorFormErrors<VendorCreationFormTwoValues> => {
	const errors: VendorFormErrors<VendorCreationFormTwoValues> = {};

	if (!values.mobile?.trim()) {
		errors.mobile = "Mobile number is required.";
	}

	if (!values.email?.trim()) {
		errors.email = "Email is required.";
	}

	if (!values.bank?.trim()) {
		errors.bank = "Bank name is required.";
	}

	if (!values.branch?.trim()) {
		errors.branch = "Branch is required.";
	}

	if (!values.ifscCode?.trim()) {
		errors.ifscCode = "IFSC code is required.";
	}

	if (!values.accountNumber?.trim()) {
		errors.accountNumber = "Account number is required.";
	}

	if (!values.gstin?.trim()) {
		errors.gstin = "GSTIN is required.";
	}

	if (!values.pan?.trim()) {
		errors.pan = "PAN is required.";
	}

	if (!values.reasonForOnboarding?.trim()) {
		errors.reasonForOnboarding = "Reason for onboarding is required.";
	}

	if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
		errors.email = "Enter a valid email.";
	}

	return errors;
};

type UseVendorCreationFormParams = {
	role?: VendorViewerRole;
	onSuccess?: () => void | Promise<void>;
};

export function useVendorCreationForm({
	role = "THCM_EMPLOYEE",
	onSuccess,
}: UseVendorCreationFormParams = {}) {
	const { id } = useParams();
	const navigate = useNavigate();
	const { showToast } = useToast();

	const vendorRequestId = id;

	const [currentStep, setCurrentStep] = React.useState(1);
	const [createdVendorRequestId, setCreatedVendorRequestId] = React.useState<
		string | null
	>(null);

	const resolvedVendorRequestId =
		vendorRequestId || createdVendorRequestId || "";

	const [formOneValues, setFormOneValues] =
		React.useState<VendorCreationFormOneValues>(initialFormOneValues);

	const [formTwoValues, setFormTwoValues] =
		React.useState<VendorCreationFormTwoValues>(initialFormTwoValues);

	const [formOneErrors, setFormOneErrors] = React.useState<
		VendorFormErrors<VendorCreationFormOneValues>
	>({});

	const [formTwoErrors, setFormTwoErrors] = React.useState<
		VendorFormErrors<VendorCreationFormTwoValues>
	>({});

	const detailQuery = useVendorOnboardingDetailQuery(vendorRequestId);

	const createFormOneMutation = useCreateVendorFormOneMutation();
	const updateFormOneMutation = useUpdateVendorFormOneMutation();

	const createFormTwoMutation = useCreateVendorFormTwoMutation();
	const updateFormTwoMutation = useUpdateVendorFormTwoMutation();

	const submitSummaryMutation = useSubmitVendorSummaryMutation();
	const approveVendorMutation = useApproveVendorMutation();
	const clarifyVendorMutation = useClarifyVendorMutation();
	const acceptAndCloseVendorMutation = useAcceptAndCloseVendorMutation();
	const addCommentMutation = useAddVendorCommentMutation();
	const deleteVendorMutation = useDeleteVendorMutation();

	React.useEffect(() => {
		if (!detailQuery.data) return;

		setFormOneValues({
			...initialFormOneValues,
			...detailQuery.data.partOne,
		});

		setFormTwoValues({
			...initialFormTwoValues,
			...detailQuery.data.partTwo,
		});
	}, [detailQuery.data]);

	const mutationLoading =
		createFormOneMutation.isPending ||
		updateFormOneMutation.isPending ||
		createFormTwoMutation.isPending ||
		updateFormTwoMutation.isPending ||
		submitSummaryMutation.isPending ||
		approveVendorMutation.isPending ||
		clarifyVendorMutation.isPending ||
		acceptAndCloseVendorMutation.isPending ||
		addCommentMutation.isPending ||
		deleteVendorMutation.isPending;

	const hasExistingFormTwo = hasAnyFormValue<VendorCreationFormTwoValues>(
		detailQuery.data?.partTwo,
	);

	const handleNext = () => {
		setCurrentStep((prev) => Math.min(prev + 1, vendorOnboardingSteps.length));
	};

	const handleBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	const handleFormOneChange = <K extends keyof VendorCreationFormOneValues>(
		key: K,
		value: VendorCreationFormOneValues[K],
	) => {
		setFormOneValues((prev) => ({
			...prev,
			[key]: value,
		}));

		setFormOneErrors((prev) => ({
			...prev,
			[key]: "",
		}));
	};

	const handleFormTwoChange = <K extends keyof VendorCreationFormTwoValues>(
		key: K,
		value: VendorCreationFormTwoValues[K],
	) => {
		setFormTwoValues((prev) => ({
			...prev,
			[key]: value,
		}));

		setFormTwoErrors((prev) => ({
			...prev,
			[key]: "",
		}));
	};

	const handleSaveFormOne = async () => {
		try {
			const errors = validateFormOne(formOneValues);

			if (Object.keys(errors).length > 0) {
				setFormOneErrors(errors);

				showToast({
					type: "error",
					title: "Validation Error",
					description: "Please complete all required vendor master fields.",
				});

				return;
			}

			if (resolvedVendorRequestId) {
				await updateFormOneMutation.mutateAsync({
					vendorRequestId: resolvedVendorRequestId,
					payload: formOneValues,
				});

				showToast({
					type: "success",
					title: "Success",
					description: "Vendor master details updated successfully.",
				});
			} else {
				const savedData = await createFormOneMutation.mutateAsync({
					payload: formOneValues,
				});

				setCreatedVendorRequestId(savedData.id);

				showToast({
					type: "success",
					title: "Success",
					description: "Vendor master details submitted successfully.",
				});
			}

			handleNext();
		} catch (error: unknown) {
			console.error("Vendor form one save failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(
					error,
					"Failed to save vendor master details.",
				),
			});
		}
	};

	const handleSaveFormTwo = async () => {
		try {
			if (!resolvedVendorRequestId) {
				showToast({
					type: "error",
					title: "Error",
					description: "Vendor request ID not found.",
				});

				return;
			}

			const errors = validateFormTwo(formTwoValues);

			if (Object.keys(errors).length > 0) {
				setFormTwoErrors(errors);

				showToast({
					type: "error",
					title: "Validation Error",
					description:
						"Please complete all required finance and compliance fields.",
				});

				return;
			}

			if (hasExistingFormTwo) {
				await updateFormTwoMutation.mutateAsync({
					vendorRequestId: resolvedVendorRequestId,
					payload: formTwoValues,
				});

				showToast({
					type: "success",
					title: "Success",
					description: "Finance and compliance details updated successfully.",
				});
			} else {
				await createFormTwoMutation.mutateAsync({
					vendorRequestId: resolvedVendorRequestId,
					payload: formTwoValues,
				});

				showToast({
					type: "success",
					title: "Success",
					description: "Finance and compliance details saved successfully.",
				});
			}

			handleNext();
		} catch (error: unknown) {
			console.error("Vendor form two save failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(
					error,
					"Failed to save finance and compliance details.",
				),
			});
		}
	};

	const handleSubmitSummary = async () => {
		try {
			if (!resolvedVendorRequestId) {
				showToast({
					type: "error",
					title: "Error",
					description: "Vendor request ID not found.",
				});

				return;
			}

			const payload = {
				partOne: formOneValues,
				partTwo: formTwoValues,
				status: "THCM_SUBMITTED" as const,
			};

			const savedData = await submitSummaryMutation.mutateAsync({
				vendorRequestId: resolvedVendorRequestId,
				payload,
			});

			showToast({
				type: "success",
				title: "Success",
				description: "Vendor onboarding request submitted successfully.",
			});

			if (onSuccess) {
				await onSuccess();
				return;
			}

			console.log("Summary submitted:", savedData);
			navigate("/vendor/listing");
		} catch (error: unknown) {
			console.error("Vendor summary submit failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(
					error,
					"Failed to submit vendor onboarding request.",
				),
			});
		}
	};

	const handleApprove = async () => {
		try {
			if (!resolvedVendorRequestId) {
				showToast({
					type: "error",
					title: "Error",
					description: "Vendor request ID not found.",
				});

				return;
			}

			await approveVendorMutation.mutateAsync(resolvedVendorRequestId);

			showToast({
				type: "success",
				title: "Success",
				description: "Vendor onboarding request approved successfully.",
			});
		} catch (error: unknown) {
			console.error("Vendor approve failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(
					error,
					"Failed to approve vendor onboarding request.",
				),
			});
		}
	};

	const handleClarify = async (reason = "Clarification required.") => {
		try {
			if (!resolvedVendorRequestId) {
				showToast({
					type: "error",
					title: "Error",
					description: "Vendor request ID not found.",
				});

				return;
			}

			await clarifyVendorMutation.mutateAsync({
				vendorRequestId: resolvedVendorRequestId,
				payload: {
					reason,
				},
			});

			showToast({
				type: "success",
				title: "Clarification Requested",
				description: "Clarification has been requested successfully.",
			});
		} catch (error: unknown) {
			console.error("Vendor clarify failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(error, "Failed to request clarification."),
			});
		}
	};

	const handleAcceptAndClose = async () => {
		try {
			if (!resolvedVendorRequestId) {
				showToast({
					type: "error",
					title: "Error",
					description: "Vendor request ID not found.",
				});

				return;
			}

			await acceptAndCloseVendorMutation.mutateAsync(resolvedVendorRequestId);

			showToast({
				type: "success",
				title: "Success",
				description: "Vendor onboarding request accepted and closed.",
			});
		} catch (error: unknown) {
			console.error("Vendor accept and close failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(
					error,
					"Failed to accept and close vendor onboarding request.",
				),
			});
		}
	};

	const handleAddComment = async (payload: VendorCommentPayload) => {
		try {
			if (!resolvedVendorRequestId) {
				showToast({
					type: "error",
					title: "Error",
					description: "Vendor request ID not found.",
				});

				return;
			}

			await addCommentMutation.mutateAsync({
				vendorRequestId: resolvedVendorRequestId,
				payload,
			});

			showToast({
				type: "success",
				title: "Comment Added",
				description: "Comment added successfully.",
			});
		} catch (error: unknown) {
			console.error("Vendor comment failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(error, "Failed to add comment."),
			});
		}
	};

	const handleDelete = async () => {
		try {
			if (!resolvedVendorRequestId) {
				showToast({
					type: "error",
					title: "Error",
					description: "Vendor request ID not found.",
				});

				return;
			}

			await deleteVendorMutation.mutateAsync({
				vendorRequestId: resolvedVendorRequestId,
			});

			showToast({
				type: "success",
				title: "Deleted",
				description: "Vendor onboarding request deleted successfully.",
			});

			navigate("/vendor/listing");
		} catch (error: unknown) {
			console.error("Vendor delete failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(
					error,
					"Failed to delete vendor onboarding request.",
				),
			});
		}
	};

	const canSubmit = role === "THCM_EMPLOYEE";
	const canApprove = role === "THCM_APPROVER";
	const canClarify = role === "THCM_APPROVER";
	const canAcceptAndClose = role === "EXTERNAL_APPROVER";

	return {
		vendorOnboardingSteps,
		currentStep,
		setCurrentStep,

		vendorRequestId: resolvedVendorRequestId,

		formOneValues,
		formTwoValues,
		formOneErrors,
		formTwoErrors,

		role,
		canSubmit,
		canApprove,
		canClarify,
		canAcceptAndClose,

		isLoading: detailQuery.isLoading,
		isError: detailQuery.isError,
		mutationLoading,

		handleNext,
		handleBack,
		handleFormOneChange,
		handleFormTwoChange,

		handleSaveFormOne,
		handleSaveFormTwo,
		handleSubmitSummary,
		handleApprove,
		handleClarify,
		handleAcceptAndClose,
		handleAddComment,
		handleDelete,
	};
}
