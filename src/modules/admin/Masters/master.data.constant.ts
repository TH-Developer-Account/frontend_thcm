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
	"Grade Eligibility",
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
	"Grade Eligibility": "gradeEligibilities",
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
	"Grade Eligibility": "gradeEligibility",
};

// Masters whose rows can only be edited, never created, from the Masters UI
// (the backend handleCreate has no case for them). The "add" row is hidden.
export const EDIT_ONLY_MASTERS: MasterName[] = ["Grade Eligibility"];
