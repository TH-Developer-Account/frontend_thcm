import { useCallback, useState } from "react";

import { useBusinessPartnerMutations } from "./useBusinessPartnerMutations";

import {
	mapBusinessPartnerToForm,
	mapContactFormToUpdatePayload,
	mapGeneralFormToUpdatePayload,
	mapOrganizationFormToUpdatePayload,
} from "../utils/businessPartner.mapper";

import type {
	BusinessPartnerDetail,
	BusinessPartnerFormState,
} from "../utils/bp.types";

export type DetailFormSection = "general" | "organization" | "contact" | null;

type DetailFormState = {
	form: BusinessPartnerFormState;
	editingSection: DetailFormSection;
	validationError: string | null;
};

const getErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : "Unable to save changes";

const buildInitialState = (
	partner: BusinessPartnerDetail,
): DetailFormState => ({
	form: mapBusinessPartnerToForm(partner),
	editingSection: null,
	validationError: null,
});

export const useBusinessPartnerDetailForm = (
	partner: BusinessPartnerDetail,
) => {
	const { updateBusinessPartner, isUpdating, updateError } =
		useBusinessPartnerMutations();

	const [state, setState] = useState<DetailFormState>(() =>
		buildInitialState(partner),
	);

	const startEditing = useCallback(
		(section: Exclude<DetailFormSection, null>) => {
			console.log("[detailForm] startEditing:", section);
			setState({
				form: mapBusinessPartnerToForm(partner),
				editingSection: section,
				validationError: null,
			});
		},
		[partner],
	);

	const cancelEditing = useCallback(() => {
		console.log("[detailForm] cancelEditing");
		setState({
			form: mapBusinessPartnerToForm(partner),
			editingSection: null,
			validationError: null,
		});
	}, [partner]);

	const handleChange = useCallback(
		<K extends keyof BusinessPartnerFormState>(
			key: K,
			value: BusinessPartnerFormState[K],
		) => {
			setState((current) => ({
				...current,
				form: { ...current.form, [key]: value },
				validationError: null,
			}));
		},
		[],
	);

	const handleSave = useCallback(async () => {
		console.log(
			"[detailForm] handleSave called. editingSection =",
			state.editingSection,
		);

		const section = state.editingSection;
		if (!section) {
			console.warn("[detailForm] handleSave aborted: no editingSection set");
			return;
		}

		try {
			setState((current) => ({ ...current, validationError: null }));

			const payload =
				section === "organization"
					? mapOrganizationFormToUpdatePayload(state.form)
					: section === "contact"
						? mapContactFormToUpdatePayload(state.form)
						: mapGeneralFormToUpdatePayload(state.form);

			console.log("[detailForm] section:", section, "payload:", payload);
			console.log("[detailForm] partner.id:", partner.id);

			const result = await updateBusinessPartner({
				businessPartnerId: partner.id,
				payload,
			});

			console.log("[detailForm] update succeeded:", result);

			setState((current) => ({ ...current, editingSection: null }));
		} catch (error) {
			console.error("[detailForm] update failed:", error);
			setState((current) => ({
				...current,
				validationError: getErrorMessage(error),
			}));
		}
	}, [partner.id, state.editingSection, state.form, updateBusinessPartner]);

	return {
		form: state.form,
		editingSection: state.editingSection,
		isSaving: isUpdating,
		error:
			state.validationError ??
			(updateError ? getErrorMessage(updateError) : null),
		startEditing,
		cancelEditing,
		handleChange,
		handleSave,
	};
};
