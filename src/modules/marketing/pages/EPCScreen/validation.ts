import { type EpcFormValues } from "./types";

export const validateEpcForm = (values: EpcFormValues) => {
	const errors: Partial<Record<keyof EpcFormValues, string>> = {};

	if (!values.department) errors.department = "Department is required";
	if (!values.branch) errors.branch = "Branch is required";
	if (!values.zone) errors.zone = "Zone is required";
	if (!values.eventName) errors.eventName = "Event name is required";
	if (!values.eventFrom) errors.eventFrom = "Start date required";
	if (!values.eventTo) errors.eventTo = "End date required";

	if (
		values.eventFrom &&
		values.eventTo &&
		new Date(values.eventFrom) > new Date(values.eventTo)
	) {
		errors.eventTo = "End date must be after start date";
	}

	return errors;
};
