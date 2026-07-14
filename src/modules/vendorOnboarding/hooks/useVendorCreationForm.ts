import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";

import { vendorOnboardingApi } from "../api/vendorOnboarding.api";

import {
	useAcceptAndCloseVendorMutation,
	useCreateVendorFormOneMutation,
	useSubmitVendorSummaryMutation,
	useUpdateVendorFormOneMutation,
	useUpdateVendorFormTwoMutation,
} from "../queries/useVendorMutations";

import type {
	VendorCreationFormOneValues,
	VendorCreationFormTwoValues,
	VendorFormErrors,
	VendorViewerRole,
} from "../types/vendorOnboarding.types";

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

type UseVendorCreationFormParams = {
	role?: VendorViewerRole;
	vendorRequestId?: string;
	onSuccess?: () => void | Promise<void>;
};

export function useVendorCreationForm({
	role = "THCM_EMPLOYEE",
	vendorRequestId: providedVendorRequestId,
	onSuccess,
}: UseVendorCreationFormParams = {}) {
	const routeParams = useParams<{
		id?: string;
		onboardingId?: string;
	}>();

	const navigate = useNavigate();
	const { showToast } = useToast();
	const { workspaceId } = useAuth();

	const vendorRequestId =
		providedVendorRequestId ?? routeParams.onboardingId ?? routeParams.id;

	const [currentStep, setCurrentStep] = React.useState(1);

	const [createdVendorRequestId, setCreatedVendorRequestId] = React.useState<
		string | null
	>(null);

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

	const resolvedVendorRequestId =
		vendorRequestId || createdVendorRequestId || "";

	const createFormOneMutation = useCreateVendorFormOneMutation();

	const updateFormOneMutation = useUpdateVendorFormOneMutation();

	const updateFormTwoMutation = useUpdateVendorFormTwoMutation();

	const submitSummaryMutation = useSubmitVendorSummaryMutation();

	const acceptAndCloseVendorMutation = useAcceptAndCloseVendorMutation();

	const assignWorkflowMutation = useMutation({
		mutationFn: vendorOnboardingApi.assignWorkflow,
	});

	const mutationLoading =
		createFormOneMutation.isPending ||
		updateFormOneMutation.isPending ||
		updateFormTwoMutation.isPending ||
		submitSummaryMutation.isPending ||
		assignWorkflowMutation.isPending ||
		acceptAndCloseVendorMutation.isPending;

	const isExternalVendor = role === "EXTERNAL_VENDOR";
	const isThcmEmployee = role === "THCM_EMPLOYEE";

	const canEditFormOne = isExternalVendor || isThcmEmployee;

	const canEditFormTwo = isThcmEmployee;
	const canSubmitVendorForm = isExternalVendor;
	const canSubmit = isThcmEmployee;

	const canApprove = false;
	const canClarify = false;

	const canAcceptAndClose = role === "EXTERNAL_APPROVER";

	const DEALER_CLAIMS_APP_ID = "cc2ce3f6-1924-4d5e-9ef1-ecac0fb0b411";

	const WORKFLOW_BUDGET = 25000;

	const handleNext = () => {
		setCurrentStep((previousStep) =>
			Math.min(previousStep + 1, vendorOnboardingSteps.length),
		);
	};

	const handleBack = () => {
		setCurrentStep((previousStep) => Math.max(previousStep - 1, 1));
	};

	const handleFormOneChange = <K extends keyof VendorCreationFormOneValues>(
		key: K,
		value: VendorCreationFormOneValues[K],
	) => {
		setFormOneValues((previousValues) => ({
			...previousValues,
			[key]: value,
		}));

		setFormOneErrors((previousErrors) => ({
			...previousErrors,
			[key]: "",
		}));
	};

	const handleFormTwoChange = <K extends keyof VendorCreationFormTwoValues>(
		key: K,
		value: VendorCreationFormTwoValues[K],
	) => {
		setFormTwoValues((previousValues) => ({
			...previousValues,
			[key]: value,
		}));

		setFormTwoErrors((previousErrors) => ({
			...previousErrors,
			[key]: "",
		}));
	};

	const handleSaveFormOne = async () => {
		try {
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

			await onSuccess?.();
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

			await updateFormTwoMutation.mutateAsync({
				vendorRequestId: resolvedVendorRequestId,
				payload: formTwoValues,
			});

			await assignWorkflowMutation.mutateAsync({
				eventProposalId: resolvedVendorRequestId,
				workspaceId,
				appId: DEALER_CLAIMS_APP_ID,
				budget: WORKFLOW_BUDGET,
			});

			showToast({
				type: "success",
				title: "Success",
				description: "THCM details saved and workflow assigned successfully.",
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

			await submitSummaryMutation.mutateAsync({
				vendorRequestId: resolvedVendorRequestId,
				payload: {
					partOne: formOneValues,
					partTwo: formTwoValues,
					status: "THCM_SUBMITTED",
				},
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

			if (onSuccess) {
				await onSuccess();
				return;
			}

			navigate("/vendor/listing?tab=onboarding");
		} catch (error: unknown) {
			console.error("Vendor close failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(
					error,
					"Failed to close vendor onboarding request.",
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

		isLoading: false,
		isError: false,
		mutationLoading,

		handleNext,
		handleBack,

		handleFormOneChange,
		handleFormTwoChange,

		handleSaveFormOne,
		handleSaveFormTwo,
		handleVendorSubmitForm,
		handleSubmitSummary,
		handleAcceptAndClose,
	};
}
