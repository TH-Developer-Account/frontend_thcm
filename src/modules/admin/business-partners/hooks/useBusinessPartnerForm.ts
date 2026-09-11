// useBusinessPartnerForm.ts
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useBusinessPartner } from "./useBusinessPartners";
import { useBusinessPartnerMutations } from "./useBusinessPartnerMutations";

import {
	EMPTY_BUSINESS_PARTNER_FORM,
	mapBusinessPartnerToForm,
	mapContactFormToUpdatePayload,
	mapGeneralFormToCreatePayload,
	mapGeneralFormToUpdatePayload,
	mapOrganizationFormToUpdatePayload,
} from "../utils/businessPartner.mapper";

import {
	DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
	type BPFormTab,
	type BusinessPartnerDetail,
	type BusinessPartnerFormState,
	type BusinessPartnerPermissions,
} from "../utils/bp.types";
import { validateBusinessPartnerForm } from "../utils/businessPartner.schema";

export type BusinessPartnerFieldErrors = ReturnType<
	typeof validateBusinessPartnerForm
>;

export type DetailFormSection =
	| "general"
	| "organization"
	| "contact"
	| "address"
	| null;

export const businessPartnerPaths = {
	list: () => "/admin/business-partners",
	create: () => "/admin/business-partners/create",
	view: (id: string) => `/admin/business-partners/${id}/view`,
	edit: (id: string) => `/admin/business-partners/${id}/edit`,
};

const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) return error.message;
	return "Unable to save the business partner";
};

// =============================================================================
// Create / Edit page form
// =============================================================================

type UseCreateEditFormOptions = {
	/** undefined => create mode, string => edit mode */
	businessPartnerId?: string;
	permissions?: BusinessPartnerPermissions;
};

/**
 * Owns the create/edit page's form only. Does NOT know about the view
 * page's inline section editor (see useBusinessPartnerSectionEditor below)
 * — the two used to share one hook via isDetailMode branching through
 * every function; splitting them means handleSubmit/handleCancel/etc. no
 * longer need to ask "which page am I in" before deciding what to do.
 */
export const useBusinessPartnerCreateEditForm = ({
	businessPartnerId,
	permissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
}: UseCreateEditFormOptions = {}) => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const normalizedId = businessPartnerId?.trim() ?? "";
	const isEditMode = Boolean(normalizedId);
	const isCreateMode = !isEditMode;

	// Create-mode only: a `?parentId=` query param means "create a branch
	// office under this parent BP", arrived at via the "Add Branch" action.
	const parentIdFromQuery = isCreateMode
		? (searchParams.get("parentId")?.trim() ?? "")
		: "";

	const partnerQuery = useBusinessPartner(
		isEditMode ? normalizedId : undefined,
	);

	// Create-mode only: fetch the parent BP purely to prefill the form.
	const parentPartnerQuery = useBusinessPartner(
		isCreateMode && parentIdFromQuery ? parentIdFromQuery : undefined,
	);

	const {
		createBusinessPartner,
		updateBusinessPartner,
		isCreating,
		isUpdating,
		createError,
		updateError,
	} = useBusinessPartnerMutations();

	const formKey = isEditMode
		? `edit:${normalizedId}`
		: `create:${parentIdFromQuery}`;

	const initialForm = useMemo<BusinessPartnerFormState>(() => {
		if (partnerQuery.data) {
			return mapBusinessPartnerToForm(partnerQuery.data);
		}

		const parentPartner = parentPartnerQuery.data;

		return {
			...EMPTY_BUSINESS_PARTNER_FORM,
			officeType: parentIdFromQuery
				? "BRANCH_OFFICE"
				: EMPTY_BUSINESS_PARTNER_FORM.officeType,
			parentId: parentIdFromQuery,
			bpName: parentPartner?.bpName ?? "",
			bpShortName: parentPartner?.bpShortName ?? "",
			legalTradeName: parentPartner?.legalTradeName ?? "",
		};
	}, [parentIdFromQuery, parentPartnerQuery.data, partnerQuery.data]);

	const [formDraft, setFormDraft] = useState<{
		key: string;
		values: BusinessPartnerFormState;
	} | null>(null);

	const form = formDraft?.key === formKey ? formDraft.values : initialForm;

	const [fieldErrors, setFieldErrors] = useState<BusinessPartnerFieldErrors>(
		{},
	);

	const [validationError, setValidationError] = useState<string | null>(null);
	const [lastSavedSection, setLastSavedSection] = useState<BPFormTab | null>(
		null,
	);

	const handleChange = useCallback(
		<K extends keyof BusinessPartnerFormState>(
			key: K,
			value: BusinessPartnerFormState[K],
		) => {
			setValidationError(null);
			setFieldErrors({});

			setFormDraft((currentDraft) => {
				const current =
					currentDraft?.key === formKey ? currentDraft.values : initialForm;
				const next = { ...current, [key]: value };

				// Setting a parentId always implies branch office, on create only —
				// editing an existing BP's general section shouldn't silently
				// reclassify it.
				if (
					isCreateMode &&
					key === "parentId" &&
					typeof value === "string" &&
					value.trim().length > 0
				) {
					next.officeType = "BRANCH_OFFICE";
				}

				return { key: formKey, values: next };
			});
		},
		[formKey, initialForm, isCreateMode],
	);

	const canSubmit = isEditMode
		? permissions.canUpdateBusinessPartner
		: permissions.canCreateBusinessPartner;

	const isSaving = isCreating || isUpdating;

	const validationErrors = useMemo(
		() => validateBusinessPartnerForm(form),
		[form],
	);
	const isFormValid = Object.keys(validationErrors).length === 0;

	const handleSubmit = useCallback(
		async (section: BPFormTab = "organization") => {
			if (isSaving) return;

			if (!isFormValid) {
				setFieldErrors(validationErrors);
				setValidationError(null);
				return;
			}

			try {
				setValidationError(null);
				setFieldErrors({});

				if (!isEditMode) {
					if (section !== "organization") {
						throw new Error(
							"Create the business partner before adding other information",
						);
					}

					const payload = mapGeneralFormToCreatePayload(form);
					const createdPartner = await createBusinessPartner(payload);

					navigate(businessPartnerPaths.view(createdPartner.id), {
						replace: true,
					});

					setLastSavedSection(section);
					return;
				}

				if (!canSubmit || section !== "organization") return;

				const payload = mapOrganizationFormToUpdatePayload(form);

				await updateBusinessPartner({
					businessPartnerId: normalizedId,
					payload,
				});

				setLastSavedSection(section);
			} catch (error) {
				setValidationError(getErrorMessage(error));
			}
		},
		[
			canSubmit,
			validationErrors,
			createBusinessPartner,
			form,
			isEditMode,
			isFormValid,
			isSaving,
			navigate,
			normalizedId,
			updateBusinessPartner,
		],
	);

	const handleCancel = useCallback(() => {
		if (isEditMode) {
			navigate(businessPartnerPaths.view(normalizedId));
			return;
		}
		navigate(businessPartnerPaths.list());
	}, [isEditMode, navigate, normalizedId]);

	const mutationError = isEditMode ? updateError : createError;
	const error =
		validationError ?? (mutationError ? getErrorMessage(mutationError) : null);

	// Before a BP exists, only General/Organization is available.
	const availableTabs = useMemo<BPFormTab[] | undefined>(
		() => (isEditMode ? undefined : ["organization"]),
		[isEditMode],
	);

	return {
		form,
		handleChange,
		fieldErrors,
		error,
		isSaving,
		isEditMode,
		isLoading: isEditMode && partnerQuery.isLoading,
		isError: isEditMode && partnerQuery.isError,
		isFormValid,
		canSubmit,
		lastSavedSection,
		availableTabs,
		handleSubmit,
		handleCancel,
	};
};

