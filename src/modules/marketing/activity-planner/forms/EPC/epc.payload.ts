import type {
	EpcCreatePayload,
	EpcFormValues,
	EpcUpdatePayload,
} from "../../types/epc.types";

const toNumber = (value: unknown, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export const buildEpcCreatePayload = (
	values: EpcFormValues,
	status: "DRAFT" | "SUBMITTED",
): EpcCreatePayload => {
	const proposalNumber = values.proposal_number || values.epfNo;

	return {
		...values,
		epfNo: proposalNumber,
		proposal_number: proposalNumber,
		status,
		event_scale: toNumber(values.event_scale),
	};
};

export const buildEpcUpdatePayload = (
	values: EpcFormValues,
	status: "DRAFT" | "SUBMITTED",
): EpcUpdatePayload => {
	const proposalNumber = values.proposal_number || values.epfNo;

	return {
		proposal_number: proposalNumber,

		department_id: values.department,
		region_id: values.region,
		branch_id: values.branch,
		budget_master_id: values.budget_master_id,
		vertical_id: values.vertical,
		event_name_id: values.event_name,

		event_scale: toNumber(values.event_scale),
		event_description: values.event_description,
		event_from_date: values.event_from_date,
		event_to_date: values.event_to_date,
		location: values.location,
		event_objective: values.event_objective,

		status,
	};
};
