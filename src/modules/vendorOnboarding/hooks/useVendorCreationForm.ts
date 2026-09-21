import React, { type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import { toYesNo } from "../helpers/vendor.onboarding.helper";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import {
	vendorContent,
	formatVendorMessage,
} from "../../../content/vendor.content";
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
	extractPanFromGstin,
	getMissingDocuments,
	normalizeAccountNumber,
} from "../helpers/vendor.onboarding.validations";
import {
	buildVendorFormOneSchema,
	type VendorFormOneValues,
} from "../schemas/vendorFormOne.schema";
import {
	vendorFormTwoSchema,
	type VendorFormTwoValues,
} from "../schemas/vendorFormTwo.schema";
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

// Label used for enclosure-upload / DPDP-consent "required" states. These
// aren't part of the Form One/Two Zod schemas (documents and consent are
// validated by useVendorCreationFormOneController, not by field-level
// validation), so they keep the exact literal the app already shows rather
// than picking up the (more descriptive) per-field Zod messages.
const MANDATORY_ERROR = "Mandatory";

// Fills every Form One field the Zod schema requires, defaulting anything
// missing from the API/detail response to "" so `reset()`/`defaultValues`
// always get a fully-shaped VendorFormOneValues instead of undefineds.
const toFormOneDefaults = (
	source: VendorCreationFormOneValues,
): VendorFormOneValues => ({
	vendorName: source.vendorName ?? "",
	vendorReferenceName: source.vendorReferenceName ?? "",
	address: source.address ?? "",
	msmeVendor: source.msmeVendor ?? "",
	msmeCertificateAttached: source.msmeCertificateAttached ?? "",
	city: source.city ?? "",
	pinCode: source.pinCode ?? "",
	state: source.state ?? "",
	mobile: source.mobile ?? "",
	email: source.email ?? "",
	bankName: source.bankName ?? "",
	bankBranch: source.bankBranch ?? "",
	ifscCode: source.ifscCode ?? "",
	bankAddress: source.bankAddress ?? "",
	accountNumber: source.accountNumber ?? "",
	confirmAccountNumber: source.confirmAccountNumber ?? "",
	gstin: source.gstin ?? "",
	pan: source.pan ?? "",
	entityRegNo: source.entityRegNo ?? "",
	gstCertificate: source.gstCertificate ?? "",
	panNumber: source.panNumber ?? "",
	bankCancelledCheque: source.bankCancelledCheque ?? "",
	certificateOfIncorporation: source.certificateOfIncorporation ?? "",
	msmeCertificate: source.msmeCertificate ?? "",
	ndaCertificate: source.ndaCertificate ?? "",
	ndaObtained: source.ndaObtained ?? "",
	referenceNumber: source.referenceNumber ?? "",
});

// Same idea for Form Two — every field required by vendorFormTwoSchema
// (everything except vendorCode) gets a "" fallback.
const toFormTwoDefaults = (
	source: VendorCreationFormTwoValues,
): VendorFormTwoValues => ({
	vendorCode: source.vendorCode ?? "",
	vendorType: source.vendorType ?? "",
	companyCode: source.companyCode ?? "",
	purchaseOrg: source.purchaseOrg ?? "",
	paymentTerm: source.paymentTerm ?? "",
	tds: source.tds ?? "",
	vendorCategory: source.vendorCategory ?? "",
	materialType: source.materialType ?? "",
	materialSubType: source.materialSubType ?? "",
	vendorSelfAssessmentObtained: source.vendorSelfAssessmentObtained ?? "",
	gpaObtained: source.gpaObtained ?? "",
	relatedPartyToThcm: source.relatedPartyToThcm ?? "",
	vendorAuditReportPrepared: source.vendorAuditReportPrepared ?? "",
	natureOfService: source.natureOfService ?? "",
	reasonForOnboarding: source.reasonForOnboarding ?? "",
});

const ADDITIONAL_DOCUMENT_FIELDS = VENDOR_DOCUMENT_FIELDS.filter((field) =>
	field.documentType.startsWith("ADDITIONAL_DOC_"),
);