export type BusinessPartnerCreateEditForm = ReturnType<
	typeof useBusinessPartnerCreateEditForm
>;

// =============================================================================
// View page — inline section editor
// =============================================================================

type UseSectionEditorOptions = {
	partner: BusinessPartnerDetail;
	permissions?: BusinessPartnerPermissions;
};

/**
 * Owns the view page's per-section (general/organization/contact) inline
 * edit-in-place UI. Always has `partner` in hand already — no fetching, no
 * create-mode branch, no parentId prefill logic. This is the entire reason
 * for the split: BPTabs.tsx never exercised any of the create/edit-page
 * code above, it just paid for it on every render via shared branching.
 */
export const useBusinessPartnerSectionEditor = ({
	partner,
	permissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
}: UseSectionEditorOptions) => {
	const [form, setForm] = useState<BusinessPartnerFormState>(() =>
		mapBusinessPartnerToForm(partner),
	);
	const [editingSection, setEditingSection] = useState<DetailFormSection>(null);
	const [validationError, setValidationError] = useState<string | null>(null);

	const { updateBusinessPartner, isUpdating, updateError } =
		useBusinessPartnerMutations();

	const handleChange = useCallback(
		<K extends keyof BusinessPartnerFormState>(
			key: K,
			value: BusinessPartnerFormState[K],
		) => {
			setValidationError(null);
			setForm((current) => ({ ...current, [key]: value }));
		},
		[],
	);

	const startEditing = useCallback(
		(section: Exclude<DetailFormSection, null>) => {
			setForm(mapBusinessPartnerToForm(partner));
			setEditingSection(section);
			setValidationError(null);
		},
		[partner],
	);

	const cancelEditing = useCallback(() => {
		setForm(mapBusinessPartnerToForm(partner));
		setEditingSection(null);
		setValidationError(null);
	}, [partner]);

	const handleSave = useCallback(async () => {
		if (!editingSection) return;
		if (!permissions.canUpdateBusinessPartner) return;

		try {
			setValidationError(null);

			const payload =
				editingSection === "organization"
					? mapOrganizationFormToUpdatePayload(form)
					: editingSection === "contact"
						? mapContactFormToUpdatePayload(form)
						: mapGeneralFormToUpdatePayload(form);

			await updateBusinessPartner({ businessPartnerId: partner.id, payload });

			setEditingSection(null);
		} catch (error) {
			setValidationError(getErrorMessage(error));
		}
	}, [
		editingSection,
		form,
		partner.id,
		permissions.canUpdateBusinessPartner,
		updateBusinessPartner,
	]);

	const error =
		validationError ?? (updateError ? getErrorMessage(updateError) : null);

	return {
		form,
		handleChange,
		editingSection,
		isSaving: isUpdating,
		error,
		startEditing,
		cancelEditing,
		handleSave,
	};
};

export type BusinessPartnerSectionEditor = ReturnType<
	typeof useBusinessPartnerSectionEditor
>;
