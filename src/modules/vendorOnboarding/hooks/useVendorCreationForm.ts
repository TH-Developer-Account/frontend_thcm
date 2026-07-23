import React, { type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { ApprovalStageLike } from "../../../components/ui/workflow/approvalWorkflow.types";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import type { ReasonActionMode } from "../../../components/ui/ReasonActionModal";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { workflowApi } from "../../../api/workflow.api";

import { getStoredAppId } from "../../marketing/activity-planner/helpers/localstorage";

import { vendorOnboardingApi } from "../api/vendorOnboarding.api";
import {
	// getApprovalIdForUser,
	getCurrentApprovalStage,
	getIsUserInCurrentStage,
} from "../../../components/ui/workflow/approvalWorkflow.helpers";
import {
	buildPublicFormData,
	buildVendorOnboardingUpdatePayload,
	buildVendorUpdatePayload,
	getErrorMessage,
	getMissingDocuments,
} from "../helpers/vendor.onboarding.helper";
import {
	useAcceptAndCloseVendorMutation,
	useCreateVendorMutation,
	usePublicVendorSessionQuery,
	useSubmitClarifiedUpdatedFormMutation,
	useSubmitPublicVendorFormMutation,
	useSubmitVendorMutation,
	useUpdateVendorMutation,
	useVendorOnboardingDetailQuery,
} from "../queries/useVendorMutations";
import type {
	VendorCreationFormOneValues,
	VendorCreationFormTwoValues,
	VendorDocumentField,
	VendorDocumentType,
	VendorEnclosureStatusKey,
	VendorFormErrors,
	VendorOnboardingDocument,
	VendorOnboardingStatus,
	VendorViewerRole,
} from "../types/vendorOnboarding.types";
import { VENDOR_DOCUMENT_FIELDS } from "../types/vendorOnboarding.types";

export const vendorOnboardingSteps = [
	{ id: 1, label: "Vendor filled details" },
	{ id: 2, label: "THCM details" },
	{ id: 3, label: "Review & Submit" },
];

const EMPTY_FORM_ONE: VendorCreationFormOneValues = {};
const EMPTY_FORM_TWO: VendorCreationFormTwoValues = {};

export type VendorEnclosureUploadItem = {
	statusKey: VendorEnclosureStatusKey;
	documentType: VendorDocumentType;
	value: FileUploadValue | null;
};

export type VendorCreationFormOneSubmission = {
	dpdpConsent: true;
	enclosureUploads: VendorEnclosureUploadItem[];
};

const REQUIRED_FORM_ONE_FIELDS: Partial<
	Record<keyof VendorCreationFormOneValues, string>
> = {
	state: "State is required.",
	city: "City is required.",
	pinCode: "Pin Code is required.",
	completeAddress: "Complete Address is required.",
	mobile: "Mobile is required.",
	email: "E-mail is required.",
	bank: "Bank is required.",
	branch: "Branch is required.",
	ifscCode: "IFSC Code is required.",
	accountNumber: "A/C No. is required.",
	confirmAccountNumber: "Confirm A/C No. is required.",
	gstin: "GSTIN is required.",
	pan: "PAN is required.",
	msmeVendor: "MSME Vendor is required.",
};

const isEmptyFormValue = (value: unknown): boolean =>
	typeof value === "string" ? value.trim().length === 0 : value == null;

type UseVendorCreationFormParams = {
	role?: VendorViewerRole;
	vendorRequestId?: string;
	token?: string;
	isPublicForm?: boolean;
	onSuccess?: () => void | Promise<void>;
};

type WorkflowPreviewResponse = {
	stages?: ApprovalStageLike[];
	workflow?: {
		stages?: ApprovalStageLike[];
	};
};

const getPreviewStages = (preview: unknown): ApprovalStageLike[] => {
	if (Array.isArray(preview)) {
		return preview as ApprovalStageLike[];
	}

	if (!preview || typeof preview !== "object") {
		return [];
	}

	const response = preview as WorkflowPreviewResponse;

	if (Array.isArray(response.stages)) {
		return response.stages;
	}

	if (Array.isArray(response.workflow?.stages)) {
		return response.workflow.stages;
	}

	return [];
};

const EDITABLE_STATUSES: readonly VendorOnboardingStatus[] = [
	"DRAFT",
	"VENDOR_SUBMITTED",
	"IN_REVIEW",
];

const getFileNameFromUrl = (
	fileUrl: string,
	documentType: VendorDocumentType,
): string => {
	try {
		const fileName = new URL(fileUrl).pathname.split("/").pop();
		return fileName || documentType;
	} catch {
		return fileUrl.split("/").pop() || documentType;
	}
};

const getFileExtension = (fileName: string): string =>
	fileName.split(".").pop()?.toLowerCase() ?? "";

const getMimeType = (fileName: string): string => {
	const mimeTypes: Record<string, string> = {
		pdf: "application/pdf",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
		doc: "application/msword",
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	};

	return mimeTypes[getFileExtension(fileName)] ?? "";
};

const createInitialEnclosureUploads = (
	initialDocuments: VendorOnboardingDocument[] = [],
): VendorEnclosureUploadItem[] =>
	VENDOR_DOCUMENT_FIELDS.map((field) => {
		const document = initialDocuments.find(
			(item) => item.documentType === field.documentType,
		);

		if (!document) {
			return {
				statusKey: field.statusKey,
				documentType: field.documentType,
				value: null,
			};
		}

		const fileName =
			document.fileName ||
			getFileNameFromUrl(document.fileUrl, document.documentType);

		return {
			statusKey: field.statusKey,
			documentType: field.documentType,
			value: {
				id: document.id,
				file: null,
				url: document.fileUrl,
				name: fileName,
				type: document.mimeType || getMimeType(fileName),
				size: document.size ?? 0,
				extension: getFileExtension(fileName),
				sizeLabel: document.size
					? `${(document.size / 1024).toFixed(1)} KB`
					: "",
				isLocal: false,
			},
		};
	});

type UseVendorCreationFormOneControllerParams = {
	values: VendorCreationFormOneValues;
	initialDocuments: VendorOnboardingDocument[];
	requireDocuments: boolean;
	requireDpdpConsent: boolean;
	onChange?: <K extends keyof VendorCreationFormOneValues>(
		key: K,
		value: VendorCreationFormOneValues[K],
	) => void;
	onNext?: () => void;
	onSubmit?: (
		submission: VendorCreationFormOneSubmission,
	) => void | Promise<void>;
};

export function useVendorCreationFormOneController({
	values,
	initialDocuments,
	requireDocuments,
	requireDpdpConsent,
	onChange,
	onNext,
	onSubmit,
}: UseVendorCreationFormOneControllerParams) {
	const [enclosureUploads, setEnclosureUploads] = React.useState<
		VendorEnclosureUploadItem[]
	>(() => createInitialEnclosureUploads(initialDocuments));
	const [enclosureErrors, setEnclosureErrors] = React.useState<
		Partial<Record<VendorEnclosureStatusKey, string>>
	>({});
	const [isDpdpModalOpen, setIsDpdpModalOpen] = React.useState(false);
	const [hasAcceptedDpdp, setHasAcceptedDpdp] = React.useState(false);
	const [hasConfirmedDpdp, setHasConfirmedDpdp] = React.useState(false);
	const [dpdpError, setDpdpError] = React.useState("");

	const documentsKey = React.useMemo(
		() =>
			initialDocuments
				.map(
					(document) =>
						`${document.id}:${document.documentType}:${document.fileUrl}`,
				)
				.sort()
				.join("|"),
		[initialDocuments],
	);
	const syncedDocumentsKeyRef = React.useRef("");

	React.useEffect(() => {
		if (syncedDocumentsKeyRef.current === documentsKey) return;
		syncedDocumentsKeyRef.current = documentsKey;

		const syncDocuments = window.setTimeout(() => {
			setEnclosureUploads(createInitialEnclosureUploads(initialDocuments));
		}, 0);

		return () => window.clearTimeout(syncDocuments);
	}, [documentsKey, initialDocuments]);

	const getEnclosureFile = React.useCallback(
		(documentType: VendorDocumentType): FileUploadValue | null =>
			enclosureUploads.find((upload) => upload.documentType === documentType)
				?.value ?? null,
		[enclosureUploads],
	);

	const isEnclosureRequired = React.useCallback(
		(field: VendorDocumentField): boolean => {
			if (!requireDocuments) return false;

			switch (field.statusKey) {
				case "msmeCertificate":
					return values.msmeVendor === "Yes";

				case "ndaCertificate":
					return values.ndaObtained === "Yes";

				case "otherAttachment":
					return false;

				default:
					return field.required;
			}
		},
		[requireDocuments, values.msmeVendor, values.ndaObtained],
	);

	const handleEnclosureChange = React.useCallback(
		(field: VendorDocumentField, nextValue: FileUploadValue | null) => {
			setEnclosureUploads((current) =>
				current.map((upload) =>
					upload.documentType === field.documentType
						? { ...upload, value: nextValue }
						: upload,
				),
			);
			setEnclosureErrors((current) => {
				const next = { ...current };
				if (!nextValue && isEnclosureRequired(field)) {
					next[field.statusKey] = `${field.label} is required.`;
				} else {
					delete next[field.statusKey];
				}
				return next;
			});

			if (field.statusKey === "msmeCertificate") {
				onChange?.("msmeCertificateAttached", nextValue ? "Yes" : "No");
			}
		},
		[isEnclosureRequired, onChange],
	);

	const handleConditionalFieldChange = React.useCallback(
		(key: "msmeVendor" | "ndaObtained", value: string) => {
			onChange?.(key, value);

			setEnclosureErrors((current) => {
				const next = { ...current };

				if (key === "msmeVendor" && value !== "Yes") {
					delete next.msmeCertificate;
				}

				if (key === "ndaObtained" && value !== "Yes") {
					delete next.ndaCertificate;
				}

				return next;
			});
		},
		[onChange],
	);

	const validateEnclosures = React.useCallback((): boolean => {
		if (!requireDocuments) {
			setEnclosureErrors({});
			return true;
		}

		const nextErrors: Partial<Record<VendorEnclosureStatusKey, string>> = {};
		VENDOR_DOCUMENT_FIELDS.forEach((field) => {
			if (!isEnclosureRequired(field)) return;
			const upload = enclosureUploads.find(
				(item) => item.documentType === field.documentType,
			);
			if (!upload?.value?.file && !upload?.value?.url) {
				nextErrors[field.statusKey] = `${field.label} is required.`;
			}
		});
		setEnclosureErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	}, [enclosureUploads, isEnclosureRequired, requireDocuments]);

	const openDpdpModal = React.useCallback(() => {
		setHasConfirmedDpdp(hasAcceptedDpdp);
		setDpdpError("");
		setIsDpdpModalOpen(true);
	}, [hasAcceptedDpdp]);

	const closeDpdpModal = React.useCallback(() => {
		setIsDpdpModalOpen(false);
		setHasConfirmedDpdp(false);
	}, []);

	const handleDpdpConsentChange = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			if (event.target.checked) {
				openDpdpModal();
				return;
			}
			setHasAcceptedDpdp(false);
			setHasConfirmedDpdp(false);
			setDpdpError("");
		},
		[openDpdpModal],
	);

	const handleAcceptDpdpTerms = React.useCallback(() => {
		if (!hasConfirmedDpdp) return;
		setHasAcceptedDpdp(true);
		setDpdpError("");
		setIsDpdpModalOpen(false);
	}, [hasConfirmedDpdp]);

	const handleReset = React.useCallback(() => {
		syncedDocumentsKeyRef.current = documentsKey;
		setEnclosureUploads(createInitialEnclosureUploads(initialDocuments));
		setEnclosureErrors({});
		setHasAcceptedDpdp(false);
		setHasConfirmedDpdp(false);
		setDpdpError("");
	}, [documentsKey, initialDocuments]);

	const handleFormAction = React.useCallback(() => {
		if (!validateEnclosures()) return;
		if (requireDpdpConsent && !hasAcceptedDpdp) {
			setDpdpError(
				"Please review and accept the Data Privacy Notice before continuing.",
			);
			setIsDpdpModalOpen(true);
			return;
		}
		if (onSubmit) {
			void onSubmit({ dpdpConsent: true, enclosureUploads });
			return;
		}
		onNext?.();
	}, [
		enclosureUploads,
		hasAcceptedDpdp,
		onNext,
		onSubmit,
		requireDpdpConsent,
		validateEnclosures,
	]);

	return {
		enclosureErrors,
		isDpdpModalOpen,
		hasAcceptedDpdp,
		hasConfirmedDpdp,
		dpdpError,
		getEnclosureFile,
		isEnclosureRequired,
		handleEnclosureChange,
		handleConditionalFieldChange,
		openDpdpModal,
		closeDpdpModal,
		handleDpdpConsentChange,
		handleAcceptDpdpTerms,
		handleReset,
		handleFormAction,
		setHasConfirmedDpdp,
	};
}

