/**
 * Shared "take me to the field" helpers for every form.
 *
 * The shared FormInput / SelectInput / DatePickerInput don't forward a ref
 * that RHF's shouldFocusError can use, so fields are found by their `name`
 * attribute, scoped to a container (usually the <form>), so fields with the
 * same name in other cards on the page never collide. react-select renders a
 * hidden input for `name`, so the visible combobox input in the same field
 * wrapper gets focus instead.
 *
 * Generalised from modules/admin/business-partners/utils/focusFirstInvalidField.ts,
 * which now re-exports from here.
 */

type ErrorBag = Record<string, unknown>;

const cssEscape = (value: string): string =>
	typeof CSS !== "undefined" && typeof CSS.escape === "function"
		? CSS.escape(value)
		: value.replace(/["\\]/g, "\\$&");

const prefersReducedMotion = (): boolean =>
	typeof window !== "undefined" &&
	window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/** Scrolls to and focuses the field with this `name` (or id). Returns false if not found. */
export const focusFieldByName = (
	scope: ParentNode | null | undefined,
	name: string,
): boolean => {
	const root: ParentNode | null =
		scope ?? (typeof document !== "undefined" ? document : null);
	if (!root) return false;

	const escaped = cssEscape(name);
	const namedElement =
		root.querySelector<HTMLElement>(`[name="${escaped}"]`) ??
		root.querySelector<HTMLElement>(`#${escaped}`);

	if (!namedElement) return false;

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

	wrapper.scrollIntoView({
		behavior: prefersReducedMotion() ? "auto" : "smooth",
		block: "center",
	});
	focusTarget?.focus({ preventScroll: true });

	return true;
};

/**
 * Focuses the first field in `fieldOrder` that has an error. Falls back to
 * scrolling the container into view when nothing matches.
 * Signature matches the original Business Partner helper.
 */
export const focusFirstInvalidField = (
	formElement: HTMLElement | null,
	errors: unknown,
	fieldOrder: ReadonlyArray<string>,
): void => {
	if (!formElement) return;

	const bag = errors as ErrorBag;
	const firstInvalid = fieldOrder.find((name) => Boolean(bag[name]));

	if (firstInvalid && focusFieldByName(formElement, firstInvalid)) return;

	formElement.scrollIntoView({
		behavior: prefersReducedMotion() ? "auto" : "smooth",
		block: "start",
	});
};

/**
 * Flattens a react-hook-form `FieldErrors` object (or a plain
 * { field: "message" } record) into [{ name, message }] using dot paths,
 * e.g. "items.0.amount". Order follows the error object.
 */
export const flattenFieldErrors = (
	errors: unknown,
	prefix = "",
): Array<{ name: string; message: string }> => {
	if (!errors || typeof errors !== "object") return [];

	const out: Array<{ name: string; message: string }> = [];

	for (const [key, value] of Object.entries(errors as ErrorBag)) {
		if (key === "ref" || key === "type" || key === "types") continue;
		const path = prefix ? `${prefix}.${key}` : key;

		if (typeof value === "string") {
			if (value) out.push({ name: path, message: value });
			continue;
		}

		if (value && typeof value === "object") {
			const message = (value as { message?: unknown }).message;
			if (typeof message === "string" && message) {
				out.push({ name: path, message });
			} else {
				out.push(...flattenFieldErrors(value, path));
			}
		}
	}

	return out;
};
