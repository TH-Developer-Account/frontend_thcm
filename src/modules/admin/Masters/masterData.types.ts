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
	label: string;
	code?: string;
	description?: string;
	id_desc?: string;
	budgetAmount?: number | string;
	fiscalYear?: string;
	[key: string]: unknown;
}

export interface BudgetMasterOption extends MasterOption {
	budgetAmount?: number | string;
	fiscalYear?: string;
}

export type MasterItem = {
	id: string;
	name?: string;
	code?: string;
	description?: string;
	budgetAmount?: number | string;
	fiscalYear?: string;
};

export interface VerticalOption {
	value: string;
	label: string;
	code?: string;
	department: string;
	[key: string]: unknown;
}

export interface MasterDataResponse {
	departments: MasterOption[];
	regions: MasterOption[];
	branches: MasterOption[];
	eventNames: MasterOption[];
	budgetMasters: BudgetMasterOption[];
	vertical: VerticalOption[];
}

export interface ManageMasterPayload {
	type: MasterType;
	action: MasterAction;
	data: {
		id?: string;
		name?: string;
		code?: string;
		fiscal_year?: string;
		id_desc?: string;
		value?: number;
	};
}

export interface ManageMasterResponse<T = unknown> {
	message: string;
	data: T;
}
