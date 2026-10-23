export type MasterType =
  | "department"
  | "branch"
  | "eventName"
  | "budgetMaster"
  | "division"
  | "designation"
  | "costCenter"
  | "userRegion"
  | "zone";

export type MasterAction = "create" | "update";

// "Regions" is intentionally not a MasterName — Region was merged into Zone
// (same table now; see schema.prisma's Zone model comment), so managing it
// here as a separate screen alongside "Zones" would just be two UIs over
// the same data. "Zones" is the one screen for it.
export type MasterName =
  | "Branches"
  | "Departments"
  | "Event Names"
  | "Budget"
  | "Divisions"
  | "Designations"
  | "Cost Centers"
  | "Locations"
  | "Zones";

export type MasterDataKey =
  | "branches"
  | "departments"
  | "eventNames"
  | "budgetMasters"
  | "divisions"
  | "designations"
  | "costCenters"
  | "locations"
  | "zones";

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
  // Locations: User.location's master (EOR's "Location" column — a plant/
  // city, NOT the same concept as Zones below, which is EventProposal's
  // business-region/sales-territory master). Zones: code+name, like Cost
  // Centers — region_code is unique and required on the Zone model.
  locations: MasterOption[];
  zones: MasterOption[];
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
    // Only division/designation/costCenter/userRegion/zone use this —
    // they're modeled with a real `isActive` boolean column (see
    // schema.prisma), unlike department/branch/eventName/
    // budgetMaster's `status` field.
    isActive?: boolean;
  };
}

export interface ManageMasterResponse<T = unknown> {
  message: string;
  data: T;
}
