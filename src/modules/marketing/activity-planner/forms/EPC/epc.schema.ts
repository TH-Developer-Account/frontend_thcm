import type { EpcFormValues } from "../../types/epc.types";

export type EpcFormErrors = Partial<Record<keyof EpcFormValues, string>>;

export const validateEpcForm = (values: EpcFormValues): EpcFormErrors => {
	const errors: EpcFormErrors = {};

	if (!values.department) {
		errors.department = "Department is required";
	}

	if (!values.region) {
		errors.region = "Region is required";
	}

	if (!values.branch) {
		errors.branch = "Branch is required";
	}

	if (!values.vertical) {
		errors.vertical = "Vertical is required";
	}

	if (!values.event_name) {
		errors.event_name = "Event name is required";
	}

	if (!values.event_from_date) {
		errors.event_from_date = "From date is required";
	}

	if (!values.event_to_date) {
		errors.event_to_date = "To date is required";
	}

	if (!values.location?.trim()) {
		errors.location = "Location is required";
	}

	return errors;
};
