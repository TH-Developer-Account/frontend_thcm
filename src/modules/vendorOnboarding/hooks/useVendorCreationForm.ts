import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ApprovalStageLike } from "../../../components/ui/workflow/approvalWorkflow.types";
import { useToast } from "../../../context/Auth/AuthContext";
import type { VendorCreationFormOneSubmission } from "../forms/VendorCreationFormOne";
import {
	useAcceptAndCloseVendorMutation,
	useCreateVendorMutation,
	usePublicVendorSessionQuery,
	useSubmitPublicVendorFormMutation,
	useSubmitVendorMutation,
	useUpdateVendorMutation,
	useVendorOnboardingDetailQuery,
} from "../queries/useVendorMutations";
import {
	buildThcmUpdatePayload,
	buildVendorUpdatePayload,
} from "../utils/vendor.onboarding.helper";
import {
	VENDOR_DOCUMENT_FIELDS,
	type VendorCreationFormOneValues,
	type VendorCreationFormTwoValues,
	type VendorDocumentType,
	type VendorFormErrors,
	type VendorViewerRole,
} from "../types/vendorOnboarding.types";
import { useAuth } from "../../../context/Auth/useAuth";
import { getStoredAppId } from "../../marketing/activity-planner/helpers/localstorage";
import { vendorOnboardingApi } from "../api/vendorOnboarding.api";

export const vendorOnboardingSteps = [
	{ id: 1, label: "Vendor filled details" },
	{ id: 2, label: "THCM details" },
	{ id: 3, label: "Review & Submit" },
];

const EMPTY_FORM_ONE: VendorCreationFormOneValues = {};
const EMPTY_FORM_TWO: VendorCreationFormTwoValues = {};

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
	return error instanceof Error ? error.message : fallback;
};

const buildPublicFormData = (
	values: VendorCreationFormOneValues,
	submission: VendorCreationFormOneSubmission,
) => {
	const formData = new FormData();
	const payload = buildVendorUpdatePayload(values);

	Object.entries(payload).forEach(([key, value]) => {
		formData.append(key, value === null ? "" : String(value));
	});
	formData.append("dpdpConsent", "true");

	submission.enclosureUploads.forEach(({ documentType, value }) => {
		if (value?.file instanceof File) {
			formData.append(documentType, value.file, value.name || value.file.name);
		}
	});

	return formData;
};

