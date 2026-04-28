// EPC Detail / View API Response

import type { ApprovalApiStatus } from "../../../types";

export type ApiDateString = string;

export type EpcDetailResponse = {
	id: string;
	proposal_number: string;
	event_from_date: ApiDateString;
	event_to_date: ApiDateString;
	event_description: string;
	location: string;
	event_objective: string;
	status: ApprovalApiStatus;

	created_by_id: string;
	updated_by_id: string;

	department_id: string;
	region_id: string;
	branch_id: string;
	event_scale: number;
	budget_master_id: string;
	event_name_id: string;
	vertical_id: string;

	created_at: ApiDateString;
	updated_at: ApiDateString;

	department: EpcDepartment;
	vertical: EpcVertical;
	region: EpcRegion;
	branch: EpcBranch;
	event_name: EpcEventName;
	budget_master: EpcBudgetMaster;

	epf?: EpcDetailEpf | null;
	crf?: EpcDetailCrf | null;
	activeWorkflow?: EpcActiveWorkflow | null;
};

export type EpcDepartment = {
	id: string;
	department_name: string;
};

export type EpcVertical = {
	id: string;
	name: string;
	code: string;
};

export type EpcRegion = {
	id: string;
	region_name: string;
};

export type EpcBranch = {
	id: string;
	branch_name: string;
};

export type EpcEventName = {
	id: string;
	title: string;
};

export type EpcBudgetMaster = {
	id: string;
	value: string;
};
