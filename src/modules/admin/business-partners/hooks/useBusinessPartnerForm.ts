import { useCallback, useState } from "react";
import axios from "axios";

import { useBusinessPartnerMutations } from "./useBusinessPartnerMutations";

import {
	mapBusinessPartnerToForm,
	mapContactFormToUpdatePayload,
	mapGeneralFormToUpdatePayload,
	mapOrganizationFormToUpdatePayload,
} from "../utils/businessPartner.mapper";

import {
	DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
	SECTION_LABELS,
	type BusinessPartnerDetail,
	type BusinessPartnerFormState,
	type BusinessPartnerPermissions,
} from "../utils/bp.types";
import { useToast } from "../../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../../utils/apiError.helper";

export type DetailFormSection =
	| "general"
	| "organization"
	| "contact"
	| "address"
	| null;

/**
 * Inline section editor for the BP view page (BPTabs).
 *
 * The create/edit page no longer uses this hook — it moved to independent
 * RHF + Zod cards (see useBPGeneralInfoCardForm / useBPAddressCardForm).
 * The create-mode, parent-prefill, availableTabs and navigation branches
 * that only served the old tabbed create form were removed with it.
 */
type UseBusinessPartnerFormOptions = {
	partner: BusinessPartnerDetail;
	permissions?: BusinessPartnerPermissions;
};

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

export const businessPartnerPaths = {
	list: () => "/admin/business-partners",
	create: () => "/admin/business-partners/create",
	view: (id: string) =>
		`/admin/business-partners/${encodeURIComponent(id)}/view`,
	edit: (id: string) =>
		`/admin/business-partners/${encodeURIComponent(id)}/edit`,
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
	partner,
	permissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
}: UseBusinessPartnerFormOptions) => {
	const { showToast } = useToast();

	const { updateBusinessPartner, isUpdating, updateError } =
		useBusinessPartnerMutations();

	const [form, setForm] = useState<BusinessPartnerFormState>(() =>
		mapBusinessPartnerToForm(partner),
	);

	const [validationError, setValidationError] = useState<string | null>(null);

	/**
	 * null       => read mode
	 * otherwise  => the section currently being edited
	 */
	const [editingSection, setEditingSection] = useState<DetailFormSection>(null);

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

	/**
	 * Saves whichever section is currently being edited.
	 */
	const handleSave = useCallback(async () => {
		if (!isDetailSection(editingSection)) {
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

			showToast({
				type: "success",
				title: "Saved",
				description: `${SECTION_LABELS[editingSection]} updated successfully.`,
			});

			setEditingSection(null);
		} catch (error) {
			// API failures are toasted by useBusinessPartnerMutations' onError.
			// Only toast here for local (mapper) validation errors, so a failed
			// request no longer produces two "Update failed" toasts.
			if (!axios.isAxiosError(error)) {
				showToast({
					type: "error",
					title: "Update failed",
					description: getApiErrorMessage(error, getErrorMessage(error)),
				});
			}

			setValidationError(getErrorMessage(error));
		}
	}, [
		editingSection,
		form,
		partner.id,
		permissions.canUpdateBusinessPartner,
		showToast,
		updateBusinessPartner,
	]);

	const error =
		validationError ?? (updateError ? getErrorMessage(updateError) : null);

	return {
		form,
		handleChange,
		error,
		isSaving: isUpdating,

		editingSection,
		startEditing,
		cancelEditing,
		handleSave,
	};
};