const getMissingDocuments = (
	submission: VendorCreationFormOneSubmission,
): VendorDocumentType[] =>
	VENDOR_DOCUMENT_FIELDS.filter((field) => field.required)
		.filter(
			(field) =>
				!submission.enclosureUploads.some(
					(item) =>
						item.documentType === field.documentType &&
						item.value?.file instanceof File,
				),
		)
		.map((field) => field.documentType);

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
	const params = useParams<{
		id?: string;
		onboardingId?: string;
		vendorRequestId?: string;
	}>();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { workspaceId } = useAuth();
	const appId = React.useMemo(() => getStoredAppId(), []);
	const routeVendorId =
		providedVendorRequestId ??
		params.onboardingId ??
		params.vendorRequestId ??
		params.id ??
		"";
	const normalizedToken = token.trim();

	const [currentStep, setCurrentStep] = React.useState(1);
	const [createdVendorId, setCreatedVendorId] = React.useState("");
	const [formOneValues, setFormOneValues] =
		React.useState<VendorCreationFormOneValues>(EMPTY_FORM_ONE);
	const [formTwoValues, setFormTwoValues] =
		React.useState<VendorCreationFormTwoValues>(EMPTY_FORM_TWO);
	const [formOneErrors, setFormOneErrors] = React.useState<
		VendorFormErrors<VendorCreationFormOneValues>
	>({});
	const [formTwoErrors, setFormTwoErrors] = React.useState<
		VendorFormErrors<VendorCreationFormTwoValues>
	>({});

	const vendorRequestId = routeVendorId || createdVendorId;
	const isInternal = !isPublicForm && role === "THCM_EMPLOYEE";
	const isPublicVendor = isPublicForm && role === "EXTERNAL_VENDOR";

	const detailQuery = useVendorOnboardingDetailQuery(
		vendorRequestId,
		!isPublicForm,
	);
	const publicQuery = usePublicVendorSessionQuery(
		normalizedToken,
		isPublicForm,
	);

	const createMutation = useCreateVendorMutation();
	const updateMutation = useUpdateVendorMutation();
	const submitMutation = useSubmitVendorMutation();
	const closeMutation = useAcceptAndCloseVendorMutation();
	const publicSubmitMutation = useSubmitPublicVendorFormMutation();

	const publicInitKeyRef = React.useRef("");
	React.useEffect(() => {
		const data = publicQuery.data;
		if (!isPublicForm || !data) return;

		const key = `${normalizedToken}:${publicQuery.dataUpdatedAt}`;
		if (publicInitKeyRef.current === key) return;
		publicInitKeyRef.current = key;

		const partOne = data.partOne ?? {};
		setFormOneValues({
			...partOne,
			vendorName: partOne.vendorName || data.vendorName || "",
			email: partOne.email || data.email || "",
			mobile: partOne.mobile || data.mobile || "",
		});
	}, [
		isPublicForm,
		normalizedToken,
		publicQuery.data,
		publicQuery.dataUpdatedAt,
	]);

	const detailInitKeyRef = React.useRef("");
	React.useEffect(() => {
		const data = detailQuery.data;
		if (isPublicForm || !data) return;

		const key = `${vendorRequestId}:${detailQuery.dataUpdatedAt}`;
		if (detailInitKeyRef.current === key) return;
		detailInitKeyRef.current = key;

		setFormOneValues(data.partOne);
		setFormTwoValues(data.partTwo);
	}, [
		detailQuery.data,
		detailQuery.dataUpdatedAt,
		isPublicForm,
		vendorRequestId,
	]);
	const workflowStages = React.useMemo<readonly ApprovalStageLike[]>(
		() => detailQuery.data?.activeWorkflow?.stages ?? [],
		[detailQuery.data?.activeWorkflow?.stages],
	);

	const next = React.useCallback(() => {
		setCurrentStep((step) => Math.min(step + 1, vendorOnboardingSteps.length));
	}, []);
	const back = React.useCallback(() => {
		setCurrentStep((step) => Math.max(step - 1, 1));
	}, []);

	const changeFormOne = React.useCallback(
		<K extends keyof VendorCreationFormOneValues>(
			key: K,
			value: VendorCreationFormOneValues[K],
		) => {
			setFormOneValues((current) => ({ ...current, [key]: value }));
			setFormOneErrors((current) => ({ ...current, [key]: "" }));
		},
		[],
	);

	const changeFormTwo = React.useCallback(
		<K extends keyof VendorCreationFormTwoValues>(
			key: K,
			value: VendorCreationFormTwoValues[K],
		) => {
			setFormTwoValues((current) => ({ ...current, [key]: value }));
			setFormTwoErrors((current) => ({ ...current, [key]: "" }));
		},
		[],
	);

	const saveVendorDetails = async () => {
		try {
			if (vendorRequestId) {
				await updateMutation.mutateAsync({
					vendorRequestId,
					payload: buildVendorUpdatePayload(formOneValues),
				});
			} else {
				const created = await createMutation.mutateAsync(formOneValues);
				setCreatedVendorId(created.id);
			}
			next();
		} catch (error) {
			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(error, "Failed to save vendor details."),
			});
		}
	};

	const saveThcmDetails = async () => {
		if (!vendorRequestId) return;
		try {
			await updateMutation.mutateAsync({
				vendorRequestId,
				payload: buildThcmUpdatePayload(formTwoValues),
			});
			next();
		} catch (error) {
			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(error, "Failed to save THCM details."),
			});
		}
	};

	const submitVendor = async () => {
		if (!vendorRequestId) return;
		try {
			await submitMutation.mutateAsync(vendorRequestId);
			showToast({
				type: "success",
				title: "Submitted",
				description: "Vendor onboarding submitted successfully.",
			});
			if (onSuccess) await onSuccess();
			else navigate("/vendor/listing?tab=onboarding");
		} catch (error) {
			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(error, "Failed to submit onboarding."),
			});
		}
	};

	const submitPublicVendor = async (
		submission?: VendorCreationFormOneSubmission,
	) => {
		if (!submission || !normalizedToken) return;
		const missing = getMissingDocuments(submission);
		if (!submission.dpdpConsent || missing.length) {
			showToast({
				type: "error",
				title: "Required information missing",
				description: missing.length
					? `Please upload: ${missing.join(", ")}`
					: "Please accept the Data Privacy Notice.",
			});
			return;
		}
		try {
			await publicSubmitMutation.mutateAsync({
				token: normalizedToken,
				formData: buildPublicFormData(formOneValues, submission),
			});
			await onSuccess?.();
		} catch (error) {
			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(error, "Failed to submit vendor form."),
			});
		}
	};

	const acceptAndClose = async () => {
		if (!vendorRequestId) return;
		await closeMutation.mutateAsync(vendorRequestId);
		navigate("/vendor/listing?tab=onboarding");
	};

	const refetchVendorDetail = detailQuery.refetch;

	const handleFetchWorkflow = useCallback(async () => {
		if (!workspaceId || !appId || !vendorRequestId) {
			return;
		}

		try {
			const response = await vendorOnboardingApi.assignWorkflow({
				workspaceId,
				appId,
				subjectType: "VENDOR_ONBOARDING",
				subjectId: vendorRequestId,
				criteria: {},
			});

			console.log("Vendor workflow assigned:", response);

			await refetchVendorDetail();
		} catch (error) {
			console.error("Workflow assignment failed:", error);
		}
	}, [workspaceId, appId, vendorRequestId, refetchVendorDetail]);

	const mutationLoading =
		createMutation.isPending ||
		updateMutation.isPending ||
		submitMutation.isPending ||
		closeMutation.isPending ||
		publicSubmitMutation.isPending;

	return {
		vendorOnboardingSteps,
		currentStep,
		setCurrentStep,
		vendorRequestId,
		formOneValues,
		formTwoValues,
		formOneDocuments: detailQuery.data?.documents ?? [],
		formOneErrors,
		formTwoErrors,
		role,
		canEditFormOne: isInternal,
		canEditFormTwo: isInternal,
		canSubmitVendorForm: isPublicVendor,
		canSubmit: isInternal,
		canApprove: role === "THCM_APPROVER",
		canClarify: role === "THCM_APPROVER",
		canAcceptAndClose: role === "EXTERNAL_APPROVER",
		isLoading: isPublicForm ? publicQuery.isLoading : detailQuery.isLoading,
		isError: isPublicForm ? publicQuery.isError : detailQuery.isError,
		publicSessionError: publicQuery.error,
		mutationLoading,
		status: detailQuery.data?.status,

		handleNext: next,
		handleBack: back,
		handleFormOneChange: changeFormOne,
		handleFormTwoChange: changeFormTwo,
		handleSaveFormOne: saveVendorDetails,
		handleSaveFormTwo: saveThcmDetails,
		handleVendorSubmitForm: submitPublicVendor,
		handleSubmitSummary: submitVendor,
		handleApprove: async () => undefined,
		handleClarify: async () => undefined,
		handleAcceptAndClose: acceptAndClose,
		handleFetchWorkflow,

		activeWorkflow: detailQuery.data?.activeWorkflow ?? null,
		workflowStages,
		workflowLoading: detailQuery.isFetching,
	};
}
