import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useToast } from "../../../context/Auth/AuthContext";
import type { VendorCreationFormOneSubmission } from "../forms/VendorCreationFormOne";

import {
	useAcceptAndCloseVendorMutation,
	useCreateVendorFormOneMutation,
	usePublicVendorSessionQuery,
	useSubmitPublicVendorFormMutation,
	useSubmitVendorSummaryMutation,
	useUpdateVendorFormOneMutation,
	useUpdateVendorFormTwoMutation,
	useVendorOnboardingDetailQuery,
} from "../queries/useVendorMutations";

import {
	VENDOR_DOCUMENT_FIELDS,
	type VendorCreationFormOneValues,
	type VendorCreationFormTwoValues,
	type VendorDocumentType,
	type VendorFormErrors,
	type VendorViewerRole,
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
	natureOfService: "",
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

const appendTextField = (
	formData: FormData,
	fieldName: string,
	value?: string,
): void => {
	formData.append(fieldName, value?.trim() ?? "");
};

const convertYesNoToBooleanString = (value?: string): "true" | "false" => {
	const normalizedValue = value?.trim().toLowerCase();

	return normalizedValue === "yes" || normalizedValue === "true"
		? "true"
		: "false";
};

const buildPublicVendorFormData = (
	values: VendorCreationFormOneValues,
	submission: VendorCreationFormOneSubmission,
): FormData => {
	const formData = new FormData();

	appendTextField(formData, "vendorName", values.vendorName);
	appendTextField(formData, "state", values.state);
	appendTextField(formData, "city", values.city);
	appendTextField(formData, "pinCode", values.pinCode);
	appendTextField(formData, "address", values.completeAddress);
	appendTextField(formData, "mobile", values.mobile);
	appendTextField(formData, "email", values.email);

	formData.append("msmeVendor", convertYesNoToBooleanString(values.msmeVendor));

	formData.append(
		"msmeCertAttached",
		convertYesNoToBooleanString(values.msmeCertificateAttached),
	);

	appendTextField(formData, "bankName", values.bank);
	appendTextField(formData, "bankBranch", values.branch);
	appendTextField(formData, "ifscCode", values.ifscCode);
	appendTextField(formData, "bankAddress", values.bankAddress);
	appendTextField(formData, "accountNumber", values.accountNumber);
	appendTextField(formData, "gstin", values.gstin);
	appendTextField(formData, "pan", values.pan);
	appendTextField(formData, "entityRegNo", values.entityRegistrationNumber);

	formData.append("dpdpConsent", String(submission.dpdpConsent));

	submission.enclosureUploads.forEach(({ documentType, value }) => {
		if (!(value?.file instanceof File)) {
			return;
		}

		formData.append(documentType, value.file, value.name || value.file.name);
	});

	return formData;
};

const getMissingPublicDocuments = (
	submission: VendorCreationFormOneSubmission,
): VendorDocumentType[] => {
	return VENDOR_DOCUMENT_FIELDS.filter((field) => field.required)
		.filter((field) => {
			const upload = submission.enclosureUploads.find(
				(item) => item.documentType === field.documentType,
			);

			return !(upload?.value?.file instanceof File);
		})
		.map((field) => field.documentType);
};

type UseVendorCreationFormParams = {
	role?: VendorViewerRole;
	vendorRequestId?: string;
	token?: string;
	isPublicForm?: boolean;
	onSuccess?: () => void | Promise<void>;
};

export function useVendorCreationForm({
	role = "THCM_EMPLOYEE",
	vendorRequestId: providedVendorRequestId,
	token = "",
	isPublicForm = false,
	onSuccess,
}: UseVendorCreationFormParams = {}) {
	const routeParams = useParams<{
		id?: string;
		onboardingId?: string;
	}>();

	const navigate = useNavigate();
	const { showToast } = useToast();

	const normalizedToken = token.trim();

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
		vendorRequestId ||
		createdVendorRequestId ||
		"021b54a9-f7c9-444a-8d60-703def2c0e94";

	const publicVendorSessionQuery = usePublicVendorSessionQuery(
		normalizedToken,
		isPublicForm && normalizedToken.length > 0,
	);

	const internalVendorQuery = useVendorOnboardingDetailQuery(
		resolvedVendorRequestId,
		!isPublicForm && Boolean(resolvedVendorRequestId),
	);
	const isPublicVendor = isPublicForm && role === "EXTERNAL_VENDOR";
	const isInternalThcmUser = !isPublicForm && role === "THCM_EMPLOYEE";

	const canEditFormOne = isPublicVendor || isInternalThcmUser;

	const canEditFormTwo = isInternalThcmUser;

	const createFormOneMutation = useCreateVendorFormOneMutation();

	const updateFormOneMutation = useUpdateVendorFormOneMutation();

	const updateFormTwoMutation = useUpdateVendorFormTwoMutation();

	const submitSummaryMutation = useSubmitVendorSummaryMutation();

	const acceptAndCloseVendorMutation = useAcceptAndCloseVendorMutation();

	const publicVendorSubmitMutation = useSubmitPublicVendorFormMutation();

	React.useEffect(() => {
		if (!isPublicForm || !publicVendorSessionQuery.data) {
			return;
		}

		const sessionData = publicVendorSessionQuery.data;

		const initialPublicValues = sessionData.partOne ?? {};

		setFormOneValues((previousValues) => ({
			...previousValues,
			...initialPublicValues,

			vendorName:
				initialPublicValues.vendorName ||
				sessionData.vendorName ||
				previousValues.vendorName ||
				"",

			email:
				initialPublicValues.email ||
				sessionData.email ||
				previousValues.email ||
				"",

			mobile:
				initialPublicValues.mobile ||
				sessionData.mobile ||
				previousValues.mobile ||
				"",
		}));
	}, [isPublicForm, publicVendorSessionQuery.data]);

	React.useEffect(() => {
		if (isPublicForm || !internalVendorQuery.data) {
			return;
		}

		setFormOneValues({
			...initialFormOneValues,
			...(internalVendorQuery.data.partOne ?? {}),
		});

		setFormTwoValues({
			...initialFormTwoValues,
			...(internalVendorQuery.data.partTwo ?? {}),
		});
	}, [isPublicForm, internalVendorQuery.data]);

	const mutationLoading =
		publicVendorSubmitMutation.isPending ||
		createFormOneMutation.isPending ||
		updateFormOneMutation.isPending ||
		updateFormTwoMutation.isPending ||
		submitSummaryMutation.isPending ||
		acceptAndCloseVendorMutation.isPending;

	const canSubmitVendorForm = isPublicVendor;
	const canSubmit = isInternalThcmUser;

	const canApprove = false;
	const canClarify = false;

	const canAcceptAndClose = role === "EXTERNAL_APPROVER";

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

	const handleVendorSubmitForm = async (
		submission?: VendorCreationFormOneSubmission,
	) => {
		try {
			if (isPublicForm) {
				if (!normalizedToken) {
					showToast({
						type: "error",
						title: "Invalid Link",
						description: "The vendor onboarding session code is missing.",
					});

					return;
				}

				if (!submission?.dpdpConsent) {
					showToast({
						type: "error",
						title: "Consent Required",
						description:
							"Please accept the Data Privacy Notice before submitting.",
					});

					return;
				}

				const missingDocuments = getMissingPublicDocuments(submission);

				if (missingDocuments.length > 0) {
					showToast({
						type: "error",
						title: "Documents Required",
						description: `Please upload: ${missingDocuments.join(", ")}`,
					});

					return;
				}

				const formData = buildPublicVendorFormData(formOneValues, submission);

				await publicVendorSubmitMutation.mutateAsync({
					token: normalizedToken,
					formData,
				});
			} else if (resolvedVendorRequestId) {
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

			showToast({
				type: "success",
				title: "Success",
				description: "THCM details saved successfully.",
			});

			handleNext();
		} catch (error: unknown) {
			console.error("Vendor form two save failed:", error);

			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(error, "Failed to save THCM details."),
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

		isLoading: isPublicForm
			? publicVendorSessionQuery.isLoading
			: internalVendorQuery.isLoading,

		isError: isPublicForm
			? publicVendorSessionQuery.isError
			: internalVendorQuery.isError,

		publicSessionError: publicVendorSessionQuery.error,

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
