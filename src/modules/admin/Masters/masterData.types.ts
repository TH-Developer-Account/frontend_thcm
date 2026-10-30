export type MasterType =
	| "department"
	| "branch"
	| "eventName"
	| "budgetMaster"
	| "division"
	| "designation"
	| "costCenter"
	| "zone"
	| "gradeEligibility";

export type MasterAction = "create" | "update";

// "Regions" is intentionally not a MasterName — Region was merged into Zone
// (same table now; see schema.prisma's Zone model comment), so managing it
// here as a separate screen alongside "Zones" would just be two UIs over
// the same data. "Zones" is the one screen for it.
//
// "Locations" used to be here too (backed by a UserRegion master) — removed
// when User.location went back to being plain free text instead of a
// master-backed FK, since real-world location values vary too much to
// constrain to a fixed list. See decisions-and-learnings.md.
export type MasterName =
	| "Branches"
	| "Departments"
	| "Event Names"
	| "Budget"
	| "Divisions"
	| "Designations"
	| "Cost Centers"
	| "Zones"
	| "Grade Eligibility";

export type MasterDataKey =
	| "branches"
	| "departments"
	| "eventNames"
	| "budgetMasters"
	| "divisions"
	| "designations"
	| "costCenters"
	| "zones"
	| "gradeEligibilities";

export interface MasterOption {
	value: string;
	label: string;
	code?: string;
	description?: string;
	id_desc?: string;
	budgetAmount?: number | string;
	fiscalYear?: string;
	// Grade Eligibility only: yearly cap for the grade (label = the grade).
	// A Prisma Decimal serializes as a string, hence number | string.
	annualCap?: number | string;
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
	annualCap?: number | string;
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
	// Bridge field for other-module read consumers (e.g. EPCTopbar) that
	// still read `data.regions` — sourced from the same Zone query as
	// `zones` below, not a separate master. Not surfaced as a MasterName in
	// this admin screen; see the MasterName comment above.
	regions: MasterOption[];
	branches: MasterOption[];
	eventNames: MasterOption[];
	budgetMasters: BudgetMasterOption[];
	vertical: VerticalOption[];
	// Divisions/Designations: name-only lookups (no code in the source data).
	// Cost Centers: MasterOption's `code` carries EOR's numeric Cost Center
	// code, `label` carries its name — same shape departments/branches
	// already use for their code+name pair.
	divisions: MasterOption[];
	designations: MasterOption[];
	costCenters: MasterOption[];
	// Zones: code+name, like Cost Centers — region_code is unique and
	// required on the Zone model.
	zones: MasterOption[];
	// Grade Eligibility: `label` is the grade, `annualCap` its yearly cap.
	// Only the cap is editable from the admin screen.
	gradeEligibilities: MasterOption[];
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
		// Only division/designation/costCenter/zone use this — they're
		// modeled with a real `isActive` boolean column (see schema.prisma),
		// unlike department/branch/eventName/budgetMaster's `status` field.
		isActive?: boolean;
		// gradeEligibility: the only editable field.
		annualCap?: number;
	};
}

export interface ManageMasterResponse<T = unknown> {
	message: string;
	data: T;
}