type UseVendorCreationSummaryControllerParams = {
	workflowStages: readonly ApprovalStageLike[];
	onApprove?: () => void;
	onClarify?: () => void;
	onSaveVendorCode?: () => void | Promise<boolean>;
};

export function useVendorCreationSummaryController({
	workflowStages,
	onApprove,
	onClarify,
	onSaveVendorCode,
}: UseVendorCreationSummaryControllerParams) {
	const { user } = useAuth();
	const { showToast } = useToast();
	const [reasonModal, setReasonModal] = React.useState<{
		mode: ReasonActionMode | null;
		loading: boolean;
	}>({ mode: null, loading: false });

	const currentStage = React.useMemo(
		() => getCurrentApprovalStage(workflowStages),
		[workflowStages],
	);
	const isUserInCurrentStage = React.useMemo(
		() => getIsUserInCurrentStage(workflowStages, user?.id),
		[workflowStages, user?.id],
	);

	const openReasonModal = React.useCallback(() => {
		setReasonModal({ mode: "clarify-workflow", loading: false });
	}, []);
	const closeReasonModal = React.useCallback(() => {
		setReasonModal({ mode: null, loading: false });
	}, []);

	const currentStageId = currentStage?.id;

	const handleApprove = React.useCallback(async () => {
		if (!currentStageId) return;
		try {
			const { message } = await workflowApi.approveStage(currentStageId);
			showToast({ type: "success", title: "Success", description: message });
			onApprove?.();
		} catch (error) {
			showToast({
				type: "error",
				title: "Error",
				description:
					error instanceof Error ? error.message : "Error while approving.",
			});
		}
	}, [currentStageId, onApprove, showToast]);

	const handleReasonConfirm = React.useCallback(
		async (reason: string) => {
			if (!currentStageId) {
				showToast({
					type: "error",
					title: "Not allowed",
					description: "No active approval stage found.",
				});
				return;
			}

			try {
				setReasonModal((current) => ({ ...current, loading: true }));
				const { message } = await workflowApi.clarifyStage(
					currentStageId,
					reason,
				);
				showToast({ type: "success", title: "Success", description: message });
				closeReasonModal();
				onClarify?.();
			} catch (error) {
				showToast({
					type: "error",
					title: "Error",
					description:
						error instanceof Error
							? error.message
							: "Unable to complete this action.",
				});
			} finally {
				setReasonModal((current) => ({ ...current, loading: false }));
			}
		},
		[closeReasonModal, currentStageId, onClarify, showToast],
	);

	const handleVendorCodeSave = React.useCallback(() => {
		if (onSaveVendorCode) void onSaveVendorCode();
	}, [onSaveVendorCode]);

	return {
		reasonModal,
		currentStage,
		canActOnCurrentStage: Boolean(currentStage && isUserInCurrentStage),
		openReasonModal,
		closeReasonModal,
		handleApprove,
		handleReasonConfirm,
		handleVendorCodeSave,
	};
}

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
	const { workspaceId, user } = useAuth();

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

	const [previewWorkflowStages, setPreviewWorkflowStages] = React.useState<
		ApprovalStageLike[]
	>([]);

	const [isAssigningWorkflow, setIsAssigningWorkflow] = React.useState(false);
	const [isPreviewingWorkflow, setIsPreviewingWorkflow] = React.useState(false);
	const [workflowPreviewError, setWorkflowPreviewError] = React.useState("");

	const [isSavingVendorCode, setIsSavingVendorCode] = React.useState(false);

	const vendorRequestId = routeVendorId || createdVendorId;

	const isInternal = !isPublicForm && role === "THCM_EMPLOYEE";
	const isPublicVendor = isPublicForm && role === "EXTERNAL_VENDOR";
	const isThcmProposer = role === "THCM_EMPLOYEE";
	const isTcsApprover = role === "EXTERNAL_APPROVER";

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
	const submitClarifiedMutation = useSubmitClarifiedUpdatedFormMutation();

	const status = detailQuery.data?.status;
	const activeWorkflow = detailQuery.data?.activeWorkflow ?? null;
	const workflowId = activeWorkflow?.id ?? null;

	const assignedWorkflowStages = React.useMemo<ApprovalStageLike[]>(
		() => activeWorkflow?.stages ?? [],
		[activeWorkflow?.stages],
	);

	const hasPendingClarifiedApproval = React.useMemo(() => {
		if (!activeWorkflow || activeWorkflow.iteration <= 1) {
			return false;
		}

		return assignedWorkflowStages.some((stage) => {
			const hasPendingApproval = stage.approvals?.some(
				(approval) => approval.status?.toUpperCase() === "PENDING",
			);

			return stage.isCurrentIteration === true && hasPendingApproval;
		});
	}, [activeWorkflow, assignedWorkflowStages]);

	type ActiveApprovalWithApprover = {
		status?: string | null;
		approver?: {
			id?: string | null;
			email?: string | null;
			isExternalApprover?: boolean;
		} | null;
	};

	const currentWorkflowStageOrder = activeWorkflow?.currentStage;

	const currentStage = assignedWorkflowStages.find(
		(stage) =>
			stage.isCurrentIteration === true &&
			stage.stageOrder === currentWorkflowStageOrder &&
			stage.status?.toUpperCase() === "IN_PROGRESS",
	);

	const currentUserId = String(user?.id ?? "").trim();
	const currentUserEmail = String(user?.email ?? "")
		.trim()
		.toLowerCase();

	const isCurrentStageApprover = Boolean(
		currentStage?.approvals?.some((approval) => {
			const currentApproval = approval as ActiveApprovalWithApprover;

			if (currentApproval.status?.toUpperCase() !== "PENDING") {
				return false;
			}

			const approverId = String(currentApproval.approver?.id ?? "").trim();

			const approverEmail = String(currentApproval.approver?.email ?? "")
				.trim()
				.toLowerCase();

			const matchesById =
				Boolean(currentUserId) &&
				Boolean(approverId) &&
				currentUserId === approverId;

			const matchesByEmail =
				Boolean(currentUserEmail) &&
				Boolean(approverEmail) &&
				currentUserEmail === approverEmail;

			return matchesById || matchesByEmail;
		}),
	);

	const canApprove =
		activeWorkflow?.isActive === true &&
		activeWorkflow.status?.toUpperCase() === "IN_PROGRESS" &&
		isCurrentStageApprover;

	const canClarify = canApprove;

	const hasAssignedWorkflow = Boolean(
		activeWorkflow?.isActive && assignedWorkflowStages.length > 0,
	);

	const workflowStages = React.useMemo<ApprovalStageLike[]>(() => {
		if (currentStep === 3 && previewWorkflowStages.length > 0) {
			return previewWorkflowStages;
		}

		return assignedWorkflowStages;
	}, [assignedWorkflowStages, currentStep, previewWorkflowStages]);

	const isResubmission = hasPendingClarifiedApproval;

	const canEditMainForm =
		isThcmProposer && Boolean(status && EDITABLE_STATUSES.includes(status));

	const canEditVendorCode = !isPublicForm && (isThcmProposer || isTcsApprover);

	const normalizedVendorCode = formTwoValues.vendorCode?.trim() ?? "";

	const savedVendorCode = detailQuery.data?.partTwo?.vendorCode?.trim() ?? "";

	const isVendorCodeDirty =
		Boolean(detailQuery.data) && normalizedVendorCode !== savedVendorCode;

	const canSaveVendorCode =
		canEditVendorCode &&
		Boolean(normalizedVendorCode) &&
		isVendorCodeDirty &&
		!isSavingVendorCode;

	/*
	|--------------------------------------------------------------------------
	| Initialize public vendor form
	|--------------------------------------------------------------------------
	*/

	const publicInitKeyRef = React.useRef("");

	React.useEffect(() => {
		const data = publicQuery.data;

		if (!isPublicForm || !data) {
			return;
		}

		const key = `${normalizedToken}:${publicQuery.dataUpdatedAt}`;

		if (publicInitKeyRef.current === key) {
			return;
		}

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

	/*
	|--------------------------------------------------------------------------
	| Initialize internal vendor form
	|--------------------------------------------------------------------------
	*/

	const detailInitKeyRef = React.useRef("");

	React.useEffect(() => {
		const data = detailQuery.data;

		if (isPublicForm || !data) {
			return;
		}

		const key = `${vendorRequestId}:${detailQuery.dataUpdatedAt}`;

		if (detailInitKeyRef.current === key) {
			return;
		}

		detailInitKeyRef.current = key;

		setFormOneValues(data.partOne ?? {});
		setFormTwoValues(data.partTwo ?? {});
	}, [
		detailQuery.data,
		detailQuery.dataUpdatedAt,
		isPublicForm,
		vendorRequestId,
	]);

	/*
	|--------------------------------------------------------------------------
	| Step navigation
	|--------------------------------------------------------------------------
	*/

	const next = React.useCallback(() => {
		setCurrentStep((step) => Math.min(step + 1, vendorOnboardingSteps.length));
	}, []);

	const back = React.useCallback(() => {
		setCurrentStep((step) => Math.max(step - 1, 1));
	}, []);

	/*
	|--------------------------------------------------------------------------
	| Form changes
	|--------------------------------------------------------------------------
	*/

	const changeFormOne = React.useCallback(
		<K extends keyof VendorCreationFormOneValues>(
			field: K,
			value: VendorCreationFormOneValues[K],
		) => {
			setFormOneValues((current) => {
				const nextValues = {
					...current,
					[field]: value,
				};

				const accountNumber = nextValues.accountNumber?.trim() ?? "";

				const confirmAccountNumber =
					nextValues.confirmAccountNumber?.trim() ?? "";

				setFormOneErrors((currentErrors) => {
					const nextErrors = {
						...currentErrors,
						[field]:
							REQUIRED_FORM_ONE_FIELDS[field] && isEmptyFormValue(value)
								? REQUIRED_FORM_ONE_FIELDS[field]
								: undefined,
					};

					if (field === "accountNumber" || field === "confirmAccountNumber") {
						nextErrors.confirmAccountNumber = !confirmAccountNumber
							? REQUIRED_FORM_ONE_FIELDS.confirmAccountNumber
							: confirmAccountNumber !== accountNumber
								? "Account numbers do not match."
								: undefined;
					}

					return nextErrors;
				});

				return nextValues;
			});
		},
		[],
	);

	const changeFormTwo = React.useCallback(
		<K extends keyof VendorCreationFormTwoValues>(
			key: K,
			value: VendorCreationFormTwoValues[K],
		) => {
			setFormTwoValues((current) => ({
				...current,
				[key]: value,
			}));

			setFormTwoErrors((current) => ({
				...current,
				[key]: "",
			}));
		},
		[],
	);

	/*
	|--------------------------------------------------------------------------
	| Save Form One
	|--------------------------------------------------------------------------
	*/

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

	/*
	|--------------------------------------------------------------------------
	| Assign workflow
	|--------------------------------------------------------------------------
	*/

	const assignVendorWorkflow = React.useCallback(async (): Promise<void> => {
		if (!workspaceId || !appId || !vendorRequestId) {
			throw new Error(
				"Workspace, application, or vendor request information is missing.",
			);
		}

		if (hasAssignedWorkflow) {
			return;
		}

		await vendorOnboardingApi.assignWorkflow({
			workspaceId,
			appId,
			subjectType: "VENDOR_ONBOARDING",
			subjectId: vendorRequestId,
			criteria: {},
		});
	}, [appId, hasAssignedWorkflow, vendorRequestId, workspaceId]);

	const saveThcmDetails = async () => {
		if (!vendorRequestId) {
			return;
		}

		try {
			setIsAssigningWorkflow(true);

			await updateMutation.mutateAsync({
				vendorRequestId,
				payload: buildVendorOnboardingUpdatePayload(
					formOneValues,
					formTwoValues,
				),
			});

			setPreviewWorkflowStages([]);
			setWorkflowPreviewError("");

			next();
		} catch (error) {
			showToast({
				type: "error",
				title: "Unable to continue",
				description: getErrorMessage(error, "Failed to save THCM details."),
			});
		} finally {
			setIsAssigningWorkflow(false);
		}
	};

	/*
	|--------------------------------------------------------------------------
	| Public vendor submission
	|--------------------------------------------------------------------------
	*/

	const submitPublicVendor = async (
		submission?: VendorCreationFormOneSubmission,
	) => {
		if (!submission || !normalizedToken) {
			return;
		}

		const missing = getMissingDocuments(submission);

		if (!submission.dpdpConsent || missing.length > 0) {
			showToast({
				type: "error",
				title: "Required information missing",
				description:
					missing.length > 0
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

	/*
	|--------------------------------------------------------------------------
	| Workflow preview
	|--------------------------------------------------------------------------
	*/

	const handlePreviewWorkflow =
		React.useCallback(async (): Promise<boolean> => {
			if (!workspaceId || !appId) {
				setWorkflowPreviewError(
					"Workspace or application information is missing.",
				);

				return false;
			}

			try {
				setIsPreviewingWorkflow(true);
				setWorkflowPreviewError("");

				const preview = await vendorOnboardingApi.previewWorkflow({
					workspaceId,
					appId,
					subjectType: "VENDOR_ONBOARDING",
					criteria: {},
				});

				const stages = getPreviewStages(preview);

				setPreviewWorkflowStages(stages);

				if (stages.length === 0) {
					setWorkflowPreviewError(
						"No approval workflow matches this vendor onboarding request.",
					);

					return false;
				}

				return true;
			} catch (error) {
				setPreviewWorkflowStages([]);

				setWorkflowPreviewError(
					getErrorMessage(error, "Unable to preview the approval workflow."),
				);

				return false;
			} finally {
				setIsPreviewingWorkflow(false);
			}
		}, [appId, workspaceId]);

	const workflowPreviewStartedRef = React.useRef(false);

	React.useEffect(() => {
		if (currentStep !== 3) {
			workflowPreviewStartedRef.current = false;
			return;
		}

		if (
			isPublicForm ||
			previewWorkflowStages.length > 0 ||
			workflowPreviewStartedRef.current
		) {
			return;
		}

		workflowPreviewStartedRef.current = true;

		void handlePreviewWorkflow();
	}, [
		currentStep,
		handlePreviewWorkflow,
		isPublicForm,
		previewWorkflowStages.length,
	]);

	/*
	|--------------------------------------------------------------------------
	| Summary submission
	|--------------------------------------------------------------------------
	*/

	const submitForApproval = React.useCallback(async () => {
		if (!vendorRequestId) {
			showToast({
				type: "error",
				title: "Submission failed",
				description: "Vendor onboarding ID is missing.",
			});

			return;
		}

		if (previewWorkflowStages.length === 0) {
			showToast({
				type: "error",
				title: "Workflow preview required",
				description:
					"The approval workflow preview is unavailable. Return to Form Two and open the Summary again.",
			});

			return;
		}

		const shouldActivateClarifiedWorkflow = hasPendingClarifiedApproval;

		if (shouldActivateClarifiedWorkflow && !workflowId) {
			showToast({
				type: "error",
				title: "Workflow unavailable",
				description:
					"A pending clarified approval was found, but its workflow ID is missing.",
			});

			return;
		}

		try {
			// 1. Save the updated form.
			await updateMutation.mutateAsync({
				vendorRequestId,
				payload: buildVendorOnboardingUpdatePayload(
					formOneValues,
					formTwoValues,
				),
			});

			// 2. A normal submission gets a workflow only at final submit.
			// Clarified resubmissions reuse their existing workflow iteration.
			if (!shouldActivateClarifiedWorkflow) {
				await assignVendorWorkflow();
			}

			// 3. Submit the form for approval.
			await submitMutation.mutateAsync(vendorRequestId);

			// 4. Activate the first stage of the clarified workflow iteration.
			if (shouldActivateClarifiedWorkflow && workflowId) {
				await submitClarifiedMutation.mutateAsync(workflowId);
			}

			await detailQuery.refetch();

			showToast({
				type: "success",
				title: shouldActivateClarifiedWorkflow
					? "Resubmitted successfully"
					: "Submitted successfully",
				description: shouldActivateClarifiedWorkflow
					? "The updated form was submitted and the first approval stage was activated."
					: "The vendor onboarding request was submitted for approval.",
			});

			if (onSuccess) {
				await onSuccess();
			} else {
				navigate("/vendor/onboarding/listing?tab=onboarding");
			}
		} catch (error: unknown) {
			console.error("Vendor onboarding submission failed:", error);

			showToast({
				type: "error",
				title: shouldActivateClarifiedWorkflow
					? "Resubmission failed"
					: "Submission failed",
				description: getErrorMessage(
					error,
					shouldActivateClarifiedWorkflow
						? "The form could not be resubmitted or its first approval stage could not be activated."
						: "Unable to submit the vendor onboarding request.",
				),
			});
		}
	}, [
		detailQuery,
		assignVendorWorkflow,
		formOneValues,
		formTwoValues,
		hasPendingClarifiedApproval,
		navigate,
		onSuccess,
		previewWorkflowStages.length,
		showToast,
		submitClarifiedMutation,
		submitMutation,
		updateMutation,
		vendorRequestId,
		workflowId,
	]);

	/*
	|--------------------------------------------------------------------------
	| Vendor code update
	|--------------------------------------------------------------------------
	*/

	const saveVendorCode = React.useCallback(async (): Promise<boolean> => {
		// if (!workspaceId || !appId || !vendorRequestId) {
		// 	showToast({
		// 		type: "error",
		// 		title: "Permission denied",
		// 		description: "Workspace Id is not provided.",
		// 	});
		// }

		if (!canEditVendorCode) {
			showToast({
				type: "error",
				title: "Permission denied",
				description:
					"You are not allowed to update the Vendor Code at this workflow stage.",
			});

			return false;
		}

		const vendorCode = formTwoValues.vendorCode?.trim() ?? "";

		if (!vendorCode) {
			setFormTwoErrors((current) => ({
				...current,
				vendorCode: "Vendor Code is required.",
			}));

			return false;
		}

		if (!isVendorCodeDirty) {
			return true;
		}

		try {
			setIsSavingVendorCode(true);

			await updateMutation.mutateAsync({
				vendorRequestId,
				payload: {
					vendorCode,
				},
			});

			setFormTwoValues((current) => ({
				...current,
				vendorCode,
			}));

			setFormTwoErrors((current) => ({
				...current,
				vendorCode: "",
			}));

			await detailQuery.refetch();

			showToast({
				type: "success",
				title: "Vendor code updated",
				description: "The Vendor Code was updated successfully.",
			});

			return true;
		} catch (error) {
			const responseStatus = (
				error as {
					response?: {
						status?: number;
					};
				}
			).response?.status;

			if (responseStatus === 401) {
				showToast({
					type: "error",
					title: "Authentication error",
					description:
						"The server rejected your authentication token. Please check the request authorization header.",
				});

				return false;
			}

			if (responseStatus === 403) {
				showToast({
					type: "error",
					title: "Permission denied",
					description:
						"The server does not allow this approver to update the Vendor Code.",
				});

				return false;
			}

			showToast({
				type: "error",
				title: "Unable to update vendor code",
				description: getErrorMessage(
					error,
					"Failed to update the Vendor Code.",
				),
			});

			return false;
		} finally {
			setIsSavingVendorCode(false);
		}
	}, [
		canEditVendorCode,
		detailQuery,
		formTwoValues.vendorCode,
		isVendorCodeDirty,
		showToast,
		updateMutation,
		vendorRequestId,
	]);

	/*
	|--------------------------------------------------------------------------
	| Close onboarding
	|--------------------------------------------------------------------------
	*/

	const acceptAndClose = async () => {
		if (!vendorRequestId) {
			return;
		}

		try {
			await closeMutation.mutateAsync(vendorRequestId);

			showToast({
				type: "success",
				title: "Vendor onboarding closed",
				description: "The vendor onboarding request was closed successfully.",
			});

			navigate("/vendor/onboarding/listing?tab=onboarding");
		} catch (error) {
			showToast({
				type: "error",
				title: "Unable to close onboarding",
				description: getErrorMessage(
					error,
					"Failed to close the vendor onboarding request.",
				),
			});
		}
	};

	const mutationLoading =
		createMutation.isPending ||
		updateMutation.isPending ||
		submitMutation.isPending ||
		closeMutation.isPending ||
		publicSubmitMutation.isPending ||
		submitClarifiedMutation.isPending ||
		isAssigningWorkflow;

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
		user,
		status,

		canEditFormOne: isThcmProposer || canEditMainForm,
		canEditFormTwo: canEditMainForm,
		canEditMainForm,

		canEditVendorCode,
		canSaveVendorCode,
		isVendorCodeDirty,
		vendorCodeLoading: isSavingVendorCode,

		canSubmitVendorForm: isPublicVendor,
		canSubmit: isInternal,
		canApprove,
		canClarify,
		canSendBackToVendor: isThcmProposer,
		canAcceptAndClose: role === "EXTERNAL_APPROVER",

		isLoading: isPublicForm ? publicQuery.isLoading : detailQuery.isLoading,

		isError: isPublicForm ? publicQuery.isError : detailQuery.isError,

		publicSessionError: publicQuery.error,

		mutationLoading,
		isResubmission,

		handleNext: next,
		handleBack: back,

		handleFormOneChange: changeFormOne,
		handleFormTwoChange: changeFormTwo,

		handleSaveFormOne: saveVendorDetails,
		handleSaveFormTwo: saveThcmDetails,

		handleVendorSubmitForm: submitPublicVendor,
		handleSubmitSummary: submitForApproval,

		handleApprove: async () => {
			await detailQuery.refetch();
		},
		handleClarify: async () => {
			await detailQuery.refetch();
		},
		handleAcceptAndClose: acceptAndClose,

		handleSaveVendorCode: saveVendorCode,
		handlePreviewWorkflow,
		handleFetchWorkflow: handlePreviewWorkflow,

		activeWorkflow,
		workflowStages,
		assignedWorkflowStages,
		previewWorkflowStages,
		hasAssignedWorkflow,

		workflowLoading:
			isAssigningWorkflow || isPreviewingWorkflow || detailQuery.isFetching,

		workflowPreviewError,

		creator: detailQuery.data,
	};
}

export type VendorCreationFormController = ReturnType<
	typeof useVendorCreationForm
>;

const VendorCreationFormContext =
	React.createContext<VendorCreationFormController | null>(null);

export function VendorCreationFormProvider({
	value,
	children,
}: {
	value: VendorCreationFormController;
	children: ReactNode;
}) {
	return React.createElement(
		VendorCreationFormContext.Provider,
		{ value },
		children,
	);
}

export function useVendorCreationFormContext(): VendorCreationFormController {
	const value = React.useContext(VendorCreationFormContext);
	if (!value) {
		throw new Error(
			"useVendorCreationFormContext must be used inside VendorCreationFormProvider.",
		);
	}
	return value;
}

export function useOptionalVendorCreationFormContext() {
	return React.useContext(VendorCreationFormContext);
}
