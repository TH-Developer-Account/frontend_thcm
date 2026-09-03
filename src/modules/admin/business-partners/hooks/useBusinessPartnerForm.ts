import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useBusinessPartner } from "./useBusinessPartners";
import { useBusinessPartnerMutations } from "./useBusinessPartnerMutations";

import {
	EMPTY_BUSINESS_PARTNER_FORM,
	mapBusinessPartnerFormToPayload,
	mapBusinessPartnerToForm,
} from "../utils/businessPartner.mapper";

import {
	DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
	type BusinessPartnerFormState,
	type BusinessPartnerPermissions,
} from "../utils/bp.types";

type UseBusinessPartnerFormOptions = {
	businessPartnerId?: string;
	permissions?: BusinessPartnerPermissions;
};

const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}

	return "Unable to save the business partner";
};

export const useBusinessPartnerForm = ({
	businessPartnerId,
	permissions = DEFAULT_BUSINESS_PARTNER_PERMISSIONS,
}: UseBusinessPartnerFormOptions = {}) => {
	const navigate = useNavigate();

	const normalizedId = businessPartnerId?.trim() ?? "";
	const isEditMode = Boolean(normalizedId);

	const partnerQuery = useBusinessPartner(
		isEditMode ? normalizedId : undefined,
	);

	const {
		createBusinessPartner,
		updateBusinessPartner,
		isCreating,
		isUpdating,
		createError,
		updateError,
	} = useBusinessPartnerMutations();

	const [form, setForm] = useState<BusinessPartnerFormState>(() => ({
		...EMPTY_BUSINESS_PARTNER_FORM,
	}));

	const [initializedPartnerId, setInitializedPartnerId] = useState<
		string | null
	>(null);

	const [validationError, setValidationError] = useState<string | null>(null);

	useEffect(() => {
		const partner = partnerQuery.data;

		if (!partner || initializedPartnerId === partner.id) {
			return;
		}

		setForm(mapBusinessPartnerToForm(partner));
		setInitializedPartnerId(partner.id);
	}, [initializedPartnerId, partnerQuery.data]);

	const handleChange = useCallback(
		<K extends keyof BusinessPartnerFormState>(
			key: K,
			value: BusinessPartnerFormState[K],
		) => {
			setValidationError(null);

			setForm((current) => ({
				...current,
				[key]: value,
			}));
		},
		[],
	);

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
				form.bpType,
			),
		[form],
	);

	const handleSubmit = useCallback(async () => {
		if (!canSubmit || isSaving) {
			return;
		}

		try {
			setValidationError(null);

			const payload = mapBusinessPartnerFormToPayload(form);

			const savedPartner = isEditMode
				? await updateBusinessPartner({
						businessPartnerId: normalizedId,
						payload,
					})
				: await createBusinessPartner(payload);

			navigate(`/business-partners/${savedPartner.id}`);
		} catch (error) {
			setValidationError(getErrorMessage(error));
		}
	}, [
		canSubmit,
		createBusinessPartner,
		form,
		isEditMode,
		isSaving,
		navigate,
		normalizedId,
		updateBusinessPartner,
	]);

	const handleCancel = useCallback(() => {
		if (isEditMode) {
			navigate(`/business-partners/${normalizedId}`);
			return;
		}

		navigate("/business-partners");
	}, [isEditMode, navigate, normalizedId]);

	const mutationError = isEditMode ? updateError : createError;

	const error =
		validationError ?? (mutationError ? getErrorMessage(mutationError) : null);

	return {
		form,
		isEditMode,
		isLoading: isEditMode && partnerQuery.isLoading,
		isError: isEditMode && partnerQuery.isError,
		isSaving,
		isFormValid,
		canSubmit,
		error,

		handleChange,
		handleSubmit,
		handleCancel,
	};
};
