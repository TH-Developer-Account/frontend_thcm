import { type EpcFormValues } from "../../types";

export const validateEpcForm = (values: EpcFormValues) => {
	const errors: Partial<Record<keyof EpcFormValues, string>> = {};

	if (!values.department) errors.department = "Department is required";
	if (!values.vertical) errors.vertical = "Vertical is required";
	if (!values.budget_master_id) errors.budget_master_id = "Budget is required";
	if (!values.branch) errors.branch = "Branch is required";
	if (!values.region) errors.region = "Zone is required";
	if (!values.location) errors.location = "Location is required";
	if (!values.event_name) errors.event_name = "Event name is required";
	if (!values.event_from_date) errors.event_from_date = "Start date required";
	if (!values.event_to_date) errors.event_to_date = "End date required";

	if (
		values.event_from_date &&
		values.event_to_date &&
		new Date(values.event_from_date) > new Date(values.event_to_date)
	) {
		errors.event_to_date = "End date must be after start date";
	}

	return errors;
};
