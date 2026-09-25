import { useMemo, useRef, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import { useToast } from "../../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../../utils/apiError.helper";

import {
	BP_ORGANIZATION_INFO_FIELD_ORDER,
	bpOrganizationInfoSchema,
	type BPOrganizationInfoFormValues,
} from "../utils/businessPartner.schema";
import {
	mapOrganizationInfoFormToUpdatePayload,
	mapPartnerToOrganizationInfoForm,
} from "../utils/businessPartner.mapper";
import type { BusinessPartnerDetail } from "../utils/bp.types";
import { focusFirstInvalidField } from "../utils/focusFirstInvalidField";

import { useBusinessPartnerMutations } from "./useBusinessPartnerMutations";

// TODO: these three strings duplicate the shape of businessPartnerContent's
// other toast copy (see useBPGeneralInfoCardForm.ts) — once
// businessPartnerContent.organization exists, swap these literals for
// copy.toasts.updatedTitle / .updatedDescription / .invalidDescription, per
// the content-extraction pattern.
const TOASTS = {
	updatedTitle: "Saved",
	updatedDescription: "Organization information updated successfully.",
	invalidTitle: "Check the highlighted fields",
	invalidDescription:
		"Some organization details need to be fixed before saving.",
	unexpectedTitle: "Update failed",
	unexpectedDescription: "Unable to update organization information.",
};

type UseBPOrganizationInfoCardFormOptions = {
	partner: BusinessPartnerDetail;
	canSubmit: boolean;
	/**
	 * Opens straight into edit mode — used once, on first load, when the
	 * tab has no organization data yet. Mirrors the old auto-open behavior
	 * BPTabs used to drive through useBusinessPartnerForm.
	 */
	startInEditMode?: boolean;
};

export const useBPOrganizationInfoCardForm = ({
	partner,
	canSubmit,
	startInEditMode = false,
}: UseBPOrganizationInfoCardFormOptions) => {
	const { showToast } = useToast();
	const formRef = useRef<HTMLFormElement>(null);

	const [isEditing, setIsEditing] = useState(startInEditMode);

	const { updateBusinessPartner, isUpdating } = useBusinessPartnerMutations();

	// The page remounts this card (via `key={partner.id}` in BPTabs) when
	// the partner changes, so computing defaults once per mount is enough —
	// same pattern as useBPGeneralInfoCardForm.
	const defaultValues = useMemo<BPOrganizationInfoFormValues>(
		() => mapPartnerToOrganizationInfoForm(partner),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const form = useForm<BPOrganizationInfoFormValues>({
		resolver: zodResolver(bpOrganizationInfoSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues,
		// Shared inputs don't forward refs; focusing is handled in onInvalid.
		shouldFocusError: false,
	});

	const onValid = async (values: BPOrganizationInfoFormValues) => {
		if (!canSubmit) return;

		try {
			await updateBusinessPartner({
				businessPartnerId: partner.id,
				payload: mapOrganizationInfoFormToUpdatePayload(values),
			});

			showToast({
				type: "success",
				title: TOASTS.updatedTitle,
				description: TOASTS.updatedDescription,
			});

			// Submitted values become the new baseline for Cancel / isDirty.
			form.reset(values);
			setIsEditing(false);
		} catch (error) {
			// API failures are already toasted by useBusinessPartnerMutations'
			// onError — only toast here for a non-API (e.g. mapper) failure,
			// so a failed request doesn't produce two error toasts.
			if (axios.isAxiosError(error)) return;

			showToast({
				type: "error",
				title: TOASTS.unexpectedTitle,
				description: getApiErrorMessage(error, TOASTS.unexpectedDescription),
			});
		}
	};

	const onInvalid = (errors: FieldErrors<BPOrganizationInfoFormValues>) => {
		showToast({
			type: "error",
			title: TOASTS.invalidTitle,
			description: TOASTS.invalidDescription,
		});

		focusFirstInvalidField(
			formRef.current,
			errors,
			BP_ORGANIZATION_INFO_FIELD_ORDER,
		);
	};

	const handleCancel = () => {
		form.reset(defaultValues);
		setIsEditing(false);
	};

	const startEditing = () => setIsEditing(true);

	return {
		form,
		formRef,
		isEditing,
		startEditing,
		handleCancel,
		isSaving: isUpdating || form.formState.isSubmitting,
		canSubmit,
		onSubmit: form.handleSubmit(onValid, onInvalid),
	};
};
