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
import { useMutation } from "@tanstack/react-query";
import { vendorOnboardingApi } from "../api/vendorOnboarding.api";
import { useAuth } from "../../../context/Auth/useAuth";

const vendorOnboardingSteps = [
	{ id: 1, label: "Vendor filled details" },
	{ id: 2, label: "THCM details" },
	{ id: 3, label: "Review & Submit" },
];

const initialFormOneValues: VendorCreationFormOneValues = {
	vendorName: "",
	completeAddress: "",
	msmeVendor: "",
	msmeCertificateAttached: "",
	city: "",
	pinCode: "",
	state: "",

	mobile: "",
	email: "",

	bank: "",
	branch: "",
	ifscCode: "",
	bankAddress: "",
	accountNumber: "",

	gstin: "",
	pan: "",
	entityRegistrationNumber: "",

	gstCertificate: "",
	panNumber: "",
	bankCancelledCheque: "",
	certificateOfIncorporation: "",
	msmeCertificate: "",
	ndaCertificate: "",
};

const initialFormTwoValues: VendorCreationFormTwoValues = {
	vendorCode: "",
	vendorType: "",
	companyCode: "",
	purchaseOrg: "",

	paymentTerm: "",
	tds: "",

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

// const validateFormOne = (
// 	values: VendorCreationFormOneValues,
// ): VendorFormErrors<VendorCreationFormOneValues> => {
// 	const errors: VendorFormErrors<VendorCreationFormOneValues> = {};

// 	if (!values.vendorName?.trim()) {
// 		errors.vendorName = "Vendor name is required.";
// 	}

// 	if (!values.completeAddress?.trim()) {
// 		errors.completeAddress = "Complete address is required.";
// 	}

// 	if (!values.msmeVendor?.trim()) {
// 		errors.msmeVendor = "MSME vendor is required.";
// 	}

// 	if (!values.city?.trim()) {
// 		errors.city = "City is required.";
// 	}

// 	if (!values.pinCode?.trim()) {
// 		errors.pinCode = "Pin code is required.";
// 	}

// 	if (!values.region?.trim()) {
// 		errors.region = "Region is required.";
// 	}

// 	if (!values.mobile?.trim()) {
// 		errors.mobile = "Mobile number is required.";
// 	}

// 	if (!values.email?.trim()) {
// 		errors.email = "Email is required.";
// 	}

// 	if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
// 		errors.email = "Enter a valid email.";
// 	}

// 	if (!values.bank?.trim()) {
// 		errors.bank = "Bank name is required.";
// 	}

// 	if (!values.branch?.trim()) {
// 		errors.branch = "Branch is required.";
// 	}

// 	if (!values.ifscCode?.trim()) {
// 		errors.ifscCode = "IFSC code is required.";
// 	}

// 	if (!values.accountNumber?.trim()) {
// 		errors.accountNumber = "Account number is required.";
// 	}

// 	if (!values.gstin?.trim()) {
// 		errors.gstin = "GSTIN is required.";
// 	}

// 	if (!values.pan?.trim()) {
// 		errors.pan = "PAN is required.";
// 	}

// 	return errors;
// };

// const validateFormTwo = (
// 	values: VendorCreationFormTwoValues,
// ): VendorFormErrors<VendorCreationFormTwoValues> => {
// 	const errors: VendorFormErrors<VendorCreationFormTwoValues> = {};

// 	if (!values.vendorType?.trim()) {
// 		errors.vendorType = "Vendor type is required.";
// 	}

// 	if (!values.companyCode?.trim()) {
// 		errors.companyCode = "Company code is required.";
// 	}

// 	if (!values.purchaseOrg?.trim()) {
// 		errors.purchaseOrg = "Purchase org is required.";
// 	}

// 	if (!values.reasonForOnboarding?.trim()) {
// 		errors.reasonForOnboarding = "Reason for onboarding is required.";
// 	}

// 	return errors;
// };

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
	const { workspaceId, logout } = useAuth();
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
	const assignWorkflowMutation = useMutation({
		mutationFn: vendorOnboardingApi.assignWorkflow,
	});
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
		assignWorkflowMutation.isPending ||
		submitSummaryMutation.isPending ||
		approveVendorMutation.isPending ||
		clarifyVendorMutation.isPending ||
		acceptAndCloseVendorMutation.isPending ||
		addCommentMutation.isPending ||
		deleteVendorMutation.isPending;

	const hasExistingFormTwo = hasAnyFormValue<VendorCreationFormTwoValues>(
		detailQuery.data?.partTwo,
	);
	const TEN_MINUTES = 10 * 60 * 1000;
	const isExternalVendor = role === "EXTERNAL_VENDOR";
	const isThcmEmployee = role === "THCM_EMPLOYEE";

	const canEditFormOne = isExternalVendor || isThcmEmployee;
	const canEditFormTwo = isThcmEmployee;

	const canSubmitVendorForm = isExternalVendor;
	const canSubmit = isThcmEmployee;
	const canApprove = role === "THCM_APPROVER";
	const canClarify = role === "THCM_APPROVER";
	const canAcceptAndClose = role === "EXTERNAL_APPROVER";
	const DEALER_CLAIMS_APP_ID = "cc2ce3f6-1924-4d5e-9ef1-ecac0fb0b411";
	const WORKFLOW_BUDGET = 25000;

	const workflowPayload = {
		eventProposalId: resolvedVendorRequestId,
		workspaceId,
		appId: DEALER_CLAIMS_APP_ID,
		budget: WORKFLOW_BUDGET,
	};

	// useEffect(() => {
	// 	if (user?.role !== "EXTERNAL_VENDOR") {
	// 		return;
	// 	}

	// 	const logoutTimer = window.setTimeout(() => {
	// 		logout();
	// 	}, TEN_MINUTES);

	// 	return () => {
	// 		window.clearTimeout(logoutTimer);
	// 	};
	// }, [user?.role, logout]);

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
			// const errors = validateFormOne(formOneValues);

			// if (Object.keys(errors).length > 0) {
			// 	setFormOneErrors(errors);

			// 	showToast({
			// 		type: "error",
			// 		title: "Validation Error",
			// 		description: "Please complete all required vendor fields.",
			// 	});

			// 	return;
			// }

			if (resolvedVendorRequestId) {
				await updateFormOneMutation.mutateAsync({
					vendorRequestId: resolvedVendorRequestId,
					payload: formOneValues,
				});

				showToast({
					type: "success",
					title: "Success",
					description: "Vendor filled details updated successfully.",
				});
			} else {
				const savedData = await createFormOneMutation.mutateAsync({
					payload: formOneValues,
				});

				setCreatedVendorRequestId(savedData.id);

				showToast({
					type: "success",
					title: "Success",
					description: "Vendor filled details saved successfully.",
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
					"Failed to save vendor filled details.",
				),
			});
		}
	};

	const handleVendorSubmitForm = async () => {
		try {
			// const errors = validateFormOne(formOneValues);

			// if (Object.keys(errors).length > 0) {
			// 	setFormOneErrors(errors);

			// 	showToast({
			// 		type: "error",
			// 		title: "Validation Error",
			// 		description: "Please complete all required vendor fields.",
			// 	});

			// 	return;
			// }

			if (resolvedVendorRequestId) {
				await updateFormOneMutation.mutateAsync({
					vendorRequestId: resolvedVendorRequestId,
					payload: formOneValues,
				});
			} else {
				const savedData = await createFormOneMutation.mutateAsync({
					payload: formOneValues,
				});

				setCreatedVendorRequestId(savedData.id);
			}

			showToast({
				type: "success",
				title: "Form Filled",
				description: "Vendor form has been filled successfully.",
			});

			if (onSuccess) {
				await onSuccess();
			}
		} catch (error: unknown) {
			console.error("Vendor form submit failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(error, "Failed to submit vendor form."),
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

			// const errors = validateFormTwo(formTwoValues);

			// if (Object.keys(errors).length > 0) {
			// 	setFormTwoErrors(errors);

			// 	showToast({
			// 		type: "error",
			// 		title: "Validation Error",
			// 		description: "Please complete all required THCM fields.",
			// 	});

			// 	return;
			// }

			if (hasExistingFormTwo) {
				await updateFormTwoMutation.mutateAsync({
					vendorRequestId: resolvedVendorRequestId,
					payload: formTwoValues,
				});
			} else {
				await createFormTwoMutation.mutateAsync({
					vendorRequestId: resolvedVendorRequestId,
					payload: formTwoValues,
				});
			}

			console.log("Assign workflow payload:", workflowPayload);

			const workflowResponse =
				await assignWorkflowMutation.mutateAsync(workflowPayload);

			console.log("Assigned workflow response:", workflowResponse);

			showToast({
				type: "success",
				title: "Success",
				description: hasExistingFormTwo
					? "THCM details updated and workflow assigned successfully."
					: "THCM details saved and workflow assigned successfully.",
			});

			handleNext();
		} catch (error: unknown) {
			console.error(
				"Vendor form two save or workflow assignment failed:",
				error,
			);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(
					error,
					"Failed to save THCM details or assign the approval workflow.",
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
			navigate("/vendor/listing?tab=onboarding");
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

			navigate("/vendor/listing?tab=onboarding");
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
		canEditFormOne,
		canEditFormTwo,
		canSubmitVendorForm,
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
		handleVendorSubmitForm,
		handleSubmitSummary,
		handleApprove,
		handleClarify,
		handleAcceptAndClose,
		handleAddComment,
		handleDelete,
	};
}
