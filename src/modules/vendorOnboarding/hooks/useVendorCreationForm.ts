import React, { type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import type { ReasonActionMode } from "../../../components/ui/ReasonActionModal";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { workflowApi } from "../../workflows/api/workflow.api";
import { getStoredAppId } from "../../marketing/activity-planner/helpers/localstorage";
import { vendorOnboardingApi } from "../api/vendorOnboarding.api";
import type {
	PendingWorkflowSelection,
	WorkflowStage,
} from "../../workflows/types/types";

import { getErrorMessage, toYesNo } from "../helpers/vendor.onboarding.helper";
import {
	buildPublicFormData,
	buildVendorOnboardingUpdatePayload,
	getCreatedById,
	getCreatedWorkflowId,
	mapStageEditsForApi,
	normalizePublicFormOneValues,
	createInitialEnclosureUploads,
	getDocumentCaption,
	type VendorCreationFormOneDraftSubmission,
	type VendorCreationFormOneSubmission,
	type VendorEnclosureUploadItem,
} from "../helpers/vendor.onboarding.mapper";
import {
	EDITABLE_STATUSES,
	MANDATORY_ERROR,
	extractPanFromGstin,
	getMissingDocuments,
	normalizeAccountNumber,
	normalizeMandatoryErrors,
	validateConfirmAccountNumber,
	validateFormOneField,
	validateFormOneForSubmit,
	validateMandatoryValues,
	validatePanForForm,
} from "../helpers/vendor.onboarding.validations";
import {
	useAcceptAndCloseVendorMutation,
	useDraftSubmitPublicVendorFormMutation,
	usePublicVendorSessionQuery,
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
} from "../types/vendorOnboarding.types";
import { VENDOR_DOCUMENT_FIELDS } from "../types/vendorOnboarding.types";
import {
	getWorkflowApproverData,
	type ApprovalStageLike,
} from "../../workflows/utils/approvalWorkflow.helpers";
import {
	useActivateFirstStageMutation,
	useApproveWorkflowStageMutation,
	useAssignWorkflowMutation,
	useClarifyWorkflowStageMutation,
} from "../../workflows/context/useWorkflowMutations";
import type { MentionableUserInput } from "../../../components/ui/comments";

export const vendorOnboardingSteps = [
	{ id: 1, label: "Vendor filled details" },
	{ id: 2, label: "THCM details" },
	{ id: 3, label: "Workflow" },
	{ id: 4, label: "Review & Submit" },
];

const EMPTY_FORM_ONE: VendorCreationFormOneValues = {};
const EMPTY_FORM_TWO: VendorCreationFormTwoValues = {};

export type {
	VendorEnclosureUploadItem,
	VendorCreationFormOneSubmission,
	VendorCreationFormOneDraftSubmission,
};

type UseVendorCreationFormParams = {
	vendorRequestId?: string;
	token?: string;
	isPublicForm?: boolean;
	onSuccess?: () => void | Promise<void>;
};

type UseVendorCreationFormOneControllerParams = {
	values: VendorCreationFormOneValues;
	initialDocuments: VendorOnboardingDocument[];
	requireDocuments: boolean;
	requireDpdpConsent: boolean;
	onChange?: <K extends keyof VendorCreationFormOneValues>(
		key: K,
		value: VendorCreationFormOneValues[K],
	) => void;
	// Runs form-field validation (e.g. validateFormOneBeforeSubmit) and
	// returns whether it passed. Checked before enclosures/DPDP so field
	// errors are what the vendor sees first on an empty submit, not file
	// errors. Optional only for callers that don't have field-level
	// validation to run (fields are assumed valid if omitted).
	validateFields?: () => boolean;
	onNext?: () => void;
	onSubmit?: (
		submission: VendorCreationFormOneSubmission,
	) => void | Promise<void>;
	onSaveDraft?: (
		submission: VendorCreationFormOneDraftSubmission,
	) => void | Promise<void>;
};

export function useVendorCreationFormOneController({
	values,
	initialDocuments,
	requireDocuments,
	requireDpdpConsent,
	onChange,
	validateFields,
	onNext,
	onSubmit,
	onSaveDraft,
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
						`${document.id}:${document.documentType}:${document.fileUrl}:${getDocumentCaption(document)}`,
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

	const getEnclosureFiles = React.useCallback(
		(documentType: VendorDocumentType): FileUploadValue[] =>
			enclosureUploads
				.filter((upload) => upload.documentType === documentType)
				.flatMap((upload) => (upload.value ? [upload.value] : [])),
		[enclosureUploads],
	);

	const isEnclosureRequired = React.useCallback(
		(field: VendorDocumentField): boolean => {
			if (!requireDocuments) return false;

			switch (field.statusKey) {
				case "msmeCertificate":
					return toYesNo(values.msmeVendor) === "Yes";

				case "ndaCertificate":
					return toYesNo(values.ndaObtained) === "Yes";

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
					next[field.statusKey] = MANDATORY_ERROR;
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

	const handleEnclosureFilesChange = React.useCallback(
		(field: VendorDocumentField, nextValues: FileUploadValue[]) => {
			setEnclosureUploads((current) => [
				...current.filter(
					(upload) => upload.documentType !== field.documentType,
				),
				...nextValues.map((value) => ({
					statusKey: field.statusKey,
					documentType: field.documentType,
					value,
				})),
			]);

			setEnclosureErrors((current) => {
				const next = { ...current };
				if (nextValues.length === 0 && isEnclosureRequired(field)) {
					next[field.statusKey] = MANDATORY_ERROR;
				} else {
					delete next[field.statusKey];
				}
				return next;
			});
		},
		[isEnclosureRequired],
	);

	const handleConditionalFieldChange = React.useCallback(
		(key: "msmeVendor" | "ndaObtained", value: string) => {
			onChange?.(key, value);

			const conditionalDocumentType =
				key === "msmeVendor" ? "MSME_CERTIFICATE" : "NDA_CERTIFICATE";

			if (value !== "Yes") {
				setEnclosureUploads((current) =>
					current.map((upload) =>
						upload.documentType === conditionalDocumentType
							? { ...upload, value: null }
							: upload,
					),
				);

				if (key === "msmeVendor") {
					onChange?.("msmeCertificateAttached", "No");
				}
			}

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
				nextErrors[field.statusKey] = MANDATORY_ERROR;
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
		if (validateFields && !validateFields()) return;
		if (!validateEnclosures()) return;
		if (requireDpdpConsent && !hasAcceptedDpdp) {
			setDpdpError(MANDATORY_ERROR);
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
		validateFields,
	]);
	const handleSaveDraft = React.useCallback(() => {
		if (!onSaveDraft) return;

		void onSaveDraft({
			dpdpConsent: hasAcceptedDpdp,
			enclosureUploads,
		});
	}, [onSaveDraft, hasAcceptedDpdp, enclosureUploads]);

	return {
		enclosureErrors,
		isDpdpModalOpen,
		hasAcceptedDpdp,
		hasConfirmedDpdp,
		dpdpError,
		getEnclosureFile,
		getEnclosureFiles,
		isEnclosureRequired,
		handleEnclosureChange,
		handleEnclosureFilesChange,
		handleConditionalFieldChange,
		openDpdpModal,
		closeDpdpModal,
		handleDpdpConsentChange,
		handleAcceptDpdpTerms,
		handleReset,
		handleFormAction,
		handleSaveDraft,
		setHasConfirmedDpdp,
	};
}

type UseVendorCreationSummaryControllerParams = {
	workflowStages: ApprovalStageLike[];
	vendorCode?: string;
	onApprove?: () => void;
	onClarify?: () => void;
	onSaveVendorCode?: (code?: string) => void | Promise<boolean>;
	onAcceptAndClose?: () => void | Promise<void>;
};

export function useVendorCreationSummaryController({
	workflowStages,
	vendorCode,
	onApprove,
	onClarify,
	onSaveVendorCode,
	onAcceptAndClose,
}: UseVendorCreationSummaryControllerParams) {
	const { user } = useAuth();
	const { showToast } = useToast();
	const approveStageMutation = useApproveWorkflowStageMutation();
	const clarifyStageMutation = useClarifyWorkflowStageMutation();
	const [reasonModal, setReasonModal] = React.useState<{
		mode: ReasonActionMode | null;
		loading: boolean;
	}>({ mode: null, loading: false });

	const [vendorCodeModal, setVendorCodeModal] = React.useState<{
		open: boolean;
		loading: boolean;
	}>({ open: false, loading: false });

	const workflowApproverData = React.useMemo(
		() =>
			getWorkflowApproverData(
				{
					isActive: true,
					status: "IN_PROGRESS",
					stages: workflowStages,
				},
				user,
			),
		[workflowStages, user?.email, user?.id, user],
	);

	const {
		currentStage,
		canActNow,
		isCurrentStageApprover,
		isExternalApprover,
	} = workflowApproverData;

	const isFinalStage = Boolean(
		currentStage &&
		workflowStages.length > 0 &&
		workflowStages[workflowStages.length - 1]?.id === currentStage.id,
	);

	const requiresVendorCodeToApprove =
		isFinalStage && Boolean(isExternalApprover);

	const openReasonModal = React.useCallback(() => {
		setReasonModal({ mode: "clarify-workflow", loading: false });
	}, []);
	const closeReasonModal = React.useCallback(() => {
		setReasonModal({ mode: null, loading: false });
	}, []);

	const currentStageId = currentStage?.id;

	const approveCurrentStage = React.useCallback(async () => {
		if (!currentStageId) return;
		try {
			const { message } =
				await approveStageMutation.mutateAsync(currentStageId);
			showToast({ type: "success", title: "Success", description: message });
			onApprove?.();

			if (requiresVendorCodeToApprove) {
				await onAcceptAndClose?.();
			}
		} catch (error) {
			showToast({
				type: "error",
				title: "Error",
				description: getErrorMessage(error, "Error while approving."),
			});
		}
	}, [
		currentStageId,
		onAcceptAndClose,
		onApprove,
		requiresVendorCodeToApprove,
		showToast,
		approveStageMutation,
	]);
	const openVendorCodeModal = React.useCallback(() => {
		setVendorCodeModal({ open: true, loading: false });
	}, []);
	const closeVendorCodeModal = React.useCallback(() => {
		setVendorCodeModal({ open: false, loading: false });
	}, []);

	const handleApprove = React.useCallback(async () => {
		if (requiresVendorCodeToApprove && !vendorCode?.trim()) {
			openVendorCodeModal();
			return;
		}
		await approveCurrentStage();
	}, [
		approveCurrentStage,
		openVendorCodeModal,
		requiresVendorCodeToApprove,
		vendorCode,
	]);

	const handleVendorCodeModalConfirm = React.useCallback(
		async (code: string) => {
			const trimmed = code.trim();
			if (!trimmed) return;

			setVendorCodeModal({ open: true, loading: true });
			try {
				const saved = await onSaveVendorCode?.(trimmed);
				if (saved === false) {
					setVendorCodeModal({ open: true, loading: false });
					return;
				}
				setVendorCodeModal({ open: false, loading: false });
				await approveCurrentStage();
			} catch {
				setVendorCodeModal({ open: true, loading: false });
			}
		},
		[approveCurrentStage, onSaveVendorCode],
	);

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
				const { message } = await clarifyStageMutation.mutateAsync(
					currentStageId,
					reason,
				);
				showToast({ type: "success", title: "Success", description: message });
				closeReasonModal();
				await onClarify?.();
			} catch (error) {
				showToast({
					type: "error",
					title: "Error",
					description: getErrorMessage(
						error,
						"Unable to complete this action.",
					),
				});
			} finally {
				setReasonModal((current) => ({ ...current, loading: false }));
			}
		},
		[
			clarifyStageMutation,
			closeReasonModal,
			currentStageId,
			onClarify,
			showToast,
		],
	);

	const handleVendorCodeSave = React.useCallback(() => {
		if (onSaveVendorCode) void onSaveVendorCode();
	}, [onSaveVendorCode]);

	return {
		reasonModal,
		currentStage,
		canActOnCurrentStage: canActNow && Boolean(isCurrentStageApprover),
		requiresVendorCodeToApprove,
		vendorCodeModal,
		approveLoading: approveStageMutation.loading,
		openReasonModal,
		closeReasonModal,
		closeVendorCodeModal,
		handleApprove,
		handleVendorCodeModalConfirm,
		handleReasonConfirm,
		handleVendorCodeSave,
	};
}

export function useVendorCreationForm({
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

	const [formOneValuesState, setFormOneValues] =
		React.useState<VendorCreationFormOneValues | null>(null);

	const [formTwoValues, setFormTwoValues] =
		React.useState<VendorCreationFormTwoValues>(EMPTY_FORM_TWO);

	const [formOneErrors, setFormOneErrors] = React.useState<
		VendorFormErrors<VendorCreationFormOneValues>
	>({});

	const [formTwoErrors, setFormTwoErrors] = React.useState<
		VendorFormErrors<VendorCreationFormTwoValues>
	>({});

	const [pendingWorkflowSelection, setPendingWorkflowSelectionState] =
		React.useState<PendingWorkflowSelection | null>(null);

	const [isSavingVendorCode, setIsSavingVendorCode] = React.useState(false);

	const [pdfPreviewOpen, setPdfPreviewOpen] = React.useState(false);
	const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
	const [isPreparingPdf, setIsPreparingPdf] = React.useState(false);
	const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
	const [originalAccountNumber, setOriginalAccountNumber] = React.useState("");
	const submissionInFlightRef = React.useRef(false);
	const workflowPreparedRef = React.useRef(false);
	const vendorUpdateCompletedRef = React.useRef(false);
	const preparedTemplateIdRef = React.useRef<string | null>(null);

	const setPendingWorkflowSelection = React.useCallback(
		(selection: PendingWorkflowSelection | null) => {
			workflowPreparedRef.current = false;
			vendorUpdateCompletedRef.current = false;
			preparedTemplateIdRef.current = null;
			setPendingWorkflowSelectionState(selection);
		},
		[],
	);

	const vendorRequestId = routeVendorId;

	React.useEffect(() => {
		setPendingWorkflowSelection(null);
	}, [setPendingWorkflowSelection, vendorRequestId]);

	const isPublicVendor = isPublicForm;
	const isThcmEmployee = !isPublicForm;

	const detailQuery = useVendorOnboardingDetailQuery(
		vendorRequestId,
		!isPublicForm,
	);

	const publicQuery = usePublicVendorSessionQuery(
		normalizedToken,
		isPublicForm,
	);

	const publicFormInitialValues = React.useMemo(
		() =>
			publicQuery.data
				? normalizePublicFormOneValues(publicQuery.data)
				: EMPTY_FORM_ONE,
		[publicQuery.data],
	);

	const formOneValues =
		formOneValuesState ??
		(isPublicForm ? publicFormInitialValues : EMPTY_FORM_ONE);

	const updateMutation = useUpdateVendorMutation();
	const submitMutation = useSubmitVendorMutation();
	const closeMutation = useAcceptAndCloseVendorMutation();
	const publicSubmitMutation = useSubmitPublicVendorFormMutation();
	const publicDraftSubmitMutation = useDraftSubmitPublicVendorFormMutation();
	const { mutateAsync: assignWorkflow, loading: assignWorkflowLoading } =
		useAssignWorkflowMutation();
	const {
		mutateAsync: activateFirstStage,
		loading: activateFirstStageLoading,
	} = useActivateFirstStageMutation();

	const status = detailQuery.data?.status;
	const referenceNumber = detailQuery.data?.referenceNumber;
	const activeWorkflow = detailQuery.data?.activeWorkflow ?? null;
	const activeWorkflowId = activeWorkflow?.id ?? null;
	const createdById = getCreatedById(detailQuery.data?.initiatedById);
	const isThcmProposer =
		isThcmEmployee && Boolean(user?.id) && createdById === user?.id;

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

	/*
	|--------------------------------------------------------------------------
	| Stage edits — proposer may edit stages/approvers when resubmitting
	| after a clarification (never during initial submission or as an
	| approver). null = resubmit unchanged; a real array = the proposer's
	| edited stage list, sent as stageEdits to activateFirstStage.
	|--------------------------------------------------------------------------
	*/

	const [stageEdits, setStageEditsState] = React.useState<
		WorkflowStage[] | null
	>(null);

	const canEditStagesOnResubmit = isThcmProposer && hasPendingClarifiedApproval;

	React.useEffect(() => {
		setStageEditsState(null);
	}, [activeWorkflowId, activeWorkflow?.iteration]);

	const setStageEdits = React.useCallback(
		(nextStages: WorkflowStage[] | null) => {
			if (!canEditStagesOnResubmit) return;
			workflowPreparedRef.current = false;
			vendorUpdateCompletedRef.current = false;
			preparedTemplateIdRef.current = null;
			setStageEditsState(nextStages);
		},
		[canEditStagesOnResubmit],
	);

	const workflowApproverData = React.useMemo(
		() => getWorkflowApproverData(activeWorkflow, user),
		[activeWorkflow, user?.email, user?.id],
	);

	const { canActNow, isExternalApprover, isCurrentStageApprover } =
		workflowApproverData;

	type VendorUpdatePayload = Parameters<
		typeof updateMutation.mutateAsync
	>[0]["payload"] & {
		isExternalApprover?: boolean;
	};

	const handleSaveVendorUpdate = React.useCallback(
		async (payload: VendorUpdatePayload) => {
			if (!vendorRequestId) {
				throw new Error("Vendor onboarding ID is missing.");
			}

			return updateMutation.mutateAsync({
				vendorRequestId,
				payload,
			});
		},
		[updateMutation, vendorRequestId],
	);

	const isApprover = Boolean(isCurrentStageApprover);

	const isTcsApprover = isApprover && Boolean(isExternalApprover);

	const canApprove = canActNow && isApprover;

	const canClarify = canApprove;

	const hasAssignedWorkflow = Boolean(
		activeWorkflow?.isActive && assignedWorkflowStages.length > 0,
	);

	const workflowStages = React.useMemo<ApprovalStageLike[]>(() => {
		if ((currentStep === 3 || currentStep === 4) && pendingWorkflowSelection) {
			return pendingWorkflowSelection.previewStages;
		}

		return assignedWorkflowStages;
	}, [assignedWorkflowStages, currentStep, pendingWorkflowSelection]);

	const isResubmission = hasPendingClarifiedApproval;

	const canEditMainForm =
		isThcmProposer && Boolean(status && EDITABLE_STATUSES.includes(status));

	const canEditVendorCode = !isPublicForm && isExternalApprover;

	const normalizedVendorCode = formTwoValues.vendorCode?.trim() ?? "";

	const savedVendorCode = detailQuery.data?.partTwo?.vendorCode?.trim() ?? "";

	const isVendorCodeDirty =
		Boolean(detailQuery.data) && normalizedVendorCode !== savedVendorCode;

	const canSaveVendorCode =
		canEditVendorCode &&
		Boolean(normalizedVendorCode) &&
		isVendorCodeDirty &&
		!isSavingVendorCode;

	const detailInitKeyRef = React.useRef("");
	const stepInitVendorIdRef = React.useRef("");

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

		setFormOneValues(data.partOne ?? EMPTY_FORM_ONE);
		setFormTwoValues(data.partTwo ?? {});
		setOriginalAccountNumber(
			normalizeAccountNumber(data.partOne?.accountNumber),
		);

		if (stepInitVendorIdRef.current !== vendorRequestId) {
			stepInitVendorIdRef.current = vendorRequestId;
			setCurrentStep(EDITABLE_STATUSES.includes(data.status) ? 1 : 4);
		}
	}, [
		detailQuery.data,
		detailQuery.dataUpdatedAt,
		isPublicForm,
		vendorRequestId,
	]);

	const next = React.useCallback(() => {
		setCurrentStep((step) => Math.min(step + 1, vendorOnboardingSteps.length));
	}, []);

	const back = React.useCallback(() => {
		setCurrentStep((step) => Math.max(step - 1, 1));
	}, []);

	const validateFormOneBeforeSubmit = React.useCallback((): boolean => {
		const errors = normalizeMandatoryErrors(
			validateFormOneForSubmit(formOneValues, originalAccountNumber),
		);
		setFormOneErrors(errors);
		return Object.keys(errors).length === 0;
	}, [formOneValues, originalAccountNumber]);

	const validateFormTwoBeforeSubmit = React.useCallback((): boolean => {
		const errors = validateMandatoryValues(formTwoValues);
		setFormTwoErrors(errors);
		return Object.keys(errors).length === 0;
	}, [formTwoValues]);

	const changeFormOne = React.useCallback(
		<K extends keyof VendorCreationFormOneValues>(
			field: K,
			value: VendorCreationFormOneValues[K],
		) => {
			vendorUpdateCompletedRef.current = false;
			setFormOneValues((current) => {
				let nextValues = { ...(current ?? formOneValues), [field]: value };

				// Auto-fill PAN once enough of the GSTIN has been typed for its
				// embedded PAN segment to be trustworthy. The vendor can still
				// overwrite it afterwards — this only fills, never locks it.
				if (field === "gstin") {
					const derivedPan = extractPanFromGstin(String(value ?? ""));
					if (derivedPan) {
						nextValues = { ...nextValues, pan: derivedPan };
					}
				}

				setFormOneErrors((currentErrors) => {
					const nextErrors = {
						...currentErrors,
						[field]: validateFormOneField(field, value),
					};

					// Either field changing can affect confirm-required/match state.
					if (field === "accountNumber" || field === "confirmAccountNumber") {
						nextErrors.confirmAccountNumber = validateConfirmAccountNumber(
							nextValues,
							originalAccountNumber,
						);
					}

					// GSTIN and PAN are cross-validated against each other, so a
					// change to either re-checks PAN (required + format + match).
					if (field === "gstin" || field === "pan") {
						nextErrors.pan = validatePanForForm(nextValues);
					}

					return nextErrors;
				});

				return nextValues;
			});
		},
		[formOneValues, originalAccountNumber],
	);

	const changeFormTwo = React.useCallback(
		<K extends keyof VendorCreationFormTwoValues>(
			key: K,
			value: VendorCreationFormTwoValues[K],
		) => {
			vendorUpdateCompletedRef.current = false;
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

	const saveVendorDetails = async () => {
		if (!vendorRequestId) {
			showToast({
				type: "error",
				title: "Unable to continue",
				description: "Vendor onboarding ID is missing.",
			});
			return;
		}
		if (!validateFormOneBeforeSubmit()) {
			showToast({
				type: "error",
				title: "Please fix the highlighted fields",
				description: "Some vendor details are missing or invalid.",
			});
			return;
		}
		try {
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
		if (!vendorRequestId) {
			return;
		}

		if (!validateFormTwoBeforeSubmit()) {
			showToast({
				type: "error",
				title: "Please fix the highlighted fields",
				description: "All THCM details are mandatory.",
			});
			return;
		}

		// Internal step navigation does not persist. The complete payload is
		// updated once at the final submission boundary.
		next();
	};

	const submitDraftPublicVendor = async (
		submission?: VendorCreationFormOneDraftSubmission,
	) => {
		if (!submission || !normalizedToken) return;

		try {
			await publicDraftSubmitMutation.mutateAsync({
				token: normalizedToken,
				formData: buildPublicFormData(formOneValues, submission, "DRAFT"),
			});

			showToast({
				type: "success",
				title: "Draft saved",
				description: "Your vendor details were saved successfully.",
			});

			await publicQuery.refetch();
		} catch (error) {
			showToast({
				type: "error",
				title: "Unable to save draft",
				description: getErrorMessage(error, "Failed to save draft."),
			});
		}
	};

	const submitPublicVendor = async (
		submission?: VendorCreationFormOneSubmission,
	) => {
		if (!submission || !normalizedToken) {
			return;
		}
		if (!validateFormOneBeforeSubmit()) {
			showToast({
				type: "error",
				title: "Please fix the highlighted fields",
				description: "Some vendor details are missing or invalid.",
			});
			return;
		}
		const missing = getMissingDocuments(submission, formOneValues);

		if (!submission.dpdpConsent) {
			showToast({
				type: "error",
				title: "Required information missing",
				description: "Please accept the Data Privacy Notice.",
			});

			return;
		}
		if (missing.length > 0) {
			showToast({
				type: "error",
				title: "Required information missing",
				description: `Please upload: ${missing.join(", ")}`,
			});

			return;
		}

		try {
			await publicSubmitMutation.mutateAsync({
				token: normalizedToken,
				formData: buildPublicFormData(formOneValues, submission, "SUBMIT"),
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
	| Summary submission — strict order
	|--------------------------------------------------------------------------
	| 1. Validate and update the complete vendor payload exactly once.
	| 2. Assign a workflow (fresh form) or activate it (clarification).
	| 3. Send the record for approval.
	|
	| No detail refetch is needed between these operations. The status already
	| tells us whether this is the THCM user's first submission.
	|--------------------------------------------------------------------------
	*/
	const submitForApproval = React.useCallback(async () => {
		if (submissionInFlightRef.current) return;

		if (!vendorRequestId) {
			showToast({
				type: "error",
				title: "Submission failed",
				description: "Vendor onboarding ID is missing.",
			});
			return;
		}

		const isFormOneValid = validateFormOneBeforeSubmit();
		const isFormTwoValid = validateFormTwoBeforeSubmit();

		if (!isFormOneValid || !isFormTwoValid) {
			setCurrentStep(isFormOneValid ? 2 : 1);
			showToast({
				type: "error",
				title: "Please fix the highlighted fields",
				description: "All form fields are mandatory.",
			});
			return;
		}

		const isClarifiedResubmission = hasPendingClarifiedApproval;
		const hasPendingWorkflowSelection = Boolean(pendingWorkflowSelection);

		const selectedWorkflowCriteria =
			pendingWorkflowSelection?.attachInput ?? null;

		let selectedTemplateId =
			pendingWorkflowSelection?.attachInput?.workflowId ?? null;

		const shouldCreateEditedTemplate = Boolean(
			pendingWorkflowSelection?.isEditedExistingWorkflow,
		);

		const resubmitStageEdits =
			!hasPendingWorkflowSelection && stageEdits
				? mapStageEditsForApi(stageEdits)
				: undefined;

		const shouldAssignSelectedWorkflow =
			!hasAssignedWorkflow && !isClarifiedResubmission;

		const buildActivationPayload = () => {
			if (!activeWorkflowId) {
				throw new Error(
					"Active workflow ID is missing for workflow resubmission.",
				);
			}

			if (!hasPendingWorkflowSelection) {
				if (resubmitStageEdits?.length) {
					return {
						workflowId: activeWorkflowId,
						stageEdits: resubmitStageEdits,
					};
				}

				return {
					workflowId: activeWorkflowId,
				};
			}

			if (!selectedTemplateId) {
				throw new Error("Selected workflow template ID is missing.");
			}

			return {
				workflowId: activeWorkflowId,
				newTemplateId: selectedTemplateId,
			};
		};

		if (shouldAssignSelectedWorkflow && !hasPendingWorkflowSelection) {
			showToast({
				type: "error",
				title: "Workflow required",
				description:
					"Return to the Workflow step and select an approval workflow.",
			});
			return;
		}

		if (isClarifiedResubmission && !activeWorkflowId) {
			showToast({
				type: "error",
				title: "Workflow required",
				description:
					"The active workflow is unavailable. Return to the Workflow step and select a workflow.",
			});
			return;
		}

		if (shouldAssignSelectedWorkflow && (!workspaceId || !appId)) {
			showToast({
				type: "error",
				title: "Workflow assignment failed",
				description:
					"Workspace or application information is missing. Please refresh and try again.",
			});
			return;
		}

		if (
			pendingWorkflowSelection?.saveAsTemplate &&
			!pendingWorkflowSelection.templateName?.trim()
		) {
			showToast({
				type: "error",
				title: "Template name required",
				description: "Enter a name for the edited workflow template.",
			});
			return;
		}

		submissionInFlightRef.current = true;

		try {
			// The THCM form is persisted once, before any workflow operation.
			if (!vendorUpdateCompletedRef.current) {
				await handleSaveVendorUpdate(
					buildVendorOnboardingUpdatePayload(formOneValues, formTwoValues),
				);
				vendorUpdateCompletedRef.current = true;
			}

			if (shouldCreateEditedTemplate && pendingWorkflowSelection) {
				if (preparedTemplateIdRef.current) {
					selectedTemplateId = preparedTemplateIdRef.current;
				} else {
					if (!workspaceId || !appId) {
						throw new Error("Workspace or application information is missing.");
					}

					const templateName = pendingWorkflowSelection.saveAsTemplate
						? pendingWorkflowSelection.templateName?.trim()
						: `Vendor workflow - ${referenceNumber ?? vendorRequestId}`;

					if (!templateName) {
						throw new Error("A workflow template name is required.");
					}

					const created = await workflowApi.createUser({
						name: templateName,
						workspaceId,
						appId,
						isActive: true,
						isReusable: pendingWorkflowSelection.saveAsTemplate ?? false,
						description: "",
						metaData_1: "",
						metaData_2: "",
						metaData_3: "",
						stages: pendingWorkflowSelection.previewStages.map((stage) => ({
							name: stage.name.trim(),
							stageOrder: stage.stageOrder,
							strategy: stage.strategy,
							minApprovals:
								stage.strategy === "SOME"
									? Number(stage.minApprovals) || 1
									: undefined,
							approverIds: stage.approvers.map((approver) => ({
								userId: approver.user.id,
								name:
									[approver.user.firstName, approver.user.lastName]
										.filter(Boolean)
										.join(" ") ||
									approver.user.email?.trim() ||
									"Unnamed user",
								email: approver.user.email?.trim() ?? "",
								isExternalApprover: approver.isExternalApprover,
							})),
						})),
					});

					selectedTemplateId = getCreatedWorkflowId(created);
					if (!selectedTemplateId) {
						throw new Error("The edited workflow was created without an id.");
					}
					preparedTemplateIdRef.current = selectedTemplateId;
				}
			}

			if (workflowPreparedRef.current) {
				// A previous attempt prepared the workflow but failed later in the
				// chain. Do not assign/activate it a second time.
			} else if (shouldAssignSelectedWorkflow) {
				if (!workspaceId || !appId) {
					throw new Error("Workspace or application information is missing.");
				}

				await assignWorkflow({
					subjectType: "VENDOR_ONBOARDING",
					subjectId: vendorRequestId,
					workspaceId,
					appId,
					criteria: {
						...selectedWorkflowCriteria,
						workflowId: selectedTemplateId ?? undefined,
					},
				});
				workflowPreparedRef.current = true;
			} else if (isClarifiedResubmission) {
				const activationPayload = buildActivationPayload();

				await activateFirstStage(activationPayload);
				workflowPreparedRef.current = true;
			} else {
				throw new Error(
					"Workflow submission state is invalid. No workflow action was performed.",
				);
			}

			// Status advances only after the update and workflow preparation succeed.
			await submitMutation.mutateAsync(vendorRequestId);
			workflowPreparedRef.current = false;
			vendorUpdateCompletedRef.current = false;
			preparedTemplateIdRef.current = null;

			setPendingWorkflowSelection(null);
			setStageEdits(null);

			showToast({
				type: "success",
				title: isClarifiedResubmission
					? "Resubmitted successfully"
					: "Submitted successfully",
				description: isClarifiedResubmission
					? hasPendingWorkflowSelection
						? "The clarified vendor details were updated and the selected workflow was applied."
						: resubmitStageEdits?.length
							? "The clarified vendor details were updated and the current workflow's stages were changed."
							: "The clarified vendor details were updated and the active workflow was continued."
					: "The THCM details were updated and the approval workflow was assigned.",
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
				title: isClarifiedResubmission
					? "Resubmission failed"
					: "Submission failed",
				description: getErrorMessage(
					error,
					isClarifiedResubmission
						? "The clarified vendor details could not be updated."
						: "Unable to submit the vendor onboarding request.",
				),
			});
		} finally {
			submissionInFlightRef.current = false;
		}
	}, [
		activateFirstStage,
		appId,
		assignWorkflow,
		hasAssignedWorkflow,
		hasPendingClarifiedApproval,
		handleSaveVendorUpdate,
		formOneValues,
		formTwoValues,
		referenceNumber,
		navigate,
		onSuccess,
		pendingWorkflowSelection,
		showToast,
		stageEdits,
		setStageEdits,
		submitMutation,
		vendorRequestId,
		activeWorkflowId,
		workspaceId,
		setPendingWorkflowSelection,
		validateFormOneBeforeSubmit,
		validateFormTwoBeforeSubmit,
	]);

	const saveVendorCode = React.useCallback(
		async (codeOverride?: string): Promise<boolean> => {
			if (!canEditVendorCode) {
				showToast({
					type: "error",
					title: "Permission denied",
					description:
						"You are not allowed to update the Vendor Code at this workflow stage.",
				});
				return false;
			}

			const vendorCode =
				(codeOverride ?? formTwoValues.vendorCode)?.trim() ?? "";

			if (!vendorCode) {
				setFormTwoErrors((current) => ({
					...current,
					vendorCode: MANDATORY_ERROR,
				}));
				return false;
			}
			const isDirty =
				codeOverride !== undefined
					? vendorCode !== savedVendorCode
					: isVendorCodeDirty;

			if (!isDirty) {
				return true;
			}

			try {
				setIsSavingVendorCode(true);

				await handleSaveVendorUpdate({
					vendorCode,
					isExternalApprover,
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
				const responseStatus = (error as { response?: { status?: number } })
					.response?.status;

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
		},
		[
			canEditVendorCode,
			detailQuery,
			formTwoValues.vendorCode,
			handleSaveVendorUpdate,
			isExternalApprover,
			isVendorCodeDirty,
			savedVendorCode,
			showToast,
		],
	);

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

	const handleViewPdf = React.useCallback(async () => {
		if (!vendorRequestId || isPreparingPdf) return;

		setIsPreparingPdf(true);

		try {
			const url = await vendorOnboardingApi.getPdfUrl(
				"VENDOR_ONBOARDING",
				vendorRequestId,
			);

			setPdfUrl(url);
			setPdfPreviewOpen(true);
		} catch (error) {
			showToast({
				type: "error",
				title: "PDF preview failed",
				description: getErrorMessage(
					error,
					"Unable to prepare the vendor details PDF.",
				),
			});
		} finally {
			setIsPreparingPdf(false);
		}
	}, [isPreparingPdf, showToast, vendorRequestId]);

	const closePdfPreview = React.useCallback(() => {
		setPdfPreviewOpen(false);
	}, []);

	const handleDownloadPdf = React.useCallback(async () => {
		if (!vendorRequestId || isDownloadingPdf) return;

		setIsDownloadingPdf(true);

		try {
			const url =
				pdfUrl ??
				(await vendorOnboardingApi.getPdfUrl(
					"VENDOR_ONBOARDING",
					vendorRequestId,
				));

			setPdfUrl(url);

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error("Failed to download PDF.");
			}

			const pdfBlob = await response.blob();
			const blobUrl = window.URL.createObjectURL(
				new Blob([pdfBlob], { type: "application/pdf" }),
			);

			const link = document.createElement("a");

			link.href = blobUrl;
			link.download = `vendor-details-${
				referenceNumber?.trim() || vendorRequestId
			}.pdf`;

			document.body.appendChild(link);
			link.click();
			link.remove();

			window.URL.revokeObjectURL(blobUrl);
		} catch (error) {
			showToast({
				type: "error",
				title: "PDF download failed",
				description: getErrorMessage(
					error,
					"Unable to download the vendor details PDF.",
				),
			});
		} finally {
			setIsDownloadingPdf(false);
		}
	}, [isDownloadingPdf, pdfUrl, referenceNumber, showToast, vendorRequestId]);

	const creator = React.useMemo<MentionableUserInput | null>(() => {
		const detail = detailQuery.data as
			| (typeof detailQuery.data & {
					created_by?: MentionableUserInput | null;
			  })
			| undefined;
		const createdBy = detail?.created_by ?? detail?.createdBy;
		if (!createdBy?.id) {
			return null;
		}

		return {
			id: createdBy.id,
			first_name: createdBy.first_name,
			last_name: createdBy.last_name,
			email: createdBy.email,
			avatarUrl: createdBy.avatarUrl,
		};
	}, [detailQuery.data]);
	const mutationLoading =
		updateMutation.isPending ||
		submitMutation.isPending ||
		closeMutation.isPending ||
		publicSubmitMutation.isPending ||
		publicDraftSubmitMutation.isPending ||
		assignWorkflowLoading ||
		activateFirstStageLoading;

	return {
		vendorOnboardingSteps,
		currentStep,
		setCurrentStep,
		workspaceId,
		appId,

		vendorRequestId,
		formOneValues,
		formTwoValues,
		formOneErrors,
		originalAccountNumber,
		formTwoErrors,
		formOneDocuments: isPublicForm
			? (publicQuery.data?.documents ?? [])
			: (detailQuery.data?.documents ?? []),

		user,
		formStatus: status,
		referenceNumber,

		canEditFormOne: canEditMainForm,
		canEditFormTwo: canEditMainForm,
		canEditMainForm,

		canEditVendorCode,
		isThcmProposer,
		isTcsApprover,
		isExternalApprover,
		canSaveVendorCode,
		isVendorCodeDirty,
		vendorCodeLoading: isSavingVendorCode,

		canSubmitVendorForm: isPublicVendor,
		canSaveDraft: isPublicForm,
		canSubmit: canEditMainForm,
		canApprove,
		canClarify,
		canSendBackToVendor:
			isThcmProposer && detailQuery.data?.status === "IN_REVIEW",
		canAcceptAndClose:
			detailQuery.data?.status === "APPROVED" && isExternalApprover,

		isLoading: isPublicForm ? publicQuery.isLoading : detailQuery.isLoading,

		isError: isPublicForm ? publicQuery.isError : detailQuery.isError,

		publicSessionError: publicQuery.error,

		vendorDraftLoading: publicDraftSubmitMutation.isPending,

		mutationLoading,
		isResubmission,

		canEditStagesOnResubmit,
		stageEdits,
		setStageEdits,
		hasPendingClarifiedApproval,

		pdfUrl,
		pdfPreviewOpen,
		isPreparingPdf,
		isDownloadingPdf,
		handleViewPdf,
		handleDownloadPdf,
		closePdfPreview,

		handleNext: next,
		handleBack: back,

		handleFormOneChange: changeFormOne,
		handleFormTwoChange: changeFormTwo,

		handleSaveFormOne: saveVendorDetails,
		handleSaveFormOneDraft: isPublicForm ? submitDraftPublicVendor : undefined,
		handleSaveFormTwo: saveThcmDetails,
		handleSaveFormTwoDraft: undefined,

		handleVendorSubmitForm: submitPublicVendor,
		handleSubmitSummary: submitForApproval,
		handleVendorDraftSubmitForm: submitDraftPublicVendor,

		handleApprove: async () => {
			await detailQuery.refetch();
		},
		handleClarify: async () => {
			await detailQuery.refetch();
		},
		handleAcceptAndClose: acceptAndClose,

		handleSaveVendorCode: saveVendorCode,

		activeWorkflow,
		workflowApproverData,
		workflowStages,
		assignedWorkflowStages,
		pendingWorkflowSelection,
		setPendingWorkflowSelection,
		hasAssignedWorkflow,

		workflowLoading:
			assignWorkflowLoading ||
			activateFirstStageLoading ||
			detailQuery.isFetching,

		creator: creator,
		vendorDetail: detailQuery.data,
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
