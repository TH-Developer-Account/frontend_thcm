import type { FieldErrors, FieldValues } from "react-hook-form";

import { focusFirstInvalidField as focusFirstInvalidFieldShared } from "../../../../utils/focusField";

/**
 * Kept for existing Business Partner callers (same signature as before).
 * The implementation now lives in src/utils/focusField.ts so every module
 * can use it.
 */
export const focusFirstInvalidField = <T extends FieldValues>(
	formElement: HTMLFormElement | null,
	errors: FieldErrors<T>,
	fieldOrder: ReadonlyArray<keyof T & string>,
): void => focusFirstInvalidFieldShared(formElement, errors, fieldOrder);
