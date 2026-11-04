import type { MasterDataKey, MasterName, MasterType } from "./masterData.types";

export const DEFAULT_MASTER: MasterName = "Branches";

export const MASTER_NAMES: MasterName[] = [
  "Branches",
  "Departments",
  "Event Names",
  "Budget",
  "Divisions",
  "Designations",
  "Cost Centers",
  "Zones",
];

export const MASTER_KEYS: Record<MasterName, MasterDataKey> = {
  Branches: "branches",
  Departments: "departments",
  "Event Names": "eventNames",
  Budget: "budgetMasters",
  Divisions: "divisions",
  Designations: "designations",
  "Cost Centers": "costCenters",
  Zones: "zones",
};

export const MASTER_TYPES: Record<MasterName, MasterType> = {
  Branches: "branch",
  Departments: "department",
  "Event Names": "eventName",
  Budget: "budgetMaster",
  Divisions: "division",
  Designations: "designation",
  "Cost Centers": "costCenter",
  Zones: "zone",
};
