import type { EpcDetailResponse, EpcFormValues } from "../../types/epc.types";

export const mapEpcDetailToFormValues = (
	data?: EpcDetailResponse | null,
): Partial<EpcFormValues> => {
	if (!data) return {};

	return {
		epfNo: data.proposal_number,
		proposal_number: data.proposal_number,
		department: data.department_id,
		region: data.region_id,
		branch: data.branch_id,
		budget_master_id: data.budget_master_id,
		budgetDescription: data.budget_master?.value ?? "",
		vertical: data.vertical_id,
		event_scale: data.event_scale,
		event_name: data.event_name_id,
		event_description: data.event_description ?? "",
		event_from_date: data.event_from_date ?? "",
		event_to_date: data.event_to_date ?? "",
		location: data.location ?? "",
		event_objective: data.event_objective ?? "",
		status: data.status,
	};
};
