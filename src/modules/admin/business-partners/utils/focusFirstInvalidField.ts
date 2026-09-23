import type { FieldErrors, FieldValues } from "react-hook-form";

/**
 * Focuses (or at least scrolls to) the first invalid field inside a card's
 * <form>, in visual order.
 *
 * RHF's built-in shouldFocusError needs a ref on each input, which the shared
 * FormInput / SelectInput / DatePickerInput components don't forward. Instead
 * we look the field up by its `name` attribute, scoped to this card's form so
 * identically-named fields in other cards on the same page never collide.
 * react-select renders a hidden input for `name`, so for those we focus the
 * visible combobox input in the same field wrapper instead.
 */
export const focusFirstInvalidField = <T extends FieldValues>(
	formElement: HTMLFormElement | null,
	errors: FieldErrors<T>,
	fieldOrder: ReadonlyArray<keyof T & string>,
): void => {
	if (!formElement) return;

	const firstInvalid = fieldOrder.find((name) => Boolean(errors[name]));

	if (!firstInvalid) {
		formElement.scrollIntoView({ behavior: "smooth", block: "start" });
		return;
	}

	const namedElement = formElement.querySelector<HTMLElement>(
		`[name="${firstInvalid}"]`,
	);

	if (!namedElement) {
		formElement.scrollIntoView({ behavior: "smooth", block: "start" });
		return;
	}

	const wrapper =
		namedElement.closest<HTMLElement>(".form-field") ??
		namedElement.parentElement ??
		namedElement;

	const focusTarget =
		namedElement instanceof HTMLInputElement && namedElement.type === "hidden"
			? wrapper.querySelector<HTMLElement>(
					"input:not([type='hidden']), textarea, button",
				)
			: namedElement;

	wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
	focusTarget?.focus({ preventScroll: true });
};
