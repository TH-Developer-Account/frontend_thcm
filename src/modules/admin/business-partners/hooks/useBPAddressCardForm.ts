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
	mapAddressToAddressCardForm,
} from "../utils/businessPartner.mapper";
import { focusFirstInvalidField } from "../utils/focusFirstInvalidField";
import type { BPAddressViewModel } from "../utils/bp.types";

import { useBusinessPartnerAddressMutations } from "./useBusinessPartnerMutations";

const copy = businessPartnerContent.address;

type UseBPAddressCardFormOptions = {
	businessPartnerId: string;
	/** Present => edit this existing address. Omit to create a new one. */
	address?: BPAddressViewModel;
	/** Create-only: the first address a BP gets defaults to being its default address. */
	hasExistingAddresses?: boolean;
	onSaved?: () => void;
};

export const useBPAddressCardForm = ({
	businessPartnerId,
	address,
	hasExistingAddresses = false,
	onSaved,
}: UseBPAddressCardFormOptions) => {
	const { showToast } = useToast();
	const formRef = useRef<HTMLFormElement>(null);

	const isEditMode = Boolean(address);

	const defaultValues = () =>
		address
			? mapAddressToAddressCardForm(address)
			: createEmptyAddressCardForm(!hasExistingAddresses);

	const { createAddress, updateAddress, isCreatingAddress, isUpdatingAddress } =
		useBusinessPartnerAddressMutations(businessPartnerId);

	const form = useForm<BPAddressCardFormValues>({
		resolver: zodResolver(bpAddressSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: defaultValues(),
		shouldFocusError: false,
	});

	const onValid = async (values: BPAddressCardFormValues) => {
		try {
			if (address) {
				await updateAddress({
					addressId: address.id,
					payload: mapAddressCardFormToPayload(values),
				});
			} else {
				await createAddress(mapAddressCardFormToPayload(values));

				// A just-saved address means the BP now has one, so the next
				// form no longer defaults to "set as default".
				form.reset(createEmptyAddressCardForm(false));
			}

			// Success/error toasts are owned by useBusinessPartnerAddressMutations.
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
		form.reset(defaultValues());
	};

	return {
		form,
		formRef,
		isEditMode,
		isSaving:
			isCreatingAddress || isUpdatingAddress || form.formState.isSubmitting,
		onSubmit: form.handleSubmit(onValid, onInvalid),
		reset,
	};
};
