import { useEffect, useMemo, useRef } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
	businessPartnerContent,
	formatBusinessPartnerMessage,
} from "../../../../content/businessPartner.content";
import { useToast } from "../../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../../utils/apiError.helper";

import {
	BP_GENERAL_INFO_FIELD_ORDER,
	bpGeneralInfoSchema,
	type BPGeneralInfoFormValues,
} from "../utils/businessPartner.schema";
import {
	EMPTY_BP_GENERAL_INFO_FORM,
	mapGeneralInfoFormToCreatePayload,
	mapGeneralInfoFormToUpdatePayload,
	mapPartnerToGeneralInfoForm,
} from "../utils/businessPartner.mapper";
import type { BusinessPartnerDetail } from "../utils/bp.types";
import { focusFirstInvalidField } from "../utils/focusFirstInvalidField";

import { businessPartnerPaths } from "./useBusinessPartnerForm";
import { useBusinessPartnerMutations } from "./useBusinessPartnerMutations";

const copy = businessPartnerContent.general;

/**
 * Maps a backend validation message to the input it's about, so the field is
 * highlighted as well as the toast. Only covers the two messages the
 * createBusinessPartner controller is known to send; extend alongside any new
 * backend messages.
 */
/**
 * Maps the createBusinessPartner controller's own 400 messages to a field.
 * Patterns target the controller's exact wording ("A valid officeType ... is
 * required"), and 5xx bodies are never attached to a field — they can contain
 * the whole request payload, which is what matched "officeType" before.
 */
const SERVER_FIELD_HINTS: Array<{
	pattern: RegExp;
	field: keyof BPGeneralInfoFormValues;
	message: string;
}> = [
	{
		pattern: /a valid officeType/i,
		field: "officeType",
		message: businessPartnerContent.validation.officeTypeRequired,
	},
	{
		pattern: /a valid bpType/i,
		field: "bpType",
		message: businessPartnerContent.validation.bpTypeRequired,
	},
];

type UseBPGeneralInfoCardFormOptions = {
	/** null => create mode. */
	partner: BusinessPartnerDetail | null;
	/** Create-only: `?parentId=` from the "Add Branch" action. */
	parentIdFromQuery: string;
	/** Create-only: the loaded parent BP, used to prefill name fields once. */
	parentPartner: BusinessPartnerDetail | null;
	canSubmit: boolean;
};

export const useBPGeneralInfoCardForm = ({
	partner,
	parentIdFromQuery,
	parentPartner,
	canSubmit,
}: UseBPGeneralInfoCardFormOptions) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const formRef = useRef<HTMLFormElement>(null);

	const isCreateMode = !partner;
	const isBranchFromParent = isCreateMode && Boolean(parentIdFromQuery);

	const {
		createBusinessPartner,
		updateBusinessPartner,
		isCreating,
		isUpdating,
	} = useBusinessPartnerMutations();

	// The page remounts this card (via `key`) when the partner id changes, so
	// computing defaults once per mount is enough.
	const defaultValues = useMemo<BPGeneralInfoFormValues>(() => {
		if (partner) return mapPartnerToGeneralInfoForm(partner);

		return isBranchFromParent
			? {
					...EMPTY_BP_GENERAL_INFO_FORM,
					officeType: "BRANCH_OFFICE",
					parentId: parentIdFromQuery,
				}
			: { ...EMPTY_BP_GENERAL_INFO_FORM };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const form = useForm<BPGeneralInfoFormValues>({
		resolver: zodResolver(bpGeneralInfoSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues,
		// Shared inputs don't forward refs; focusing is handled in onInvalid.
		shouldFocusError: false,
	});

	// ---------------------------------------------------------------------------
	// Branch prefill — copy the parent's names once it loads, never
	// overwriting anything the user has already typed (existing behavior).
	// ---------------------------------------------------------------------------

	const prefilledFromParentId = useRef<string | null>(null);

	useEffect(() => {
		if (!isBranchFromParent || !parentPartner) return;
		if (prefilledFromParentId.current === parentPartner.id) return;

		prefilledFromParentId.current = parentPartner.id;

		const { bpName, legalTradeName } = form.getValues();

		if (!bpName.trim()) {
			form.setValue("bpName", parentPartner.bpName ?? "");
		}

		if (!legalTradeName.trim()) {
			form.setValue("legalTradeName", parentPartner.legalTradeName ?? "");
		}
	}, [form, isBranchFromParent, parentPartner]);

	// ---------------------------------------------------------------------------
	// Submit
	// ---------------------------------------------------------------------------

	const applyServerFieldError = (error: unknown) => {
		if (!axios.isAxiosError(error)) return;

		const status = error.response?.status ?? 0;
		if (status < 400 || status >= 500) return;

		const serverMessage = getApiErrorMessage(error, "");
		const hint = SERVER_FIELD_HINTS.find(({ pattern }) =>
			pattern.test(serverMessage),
		);

		if (hint) {
			form.setError(hint.field, { type: "server", message: hint.message });
		}
	};

	const onValid = async (values: BPGeneralInfoFormValues) => {
		if (!canSubmit) return;

		try {
			if (!partner) {
				const createdPartner = await createBusinessPartner(
					mapGeneralInfoFormToCreatePayload(values),
				);

				showToast({
					type: "success",
					title: copy.toasts.createdTitle,
					description: formatBusinessPartnerMessage(
						copy.toasts.createdDescription,
						{ name: createdPartner.bpName || values.bpName },
					),
				});

				// Stay on the card page (now in update mode) so Contact and
				// Address unlock for the freshly created BP. `replace` keeps the
				// back button from returning to an empty create form.
				navigate(businessPartnerPaths.edit(createdPartner.id), {
					replace: true,
				});
				return;
			}

			await updateBusinessPartner({
				businessPartnerId: partner.id,
				payload: mapGeneralInfoFormToUpdatePayload(values),
			});

			showToast({
				type: "success",
				title: copy.toasts.updatedTitle,
				description: copy.toasts.updatedDescription,
			});

			// Submitted values become the new baseline for Cancel / isDirty.
			form.reset(values);
		} catch (error) {
			// API failures are already toasted by useBusinessPartnerMutations'
			// onError — only highlight the field here to avoid a double toast.
			if (axios.isAxiosError(error)) {
				applyServerFieldError(error);
				return;
			}

			showToast({
				type: "error",
				title: copy.toasts.unexpectedTitle,
				description: getApiErrorMessage(
					error,
					copy.toasts.unexpectedDescription,
				),
			});
		}
	};

	const onInvalid = (errors: FieldErrors<BPGeneralInfoFormValues>) => {
		showToast({
			type: "error",
			title: isCreateMode
				? copy.toasts.invalidCreateTitle
				: copy.toasts.invalidUpdateTitle,
			description: copy.toasts.invalidDescription,
		});

		focusFirstInvalidField(
			formRef.current,
			errors,
			BP_GENERAL_INFO_FIELD_ORDER,
		);
	};

	const handleCancel = () => {
		if (isCreateMode) {
			navigate(businessPartnerPaths.list());
			return;
		}

		form.reset();
	};

	return {
		form,
		formRef,
		isCreateMode,
		isBranchFromParent,
		isSaving: isCreating || isUpdating || form.formState.isSubmitting,
		canSubmit,
		onSubmit: form.handleSubmit(onValid, onInvalid),
		handleCancel,
	};
};
