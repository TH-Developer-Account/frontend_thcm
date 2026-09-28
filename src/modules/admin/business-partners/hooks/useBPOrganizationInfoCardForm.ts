import { useEffect, useMemo, useRef, useState } from "react";
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
	BP_ORGANIZATION_INFO_FIELD_ORDER,
	bpOrganizationInfoSchema,
	type BPOrganizationInfoFormValues,
} from "../utils/businessPartner.schema";
import {
	EMPTY_BP_ORGANIZATION_INFO_FORM,
	mapOrganizationInfoFormToCreatePayload,
	mapOrganizationInfoFormToUpdatePayload,
	mapPartnerToOrganizationInfoForm,
} from "../utils/businessPartner.mapper";
import type { BusinessPartnerDetail } from "../utils/bp.types";
import { focusFirstInvalidField } from "../utils/focusFirstInvalidField";

import { businessPartnerPaths } from "../utils/businessPartner.paths";
import { useBusinessPartnerMutations } from "./useBusinessPartnerMutations";

// Reusing the existing "general" copy block for toasts/actions — it already
// covers create + update + invalid + unexpected, and this card now owns
// everything that copy was written for (bpName/bpType/officeType, plus the
// rest of Organization). Not introducing a new businessPartnerContent.organization
// block — that content-extraction work is out of scope for this change.
const copy = businessPartnerContent.general;

/**
 * Maps the createBusinessPartner controller's own 400 messages to a field.
 * Patterns target the controller's exact wording ("A valid officeType ... is
 * required"), and 5xx bodies are never attached to a field — they can contain
 * the whole request payload, which is what matched "officeType" before.
 */
const SERVER_FIELD_HINTS: Array<{
	pattern: RegExp;
	field: keyof BPOrganizationInfoFormValues;
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

type UseBPOrganizationInfoCardFormOptions = {
	/** null => create mode. */
	partner: BusinessPartnerDetail | null;
	/** Create-only: `?parentId=` from the "Add Branch" action. */
	parentIdFromQuery?: string;
	/** Create-only: the loaded parent BP, used to prefill name fields once. */
	parentPartner?: BusinessPartnerDetail | null;
	canSubmit: boolean;
	/**
	 * BPTabs' Organization tab: renders read-only (mode="view") until the
	 * user clicks Edit, and returns to view mode after Cancel or a
	 * successful save, instead of the create/edit page's always-editable
	 * card.
	 */
	allowViewToggle?: boolean;
	/**
	 * Organization tab only: opens straight into edit mode on first load
	 * when the tab has no organization data yet. Mirrors the old auto-open
	 * behavior BPTabs used to drive through useBusinessPartnerForm.
	 */
	startInEditMode?: boolean;
};

export const useBPOrganizationInfoCardForm = ({
	partner,
	parentIdFromQuery = "",
	parentPartner = null,
	canSubmit,
	allowViewToggle = false,
	startInEditMode = false,
}: UseBPOrganizationInfoCardFormOptions) => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const formRef = useRef<HTMLFormElement>(null);

	const isCreateMode = !partner;
	const isBranchFromParent = isCreateMode && Boolean(parentIdFromQuery);

	// Card starts read-only only when it supports the toggle (BPTabs'
	// Organization tab) — the create/edit page (allowViewToggle false) is
	// always editable, same as the old General card.
	const [isEditing, setIsEditing] = useState(
		allowViewToggle ? startInEditMode : true,
	);

	const {
		createBusinessPartner,
		updateBusinessPartner,
		isCreating,
		isUpdating,
	} = useBusinessPartnerMutations();

	// The page remounts this card (via `key`) when the partner id changes, so
	// computing defaults once per mount is enough.
	const defaultValues = useMemo<BPOrganizationInfoFormValues>(() => {
		if (partner) return mapPartnerToOrganizationInfoForm(partner);

		return isBranchFromParent
			? {
					...EMPTY_BP_ORGANIZATION_INFO_FORM,
					officeType: "BRANCH_OFFICE",
					parentId: parentIdFromQuery,
				}
			: { ...EMPTY_BP_ORGANIZATION_INFO_FORM };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const form = useForm<BPOrganizationInfoFormValues>({
		resolver: zodResolver(bpOrganizationInfoSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues,
		// Shared inputs don't forward refs; focusing is handled in onInvalid.
		shouldFocusError: false,
	});

	// ---------------------------------------------------------------------------
	// Branch prefill — copy the parent's names once it loads, never
	// overwriting anything the user has already typed (existing behavior,
	// carried over from the retired General card).
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

	const onValid = async (values: BPOrganizationInfoFormValues) => {
		if (!canSubmit) return;

		try {
			if (!partner) {
				const createdPartner = await createBusinessPartner(
					mapOrganizationInfoFormToCreatePayload(values),
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
				payload: mapOrganizationInfoFormToUpdatePayload(values),
			});

			showToast({
				type: "success",
				title: copy.toasts.updatedTitle,
				description: copy.toasts.updatedDescription,
			});

			// Submitted values become the new baseline for Cancel / isDirty.
			form.reset(values);

			if (allowViewToggle) {
				setIsEditing(false);
			}
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

	const onInvalid = (errors: FieldErrors<BPOrganizationInfoFormValues>) => {
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
			BP_ORGANIZATION_INFO_FIELD_ORDER,
		);
	};

	const handleCancel = () => {
		if (allowViewToggle) {
			form.reset(defaultValues);
			setIsEditing(false);
			return;
		}

		if (isCreateMode) {
			navigate(businessPartnerPaths.list());
			return;
		}

		form.reset(defaultValues);
	};

	const startEditing = () => setIsEditing(true);

	return {
		form,
		formRef,
		isCreateMode,
		isBranchFromParent,
		isSaving: isCreating || isUpdating || form.formState.isSubmitting,
		canSubmit,
		onSubmit: form.handleSubmit(onValid, onInvalid),
		handleCancel,

		allowViewToggle,
		isEditing,
		startEditing,
	};
};
