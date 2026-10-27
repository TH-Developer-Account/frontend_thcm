import type { UserProfileFormValues } from "./userProfile.schema";
import type { UpdateCurrentUserPayload } from "./userProfile.api";

export const mapProfileFormToPayload = (
	values: UserProfileFormValues,
): UpdateCurrentUserPayload => ({
	first_name: values.firstName.trim(),
	last_name: values.lastName.trim(),
	phone_number: values.phone.replace(/\D/g, ""),
	designationId: values.designationId.trim(),
	department: values.department.trim(),
});
