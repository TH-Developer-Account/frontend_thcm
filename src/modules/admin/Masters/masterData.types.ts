// Types for the GET /master-data feed response (live — see masterData.api.ts,
// useMasterData.ts). The write-side types (MasterType/ManageMasterPayload and
// the dead Masters-admin screen they backed — MasterName/MasterItem/
// MasterDetailPanel/MasterLineItemTable/master.data.constant/
// master.data.mapper/useManageMasterData) have been removed: that screen was
// superseded by masters.config.ts/masters.types.ts (MasterKey/SaveMasterPayload),
// which is what MastersPage.tsx actually renders and POSTs through.
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

export interface VerticalOption {
  value: string;
  label: string;
  code?: string;
  // Which Division this Vertical belongs to. Was `department` (Department's
  // id) before Vertical moved from a Department FK to a Division FK — see
  // schema.prisma's Vertical model.
  divisionId: string;
  [key: string]: unknown;
}

export interface MasterDataResponse {
  // Bridge field for other-module read consumers (e.g. EPCTopbar) that
  // still read `data.regions` — sourced from the same Zone query as
  // `zones` below, not a separate master.
  regions: MasterOption[];
  branches: MasterOption[];
  eventNames: MasterOption[];
  budgetMasters: BudgetMasterOption[];
  vertical: VerticalOption[];
  // Divisions/Designations: name-only lookups (no code in the source data).
  // Cost Centers: MasterOption's `code` carries EOR's numeric Cost Center
  // code, `label` carries its name — same shape branches already uses for
  // its code+name pair.
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
