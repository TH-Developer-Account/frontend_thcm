import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export type DetailFormSection = "general" | "organization" | "contact" | null;

type UseBusinessPartnerFormOptions = {
	/**
	 * Used by the create/edit page.
	 *
	 * - undefined => create mode
	 * - string => edit mode
	 */
	businessPartnerId?: string;

	/**
	 * Used by the view page.
	 *
	 * When provided, the hook works as an inline section editor
	 * and does not perform navigation or fetching.
	 */
	partner?: BusinessPartnerDetail;

	permissions?: BusinessPartnerPermissions;
};

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

export const businessPartnerPaths = {
	list: () => "/admin/business-partners",
	create: () => "/admin/business-partners/create",
	view: (id: string) => `/admin/business-partners/${id}/view`,
	edit: (id: string) => `/admin/business-partners/${id}/edit`,
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}

	return "Unable to save the business partner";
};

const isDetailSection = (
	section: DetailFormSection,
): section is Exclude<DetailFormSection, null> => Boolean(section);

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export const useBusinessPartnerForm = ({
	businessPartnerId,
	partner,
	permissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
}: UseBusinessPartnerFormOptions = {}) => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	/**
	 * ---------------------------------------------------------------------------
	 * Mode
	 * ---------------------------------------------------------------------------
	 *
	 * Create/Edit page:
	 *   businessPartnerId is supplied from the route.
	 *
	 * View page:
	 *   partner is supplied by the parent.
	 *
	 * partner takes precedence because the view page already has the
	 * fully loaded business partner.
	 */
	const normalizedId = businessPartnerId?.trim() || partner?.id?.trim() || "";

	const isDetailMode = Boolean(partner);
	const isEditMode = Boolean(normalizedId);
	const isCreateMode = !isDetailMode && !isEditMode;

	/**
	 * Create-mode only: a `?parentId=` query param means "create a branch
	 * office under this parent BP", arrived at via the "Add Branch" action
	 * on the parent's Branches tab.
	 */
	const parentIdFromQuery = isCreateMode
		? (searchParams.get("parentId")?.trim() ?? "")
		: "";

	// ---------------------------------------------------------------------------
	// Query
	// ---------------------------------------------------------------------------

	/**
	 * Only fetch when this hook is being used by the create/edit page.
	 *
	 * The view page already has `partner`, so it doesn't need another request.
	 */
	const partnerQuery = useBusinessPartner(
		!isDetailMode && isEditMode ? normalizedId : undefined,
	);

	/**
	 * Create-mode only: fetch the parent BP purely to prefill the form —
	 * name / short name / legal trade name get copied over but remain
	 * fully editable afterward.
	 */
	const parentPartnerQuery = useBusinessPartner(
		isCreateMode && parentIdFromQuery ? parentIdFromQuery : undefined,
	);

	// ---------------------------------------------------------------------------
	// Mutations
	// ---------------------------------------------------------------------------

	const {
		createBusinessPartner,
		updateBusinessPartner,
		isCreating,
		isUpdating,
		createError,
		updateError,
	} = useBusinessPartnerMutations();

	// ---------------------------------------------------------------------------
	// Form state
	// ---------------------------------------------------------------------------

	const [form, setForm] = useState<BusinessPartnerFormState>(() => {
		if (partner) {
			return mapBusinessPartnerToForm(partner);
		}

		return {
			...EMPTY_BUSINESS_PARTNER_FORM,
		};
	});

	const [initializedPartnerId, setInitializedPartnerId] = useState<
		string | null
	>(null);

	const [validationError, setValidationError] = useState<string | null>(null);

	const [lastSavedSection, setLastSavedSection] = useState<BPFormTab | null>(
		null,
	);

	/**
	 * Only used by the view page.
	 *
	 * null       => read mode
	 * "general"  => editing general
	 * "organization" => editing organization
	 * "contact" => editing contact
	 */
	const [editingSection, setEditingSection] = useState<DetailFormSection>(null);

	// ---------------------------------------------------------------------------
	// Hydrate edit-page form
	// ---------------------------------------------------------------------------

	useEffect(() => {
		if (isDetailMode) {
			return;
		}

		const fetchedPartner = partnerQuery.data;

		if (!fetchedPartner || initializedPartnerId === fetchedPartner.id) {
			return;
		}

		setForm(mapBusinessPartnerToForm(fetchedPartner));
		setInitializedPartnerId(fetchedPartner.id);
	}, [isDetailMode, initializedPartnerId, partnerQuery.data]);

	// ---------------------------------------------------------------------------
	// Create-page branch prefill (from ?parentId=)
	// ---------------------------------------------------------------------------

	/**
	 * Pre-select "Branch Office" + parentId as soon as we know we're
	 * creating a branch, even before the parent BP data has loaded.
	 */
	const hasAppliedParentIdFromQuery = useRef(false);

	useEffect(() => {
		if (!isCreateMode || !parentIdFromQuery) {
			return;
		}

		if (hasAppliedParentIdFromQuery.current) {
			return;
		}

		hasAppliedParentIdFromQuery.current = true;

		setForm((current) => ({
			...current,
			officeType: "BRANCH_OFFICE",
			parentId: parentIdFromQuery,
		}));
	}, [isCreateMode, parentIdFromQuery]);

	/**
	 * Once the parent BP itself has loaded, copy over its identifying
	 * info as a starting point. Runs once per parent id, and never
	 * overwrites a value the user has already typed.
	 */
	const hasPrefilledFromParent = useRef<string | null>(null);

	useEffect(() => {
		const parentPartner = parentPartnerQuery.data;

		if (!isCreateMode || !parentPartner) {
			return;
		}

		if (hasPrefilledFromParent.current === parentPartner.id) {
			return;
		}

		hasPrefilledFromParent.current = parentPartner.id;

		setForm((current) => ({
			...current,
			officeType: "BRANCH_OFFICE",
			parentId: parentIdFromQuery,
			bpName: current.bpName || parentPartner.bpName,
			bpShortName: current.bpShortName || parentPartner.bpShortName || "",
			legalTradeName:
				current.legalTradeName || parentPartner.legalTradeName || "",
		}));
	}, [isCreateMode, parentIdFromQuery, parentPartnerQuery.data]);

	// ---------------------------------------------------------------------------
	// Change handler
	// ---------------------------------------------------------------------------

	const handleChange = useCallback(
		<K extends keyof BusinessPartnerFormState>(
			key: K,
			value: BusinessPartnerFormState[K],
		) => {
			setValidationError(null);

			setForm((current) => {
				const next = { ...current, [key]: value };

				/**
				 * Whenever a parent BP is set, this record is necessarily a
				 * branch office of that parent — keep officeType in sync
				 * regardless of whether parentId was typed manually or
				 * arrived via the "Add Branch" prefill. Scoped to the
				 * create page only; editing an existing BP's general
				 * section should not silently reclassify it.
				 */
				if (
					isCreateMode &&
					key === "parentId" &&
					typeof value === "string" &&
					value.trim().length > 0
				) {
					next.officeType = "BRANCH_OFFICE";
				}

				return next;
			});
		},
		[isCreateMode],
	);

	// ---------------------------------------------------------------------------
	// Create/Edit page
	// ---------------------------------------------------------------------------

	const canSubmit = isEditMode
		? permissions.canUpdateBusinessPartner
		: permissions.canCreateBusinessPartner;

	const isSaving = isCreating || isUpdating;

	const isFormValid = useMemo(
		() =>
			Boolean(
				form.internalId.trim() &&
				form.bpName.trim() &&
				form.officeType &&
				form.bpType &&
				(form.officeType !== "BRANCH_OFFICE" || form.parentId.trim()),
			),
		[form],
	);

	/**
	 * Handles the continuous form used by the create/edit page.
	 *
	 * general:
	 *   create when new
	 *   update when editing
	 *
	 * organization:
	 *   update only
	 */
	const handleSubmit = useCallback(
		async (section: BPFormTab = "general") => {
			if (isDetailMode || isSaving) {
				return;
			}

			try {
				setValidationError(null);

				// ---------------------------------------------------------------
				// Create
				// ---------------------------------------------------------------

				if (!isEditMode) {
					if (section !== "general") {
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

				// ---------------------------------------------------------------
				// Update
				// ---------------------------------------------------------------

				if (!canSubmit) {
					return;
				}

				if (section !== "general" && section !== "organization") {
					return;
				}

				const payload =
					section === "organization"
						? mapOrganizationFormToUpdatePayload(form)
						: mapGeneralFormToUpdatePayload(form);

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
			createBusinessPartner,
			form,
			isDetailMode,
			isEditMode,
			isSaving,
			navigate,
			normalizedId,
			updateBusinessPartner,
		],
	);

	// ---------------------------------------------------------------------------
	// View page — inline section editing
	// ---------------------------------------------------------------------------

	const startEditing = useCallback(
		(section: Exclude<DetailFormSection, null>) => {
			if (!partner) {
				return;
			}

			setForm(mapBusinessPartnerToForm(partner));
			setEditingSection(section);
			setValidationError(null);
		},
		[partner],
	);

	const cancelEditing = useCallback(() => {
		if (!partner) {
			return;
		}

		setForm(mapBusinessPartnerToForm(partner));
		setEditingSection(null);
		setValidationError(null);
	}, [partner]);

	/**
	 * Saves whichever section is currently being edited on the view page.
	 */
	const handleSave = useCallback(async () => {
		if (!partner || !isDetailSection(editingSection)) {
			return;
		}

		if (!permissions.canUpdateBusinessPartner) {
			return;
		}

		try {
			setValidationError(null);

			const payload =
				editingSection === "organization"
					? mapOrganizationFormToUpdatePayload(form)
					: editingSection === "contact"
						? mapContactFormToUpdatePayload(form)
						: mapGeneralFormToUpdatePayload(form);

			await updateBusinessPartner({
				businessPartnerId: partner.id,
				payload,
			});

			setEditingSection(null);
		} catch (error) {
			setValidationError(getErrorMessage(error));
		}
	}, [
		editingSection,
		form,
		partner,
		permissions.canUpdateBusinessPartner,
		updateBusinessPartner,
	]);

	// ---------------------------------------------------------------------------
	// Navigation
	// ---------------------------------------------------------------------------

	const handleCancel = useCallback(() => {
		/**
		 * View page:
		 * cancel only exits the current section's edit mode.
		 */
		if (isDetailMode) {
			cancelEditing();
			return;
		}

		/**
		 * Edit page:
		 * return to detail page.
		 */
		if (isEditMode) {
			navigate(businessPartnerPaths.view(normalizedId));
			return;
		}

		/**
		 * Create page:
		 * return to listing.
		 */
		navigate(businessPartnerPaths.list());
	}, [cancelEditing, isDetailMode, isEditMode, navigate, normalizedId]);

	// ---------------------------------------------------------------------------
	// Errors
	// ---------------------------------------------------------------------------

	const mutationError = isEditMode ? updateError : createError;

	const error =
		validationError ?? (mutationError ? getErrorMessage(mutationError) : null);

	// ---------------------------------------------------------------------------
	// Tabs
	// ---------------------------------------------------------------------------

	/**
	 * Before a BP exists, only General is available.
	 *
	 * Once editing/viewing an existing BP, the parent can render all tabs.
	 */
	const availableTabs = useMemo<BPFormTab[] | undefined>(
		() => (isEditMode ? undefined : ["general"]),
		[isEditMode],
	);

	// ---------------------------------------------------------------------------
	// Return
	// ---------------------------------------------------------------------------

	return {
		// -----------------------------------------------------------------------
		// Common form state
		// -----------------------------------------------------------------------

		form,
		handleChange,
		error,
		isSaving,

		// -----------------------------------------------------------------------
		// Create/Edit page
		// -----------------------------------------------------------------------

		isEditMode,
		isLoading: !isDetailMode && isEditMode && partnerQuery.isLoading,
		isError: !isDetailMode && isEditMode && partnerQuery.isError,
		isFormValid,
		canSubmit,
		lastSavedSection,
		availableTabs,

		handleSubmit,
		handleCancel,

		// -----------------------------------------------------------------------
		// View page / inline editing
		// -----------------------------------------------------------------------

		editingSection,
		startEditing,
		cancelEditing,
		handleSave,
	};
};
