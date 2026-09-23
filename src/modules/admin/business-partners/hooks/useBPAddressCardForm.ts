import { useRef } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { businessPartnerContent } from "../../../../content/businessPartner.content";
import { useToast } from "../../../../context/Auth/AuthContext";

import {
	BP_ADDRESS_FIELD_ORDER,
	bpAddressSchema,
	type BPAddressCardFormValues,
} from "../utils/businessPartner.schema";
import {
	createEmptyAddressCardForm,
	mapAddressCardFormToPayload,
} from "../utils/businessPartner.mapper";
import { focusFirstInvalidField } from "../utils/focusFirstInvalidField";

import { useBusinessPartnerAddressMutations } from "./useBusinessPartnerMutations";

const copy = businessPartnerContent.address;

type UseBPAddressCardFormOptions = {
	businessPartnerId: string;
	/** The first address a BP gets defaults to being its default address. */
	hasExistingAddresses: boolean;
	onSaved?: () => void;
};

export const useBPAddressCardForm = ({
	businessPartnerId,
	hasExistingAddresses,
	onSaved,
}: UseBPAddressCardFormOptions) => {
	const { showToast } = useToast();
	const formRef = useRef<HTMLFormElement>(null);

	const { createAddress, isCreatingAddress } =
		useBusinessPartnerAddressMutations(businessPartnerId);

	const form = useForm<BPAddressCardFormValues>({
		resolver: zodResolver(bpAddressSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: createEmptyAddressCardForm(!hasExistingAddresses),
		shouldFocusError: false,
	});

	const onValid = async (values: BPAddressCardFormValues) => {
		try {
			await createAddress(mapAddressCardFormToPayload(values));

			// Success/error toasts are owned by useBusinessPartnerAddressMutations.
			// A just-saved address means the BP now has one, so the next form
			// no longer defaults to "set as default".
			form.reset(createEmptyAddressCardForm(false));
			onSaved?.();
		} catch {
			// Mutation already toasted the API error — keep the form open and
			// filled so the user can retry.
		}
	};

	const onInvalid = (errors: FieldErrors<BPAddressCardFormValues>) => {
		showToast({
			type: "error",
			title: copy.toasts.invalidTitle,
			description: copy.toasts.invalidDescription,
		});

		focusFirstInvalidField(formRef.current, errors, BP_ADDRESS_FIELD_ORDER);
	};

	const reset = () => {
		form.reset(createEmptyAddressCardForm(!hasExistingAddresses));
	};

	return {
		form,
		formRef,
		isSaving: isCreatingAddress || form.formState.isSubmitting,
		onSubmit: form.handleSubmit(onValid, onInvalid),
		reset,
	};
};
