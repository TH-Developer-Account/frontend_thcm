import type { UserProfileFormValues } from "./userProfile.schema";
import type { UpdateCurrentUserPayload } from "./userProfile.api";

/*
 * Form values -> PATCH /users/me payload. Sanitization lives here, at the
 * API boundary. Only the five self-editable fields are sent; email and any
 * other locked value can never leak into the request.
 */
export const mapProfileFormToPayload = (
	values: UserProfileFormValues,
): UpdateCurrentUserPayload => ({
	first_name: values.firstName.trim(),
	last_name: values.lastName.trim(),
	phone_number: values.phone.replace(/\D/g, ""),
	designation: values.designation.trim(),
	department: values.department.trim(),
});
