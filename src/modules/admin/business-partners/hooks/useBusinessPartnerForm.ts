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
	BP_ORGANIZATION_TAX_FIELD_ORDER,
	bpOrganizationTaxSchema,
	type BPOrganizationTaxValues,
} from "../utils/businessPartner.schema";

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

export type OrganizationTaxField = keyof BPOrganizationTaxValues;
export type OrganizationFieldErrors = Partial<
	Record<OrganizationTaxField, string>
>;

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

const EMPTY_REVEALED: ReadonlySet<OrganizationTaxField> = new Set();
const ALL_REVEALED: ReadonlySet<OrganizationTaxField> = new Set(
	BP_ORGANIZATION_TAX_FIELD_ORDER,
);

/** Runs the Zod schema and keeps the first message per field. */
const getOrganizationFieldErrors = (
	form: BusinessPartnerFormState,
): OrganizationFieldErrors => {
	const result = bpOrganizationTaxSchema.safeParse({
		gst: form.gst,
		panNumber: form.panNumber,
	});

	if (result.success) return {};

	const errors: OrganizationFieldErrors = {};

	for (const issue of result.error.issues) {
		const field = issue.path[0];

		if ((field === "gst" || field === "panNumber") && !errors[field]) {
			errors[field] = issue.message;
		}
	}

	return errors;
};

const focusField = (field: OrganizationTaxField) => {
	document.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
};

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

	/** Org tax fields whose errors are visible (blurred, or after a save attempt). */
	const [revealedOrgFields, setRevealedOrgFields] =
		useState<ReadonlySet<OrganizationTaxField>>(EMPTY_REVEALED);

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

	const handleOrganizationBlur = useCallback((field: OrganizationTaxField) => {
		setRevealedOrgFields((current) =>
			current.has(field) ? current : new Set(current).add(field),
		);
	}, []);

	const startEditing = useCallback(
		(section: Exclude<DetailFormSection, null>) => {
			setForm(mapBusinessPartnerToForm(partner));
			setEditingSection(section);
			setValidationError(null);
			setRevealedOrgFields(EMPTY_REVEALED);
		},
		[partner],
	);

	const cancelEditing = useCallback(() => {
		setForm(mapBusinessPartnerToForm(partner));
		setEditingSection(null);
		setValidationError(null);
		setRevealedOrgFields(EMPTY_REVEALED);
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

		if (editingSection === "organization") {
			const errors = getOrganizationFieldErrors(form);
			const firstInvalid = BP_ORGANIZATION_TAX_FIELD_ORDER.find(
				(field) => errors[field],
			);

			if (firstInvalid) {
				setRevealedOrgFields(ALL_REVEALED);
				focusField(firstInvalid);
				return; // never send an invalid form to the backend
			}
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
			setRevealedOrgFields(EMPTY_REVEALED);
		} catch (error) {
			// API failures are toasted by useBusinessPartnerMutations' onError.
			// Only toast here for local (mapper) validation errors, so a failed
			// request doesn't produce two "Update failed" toasts.
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

	// Derived from the current values, so corrections revalidate on change.
	const allOrganizationErrors =
		editingSection === "organization" ? getOrganizationFieldErrors(form) : {};

	const organizationErrors: OrganizationFieldErrors = {};
	for (const field of revealedOrgFields) {
		if (allOrganizationErrors[field]) {
			organizationErrors[field] = allOrganizationErrors[field];
		}
	}

	const error =
		validationError ?? (updateError ? getErrorMessage(updateError) : null);

	return {
		form,
		handleChange,
		error,
		isSaving: isUpdating,

		organizationErrors,
		handleOrganizationBlur,

		editingSection,
		startEditing,
		cancelEditing,
		handleSave,
	};
};
