export type MasterStatus = "active" | "inactive";

export type MasterType =
	| "department"
	| "region"
	| "branch"
	| "eventName"
	| "budgetMaster";

export type MasterAction = "create" | "update";

export type MasterName =
	| "Branches"
	| "Departments"
	| "Regions"
	| "Event Names"
	| "Budget";

export type MasterDataKey =
	| "branches"
	| "departments"
	| "regions"
	| "eventNames"
	| "budgetMasters";

export interface MasterOption {
	value: string;
	label?: string;
	name?: string;
	code?: string;
	description?: string;
	id_desc?: string;
	status?: MasterStatus | string;
}

export interface BudgetMasterOption extends MasterOption {
	budgetAmount?: number;
}

export interface VerticalOption {
	value: string;
	label: string;
	code?: string;
	department: string;
}

export interface MasterDataResponse {
	departments: MasterOption[];
	regions: MasterOption[];
	branches: MasterOption[];
	eventNames: MasterOption[];
	budgetMasters: BudgetMasterOption[];
	vertical: VerticalOption[];
}

export interface MasterItem {
	id: string;
	description: string;
	status: MasterStatus;
}

export interface ManageMasterPayload {
	type: MasterType;
	action: MasterAction;
	data: {
		id?: string;
		name?: string;
		code?: string;
		status?: MasterStatus;
		fiscal_year?: string;
		id_desc?: string;
		value?: number;
	};
}

export interface ManageMasterResponse<T = unknown> {
	message: string;
	data: T;
}
