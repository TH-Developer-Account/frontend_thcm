import type { EpcFormValues } from "../../../types";
import { toPrismaDateTime } from "../../../../../utils/format";

export const buildEpcCreatePayload = (
	values: EpcFormValues,
	status: "DRAFT" | "SUBMITTED",
) => {
	const proposalNumber = values.proposal_number || values.epfNo;

	return {
		...values,
		epfNo: proposalNumber,
		proposal_number: proposalNumber,
		status,

		event_from_date: toPrismaDateTime(values.event_from_date),
		event_to_date: toPrismaDateTime(values.event_to_date),
	};
};

export const buildEpcUpdatePayload = (
	values: EpcFormValues,
	status: "DRAFT" | "SUBMITTED",
) => {
	const proposalNumber = values.proposal_number || values.epfNo;

	return {
		proposal_number: proposalNumber,

		department_id: values.department,
		region_id: values.region,
		branch_id: values.branch,
		budget_master_id: values.budget_master_id,
		vertical_id: values.vertical,
		event_name_id: values.event_name,

		event_scale: values.event_scale ? Number(values.event_scale) : 0,
		event_description: values.event_description,
		event_from_date: toPrismaDateTime(values.event_from_date),
		event_to_date: toPrismaDateTime(values.event_to_date),
		location: values.location,
		event_objective: values.event_objective,
		status,
	};
};