const STANDARD_DOCUMENT_FIELDS = VENDOR_DOCUMENT_FIELDS.filter(
	(field) =>
		field.documentType !== "MSME_CERTIFICATE" &&
		field.documentType !== "NDA_CERTIFICATE" &&
		!field.documentType.startsWith("ADDITIONAL_DOC_"),
);

const getInitialAdditionalDocumentCount = (
	documents: VendorOnboardingDocument[],
): number =>
	Math.max(
		1,
		ADDITIONAL_DOCUMENT_FIELDS.reduce(
			(highestVisibleIndex, field, index) =>
				documents.some(
					(document) => document.documentType === field.documentType,
				)
					? index + 1
					: highestVisibleIndex,
			0,
		),
	);

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
	isReadOnly: boolean;
	onChange?: <K extends keyof VendorCreationFormOneValues>(
		key: K,
		value: VendorCreationFormOneValues[K],
	) => void;
	// Runs form-field validation (e.g. validateFormOneBeforeSubmit) and
	// returns whether it passed. Checked before enclosures/DPDP so field
	// errors are what the vendor sees first on an empty submit, not file
	// errors. Optional only for callers that don't have field-level
	// validation to run (fields are assumed valid if omitted). Async because
	// it's now backed by React Hook Form's trigger() (Zod-validated).
	validateFields?: () => boolean | Promise<boolean>;
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
	isReadOnly,
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
	const [visibleAdditionalDocumentCount, setVisibleAdditionalDocumentCount] =
		React.useState(() => getInitialAdditionalDocumentCount(initialDocuments));

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
			setVisibleAdditionalDocumentCount(
				getInitialAdditionalDocumentCount(initialDocuments),
			);
		}, 0);

		return () => window.clearTimeout(syncDocuments);
	}, [documentsKey, initialDocuments]);
	const getEnclosureFile = React.useCallback(
		(documentType: VendorDocumentType): FileUploadValue | null =>
			enclosureUploads.find((upload) => upload.documentType === documentType)
				?.value ?? null,
		[enclosureUploads],
	);

	const visibleDocumentFields = React.useMemo(
		() => [
			...STANDARD_DOCUMENT_FIELDS,
			...(isReadOnly
				? ADDITIONAL_DOCUMENT_FIELDS.filter((field) =>
						enclosureUploads.some(
							(upload) =>
								upload.documentType === field.documentType &&
								Boolean(upload.value),
						),
					)
				: ADDITIONAL_DOCUMENT_FIELDS.slice(0, visibleAdditionalDocumentCount)),
		],
		[enclosureUploads, isReadOnly, visibleAdditionalDocumentCount],
	);

	const canAddMoreDocuments =
		!isReadOnly &&
		visibleAdditionalDocumentCount < ADDITIONAL_DOCUMENT_FIELDS.length;

	const handleAddMoreDocument = React.useCallback(() => {
		setVisibleAdditionalDocumentCount((current) =>
			Math.min(current + 1, ADDITIONAL_DOCUMENT_FIELDS.length),
		);
	}, []);

	const isEnclosureRequired = React.useCallback(
		(field: VendorDocumentField): boolean => {
			if (!requireDocuments) return false;

			switch (field.statusKey) {
				case "msmeCertificate":
					return toYesNo(values.msmeVendor) === "Yes";

				case "ndaCertificate":
					return toYesNo(values.ndaObtained) === "Yes";

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

	const handleEnclosureTypeChange = React.useCallback(
		(documentType: VendorDocumentType, nextValue: FileUploadValue | null) => {
			const field = VENDOR_DOCUMENT_FIELDS.find(
				(item) => item.documentType === documentType,
			);

			if (field) {
				handleEnclosureChange(field, nextValue);
			}
		},
		[handleEnclosureChange],
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
		setVisibleAdditionalDocumentCount(
			getInitialAdditionalDocumentCount(initialDocuments),
		);
		setEnclosureErrors({});
		setHasAcceptedDpdp(false);
		setHasConfirmedDpdp(false);
		setDpdpError("");
	}, [documentsKey, initialDocuments]);

	const handleFormAction = React.useCallback(async () => {
		if (validateFields && !(await validateFields())) return;
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
		visibleDocumentFields,
		canAddMoreDocuments,
		handleAddMoreDocument,
		isEnclosureRequired,
		handleEnclosureChange,
		handleEnclosureTypeChange,
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
			showSuccessToast(
				showToast,
				message ?? vendorContent.toast.approval.successTitle,
				vendorContent.toast.approval.successTitle,
			);
			onApprove?.();

			if (requiresVendorCodeToApprove) {
				await onAcceptAndClose?.();
			}
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				vendorContent.toast.approval.errorFallback,
				vendorContent.toast.approval.errorTitle,
			);
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
					title: vendorContent.toast.clarify.missingStageTitle,
					description: vendorContent.toast.clarify.missingStageDescription,
				});
				return;
			}
			try {
				setReasonModal((current) => ({ ...current, loading: true }));
				const { message } = await clarifyStageMutation.mutateAsync(
					currentStageId,
					reason,
				);
				showSuccessToast(
					showToast,
					message ?? vendorContent.toast.clarify.successTitle,
					vendorContent.toast.clarify.successTitle,
				);
				closeReasonModal();
				await onClarify?.();
			} catch (error) {
				showApiErrorToast(
					showToast,
					error,
					vendorContent.toast.clarify.errorFallback,
					vendorContent.toast.clarify.errorTitle,
				);
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

	// ───────────────────────────────────────────────────────────────────────
	// Form One / Form Two — React Hook Form + Zod
	// ───────────────────────────────────────────────────────────────────────
	// These two useForm() instances are the single authoritative source of
	// validation for the vendor/THCM forms (see vendorFormOne.schema.ts /
	// vendorFormTwo.schema.ts) — the manual validators that used to live in
	// vendor.onboarding.validations.ts have been removed, not duplicated.
	//
	// VendorCreationFormOne/Two.tsx are NOT wired to RHF's register()/
	// Controller — they're a manual multi-step wizard driven by plain
	// values/errors/onChange props (and this hook is consumed through
	// Context by several other read-only views too). Rewiring those
	// components' every field to register()/Controller would touch a very
	// large amount of working JSX for no behavioral gain, so instead RHF
	// stays internal to this hook: it owns validation state, and this hook
	// keeps exposing the exact same formOneValues/formOneErrors/
	// handleFormOneChange/handleFormOneBlur (and formTwo equivalents) shape
	// it always has, now computed from the RHF/Zod source of truth instead
	// of the old manual validators.

	// originalAccountNumber's value at the moment a schema needs it can't
	// come from a closed-over prop (the schema factory is only created once,
	// inside the resolver below) — a ref keeps it fresh without having to
	// recreate the resolver/useForm instance on every detail refetch.
	const originalAccountNumberRef = React.useRef("");
	const [originalAccountNumber, setOriginalAccountNumberState] =
		React.useState("");

	const setOriginalAccountNumber = React.useCallback((value: string) => {
		originalAccountNumberRef.current = value;
		setOriginalAccountNumberState(value);
	}, []);

	const formOneResolver: Resolver<VendorFormOneValues> = React.useCallback(
		(values, context, options) =>
			zodResolver(buildVendorFormOneSchema(originalAccountNumberRef.current))(
				values,
				context,
				options,
			),
		[],
	);

	// mode/reValidateMode below only govern fields registered via
	// register()/Controller — Form One and Form Two are driven by explicit
	// setValue() calls from changeFormOne/changeFormTwo instead (see the
	// "shouldValidate: true" comment on each), which is what actually makes
	// validation run on every keystroke here. These are kept "onChange" too
	// so the two configuration points don't contradict each other.
	const formOneForm = useForm<VendorFormOneValues>({
		resolver: formOneResolver,
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: toFormOneDefaults(EMPTY_FORM_ONE),
	});

	const formTwoForm = useForm<VendorFormTwoValues>({
		resolver: zodResolver(vendorFormTwoSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: toFormTwoDefaults(EMPTY_FORM_TWO),
	});

	const formOneValuesWatched = useWatch({ control: formOneForm.control });
	const formTwoValues = useWatch({ control: formTwoForm.control });

	const formOneErrors = React.useMemo(
		() =>
			Object.fromEntries(
				Object.entries(formOneForm.formState.errors).map(([key, value]) => [
					key,
					value?.message,
				]),
			) as VendorFormErrors<VendorCreationFormOneValues>,
		[formOneForm.formState.errors],
	);

	const formTwoErrors = React.useMemo(
		() =>
			Object.fromEntries(
				Object.entries(formTwoForm.formState.errors).map(([key, value]) => [
					key,
					value?.message,
				]),
			) as VendorFormErrors<VendorCreationFormTwoValues>,
		[formTwoForm.formState.errors],
	);

	const [pendingWorkflowSelection, setPendingWorkflowSelectionState] =
		React.useState<PendingWorkflowSelection | null>(null);

	const [isSavingVendorCode, setIsSavingVendorCode] = React.useState(false);

	const [pdfPreviewOpen, setPdfPreviewOpen] = React.useState(false);
	const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
	const [isPreparingPdf, setIsPreparingPdf] = React.useState(false);
	const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
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

	// Mirrors the old `formOneValuesState ?? publicFormInitialValues`
	// fallback: keep syncing the public form from the fetched session while
	// the vendor hasn't touched anything yet, and stop once they have (so a
	// background refetch — e.g. after a draft save — never stomps on
	// in-progress edits). formState.isDirty is read fresh on every reset()
	// call, which is exactly the same "touched" signal the old null-vs-set
	// formOneValuesState carried.
	React.useEffect(() => {
		if (!isPublicForm) return;
		if (formOneForm.formState.isDirty) return;

		formOneForm.reset(toFormOneDefaults(publicFormInitialValues));
	}, [isPublicForm, publicFormInitialValues, formOneForm]);

	const formOneValues: VendorCreationFormOneValues = formOneValuesWatched;

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
	const vendorReferenceName = detailQuery.data?.partOne?.vendorReferenceName;
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

		// Order matters: the ref backing the schema factory must be current
		// *before* formOneForm.reset() triggers Zod validation of the
		// freshly-loaded values (reset() with a resolver re-validates).
		setOriginalAccountNumber(
			normalizeAccountNumber(data.partOne?.accountNumber),
		);
		formOneForm.reset(toFormOneDefaults(data.partOne ?? EMPTY_FORM_ONE));
		formTwoForm.reset(toFormTwoDefaults(data.partTwo ?? {}));

		if (stepInitVendorIdRef.current !== vendorRequestId) {
			stepInitVendorIdRef.current = vendorRequestId;
			setCurrentStep(EDITABLE_STATUSES.includes(data.status) ? 1 : 4);
		}
	}, [
		detailQuery.data,
		detailQuery.dataUpdatedAt,
		isPublicForm,
		vendorRequestId,
		formOneForm,
		formTwoForm,
		setOriginalAccountNumber,
	]);

	const next = React.useCallback(() => {
		setCurrentStep((step) => Math.min(step + 1, vendorOnboardingSteps.length));
	}, []);

	const back = React.useCallback(() => {
		setCurrentStep((step) => Math.max(step - 1, 1));
	}, []);

	// Full submit-time gate for each form — runs the whole Zod schema (via
	// RHF's own resolver-backed trigger()) and populates formState.errors,
	// which formOneErrors/formTwoErrors above already mirror out as plain
	// field->message objects. Kept as the same `(): boolean` signature used
	// everywhere below by returning the already-awaited result — every
	// caller in this file is itself async, so `await`ing these two is a
	// same-file, non-breaking change; nothing outside this file (e.g.
	// VendorCreationFormOne.tsx) inspects the boolean itself, it only
	// forwards the function reference as `validateFields`.
	const validateFormOneBeforeSubmit = React.useCallback(
		() => formOneForm.trigger(),
		[formOneForm],
	);

	const validateFormTwoBeforeSubmit = React.useCallback(
		() => formTwoForm.trigger(),
		[formTwoForm],
	);

	const changeFormOne = React.useCallback(
		<K extends keyof VendorCreationFormOneValues>(
			field: K,
			value: VendorCreationFormOneValues[K],
		) => {
			vendorUpdateCompletedRef.current = false;

			const fieldName = field as keyof VendorFormOneValues;

			formOneForm.setValue(fieldName, (value ?? "") as never, {
				shouldDirty: true,
				// Validate on every keystroke, per explicit request — errors
				// (and the field's success tick) should update live as the
				// vendor types, not only once they blur the field or hit
				// Submit/Save & Proceed.
				shouldValidate: true,
			});

			// GSTIN embeds the vendor's PAN at characters 3-12 — live-derive it
			// exactly like the pre-migration changeFormOne did.
			if (field === "gstin") {
				const derivedPan = extractPanFromGstin(String(value ?? ""));

				if (derivedPan) {
					formOneForm.setValue("pan", derivedPan, {
						shouldDirty: true,
						shouldValidate: true,
					});
				}
			}
		},
		[formOneForm],
	);

	const blurFormOneField = React.useCallback(
		<K extends keyof VendorCreationFormOneValues>(field: K) => {
			void formOneForm.trigger(field as keyof VendorFormOneValues);
		},
		[formOneForm],
	);

	const changeFormTwo = React.useCallback(
		<K extends keyof VendorCreationFormTwoValues>(
			key: K,
			value: VendorCreationFormTwoValues[K],
		) => {
			vendorUpdateCompletedRef.current = false;

			const fieldName = key as keyof VendorFormTwoValues;

			formTwoForm.setValue(fieldName, (value ?? "") as never, {
				shouldDirty: true,
				// Validate on every keystroke — see changeFormOne above.
				shouldValidate: true,
			});
		},
		[formTwoForm],
	);

	const saveVendorDetails = async () => {
		if (!vendorRequestId) {
			showToast({
				type: "error",
				title: vendorContent.toast.saveDetails.missingIdTitle,
				description: vendorContent.toast.saveDetails.missingIdDescription,
			});
			return;
		}
		if (!(await validateFormOneBeforeSubmit())) {
			showToast({
				type: "error",
				title: vendorContent.toast.saveDetails.validationTitle,
				description: vendorContent.toast.saveDetails.validationDescription,
			});
			return;
		}
		try {
			next();
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				vendorContent.toast.saveDetails.errorFallback,
				vendorContent.toast.saveDetails.errorTitle,
			);
		}
	};

	const saveThcmDetails = async () => {
		if (!vendorRequestId) {
			return;
		}

		if (!(await validateFormTwoBeforeSubmit())) {
			showToast({
				type: "error",
				title: vendorContent.toast.saveThcmDetails.validationTitle,
				description: vendorContent.toast.saveThcmDetails.validationDescription,
			});
			return;
		}

		try {
			await handleSaveVendorUpdate(
				buildVendorOnboardingUpdatePayload(formOneValues, formTwoValues),
			);
			// Mirrors the ref submitForApproval already checks — marking it here
			// means a plain "Save & Next" with no further edits won't trigger a
			// second, redundant update call (or a duplicate toast) at final submit.
			vendorUpdateCompletedRef.current = true;

			showSuccessToast(
				showToast,
				vendorContent.toast.saveThcmDetails.successDescription,
				vendorContent.toast.saveThcmDetails.successTitle,
			);

			next();
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				vendorContent.toast.saveThcmDetails.errorFallback,
				vendorContent.toast.saveThcmDetails.errorTitle,
			);
		}
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

			showSuccessToast(
				showToast,
				vendorContent.toast.draft.successDescription,
				vendorContent.toast.draft.successTitle,
			);

			await publicQuery.refetch();
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				vendorContent.toast.draft.errorFallback,
				vendorContent.toast.draft.errorTitle,
			);
		}
	};

	const submitPublicVendor = async (
		submission?: VendorCreationFormOneSubmission,
	) => {
		if (!submission || !normalizedToken) {
			return;
		}
		if (!(await validateFormOneBeforeSubmit())) {
			showToast({
				type: "error",
				title: vendorContent.toast.publicSubmit.validationTitle,
				description: vendorContent.toast.publicSubmit.validationDescription,
			});
			return;
		}
		const missing = getMissingDocuments(submission, formOneValues);

		if (!submission.dpdpConsent) {
			showToast({
				type: "error",
				title: vendorContent.toast.publicSubmit.dpdpTitle,
				description: vendorContent.toast.publicSubmit.dpdpDescription,
			});

			return;
		}
		if (missing.length > 0) {
			showToast({
				type: "error",
				title: vendorContent.toast.publicSubmit.missingDocsTitle,
				description: formatVendorMessage(
					vendorContent.toast.publicSubmit.missingDocsDescription,
					{ documents: missing.join(", ") },
				),
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
			showApiErrorToast(
				showToast,
				error,
				vendorContent.toast.publicSubmit.errorFallback,
				vendorContent.toast.publicSubmit.errorTitle,
			);
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
				title: vendorContent.toast.submitForApproval.missingIdTitle,
				description: vendorContent.toast.submitForApproval.missingIdDescription,
			});
			return;
		}

		const isFormOneValid = await validateFormOneBeforeSubmit();
		const isFormTwoValid = await validateFormTwoBeforeSubmit();

		if (!isFormOneValid || !isFormTwoValid) {
			setCurrentStep(isFormOneValid ? 2 : 1);
			showToast({
				type: "error",
				title: vendorContent.toast.submitForApproval.validationTitle,
				description:
					vendorContent.toast.submitForApproval.validationDescription,
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
				title: vendorContent.toast.submitForApproval.workflowRequiredTitle,
				description:
					vendorContent.toast.submitForApproval.workflowRequiredDescription,
			});
			return;
		}

		if (isClarifiedResubmission && !activeWorkflowId) {
			showToast({
				type: "error",
				title: vendorContent.toast.submitForApproval.activeWorkflowMissingTitle,
				description:
					vendorContent.toast.submitForApproval
						.activeWorkflowMissingDescription,
			});
			return;
		}

		if (shouldAssignSelectedWorkflow && (!workspaceId || !appId)) {
			showToast({
				type: "error",
				title: vendorContent.toast.submitForApproval.workspaceMissingTitle,
				description:
					vendorContent.toast.submitForApproval.workspaceMissingDescription,
			});
			return;
		}

		if (
			pendingWorkflowSelection?.saveAsTemplate &&
			!pendingWorkflowSelection.templateName?.trim()
		) {
			showToast({
				type: "error",
				title: vendorContent.toast.submitForApproval.templateNameRequiredTitle,
				description:
					vendorContent.toast.submitForApproval.templateNameRequiredDescription,
			});
			return;
		}

		submissionInFlightRef.current = true;

		try {
			// The THCM form is persisted once, before any workflow operation.
			// Normally this is already done by saveThcmDetails ("Save & Next" on
			// Form Two) — this only runs (and toasts) again if the vendor/THCM
			// edited a field after that save, which resets vendorUpdateCompletedRef.
			if (!vendorUpdateCompletedRef.current) {
				await handleSaveVendorUpdate(
					buildVendorOnboardingUpdatePayload(formOneValues, formTwoValues),
				);
				vendorUpdateCompletedRef.current = true;

				showSuccessToast(
					showToast,
					vendorContent.toast.saveThcmDetails.successDescription,
					vendorContent.toast.saveThcmDetails.successTitle,
				);
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

			// Captured before the branch below mutates workflowPreparedRef, so we
			// can tell "just attached this call" apart from "already attached on
			// an earlier attempt, only retrying what failed after it" — the
			// latter must not re-fire the workflow-attached toast.
			const workflowJustPrepared = !workflowPreparedRef.current;

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

			if (workflowJustPrepared) {
				showSuccessToast(
					showToast,
					vendorContent.toast.workflowAttached.successDescription,
					vendorContent.toast.workflowAttached.successTitle,
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
					? vendorContent.toast.submitForApproval.resubmitSuccessTitle
					: vendorContent.toast.submitForApproval.submitSuccessTitle,
				description: isClarifiedResubmission
					? hasPendingWorkflowSelection
						? vendorContent.toast.submitForApproval
								.resubmitWithNewWorkflowDescription
						: resubmitStageEdits?.length
							? vendorContent.toast.submitForApproval
									.resubmitWithStageEditsDescription
							: vendorContent.toast.submitForApproval
									.resubmitUnchangedWorkflowDescription
					: vendorContent.toast.submitForApproval.submitSuccessDescription,
			});

			if (onSuccess) {
				await onSuccess();
			} else {
				navigate("/vendor/onboarding/listing?tab=onboarding");
			}
		} catch (error: unknown) {
			showApiErrorToast(
				showToast,
				error,
				isClarifiedResubmission
					? vendorContent.toast.submitForApproval.resubmitFailedFallback
					: vendorContent.toast.submitForApproval.submitFailedFallback,
				isClarifiedResubmission
					? vendorContent.toast.submitForApproval.resubmitFailedTitle
					: vendorContent.toast.submitForApproval.submitFailedTitle,
			);
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
					title: vendorContent.toast.vendorCode.permissionDeniedTitle,
					description:
						vendorContent.toast.vendorCode.permissionDeniedDescription,
				});
				return false;
			}

			const vendorCode =
				(codeOverride ?? formTwoValues.vendorCode)?.trim() ?? "";

			if (!vendorCode) {
				formTwoForm.setError("vendorCode", {
					type: "manual",
					message: MANDATORY_ERROR,
				});
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

				formTwoForm.setValue("vendorCode", vendorCode, { shouldDirty: true });
				formTwoForm.clearErrors("vendorCode");

				await detailQuery.refetch();

				showSuccessToast(
					showToast,
					vendorContent.toast.vendorCode.successDescription,
					vendorContent.toast.vendorCode.successTitle,
				);

				return true;
			} catch (error) {
				const responseStatus = (error as { response?: { status?: number } })
					.response?.status;

				if (responseStatus === 401) {
					showToast({
						type: "error",
						title: vendorContent.toast.vendorCode.authErrorTitle,
						description: vendorContent.toast.vendorCode.authErrorDescription,
					});
					return false;
				}

				if (responseStatus === 403) {
					showToast({
						type: "error",
						title: vendorContent.toast.vendorCode.forbiddenTitle,
						description: vendorContent.toast.vendorCode.forbiddenDescription,
					});
					return false;
				}

				showApiErrorToast(
					showToast,
					error,
					vendorContent.toast.vendorCode.errorFallback,
					vendorContent.toast.vendorCode.errorTitle,
				);
				return false;
			} finally {
				setIsSavingVendorCode(false);
			}
		},
		[
			canEditVendorCode,
			detailQuery,
			formTwoValues.vendorCode,
			formTwoForm,
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

			showSuccessToast(
				showToast,
				vendorContent.toast.acceptAndClose.successDescription,
				vendorContent.toast.acceptAndClose.successTitle,
			);

			navigate("/vendor/onboarding/listing?tab=onboarding");
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				vendorContent.toast.acceptAndClose.errorFallback,
				vendorContent.toast.acceptAndClose.errorTitle,
			);
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
			showApiErrorToast(
				showToast,
				error,
				vendorContent.toast.pdf.previewErrorFallback,
				vendorContent.toast.pdf.previewErrorTitle,
			);
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

			const link = document.createElement("a");

			link.href = url;
			link.download = `vendor-details-${
				referenceNumber?.trim() || vendorRequestId
			}.pdf`;
			link.rel = "noopener noreferrer";

			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch {
			showToast({
				type: "error",
				title: vendorContent.toast.pdf.downloadErrorTitle,
				description: vendorContent.toast.pdf.downloadErrorFallback,
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
		validateFormOneBeforeSubmit,
		formOneDocuments: isPublicForm
			? (publicQuery.data?.documents ?? [])
			: (detailQuery.data?.documents ?? []),

		user,
		formStatus: status,
		referenceNumber,
		vendorReferenceName,

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
		handleFormOneBlur: blurFormOneField,

		handleFormTwoChange: changeFormTwo,
		// Form Two's "Reset" button had no handler at all before this
		// migration (a dead button — see VendorCreationFormTwo.tsx). Now
		// backed by RHF: resets back to the last-loaded/defaultValues
		// baseline, the same "reset to original" meaning Form One's Reset
		// already has.
		handleResetFormTwo: React.useCallback(
			() => formTwoForm.reset(),
			[formTwoForm],
		),

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
