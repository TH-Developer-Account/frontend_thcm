import type { MasterDataKey, MasterName, MasterType } from "./masterData.types";

export const DEFAULT_MASTER: MasterName = "Branches";

export const MASTER_NAMES: MasterName[] = [
	"Branches",
	"Departments",
	"Regions",
	"Event Names",
	"Budget",
];

export const MASTER_KEYS: Record<MasterName, MasterDataKey> = {
	Branches: "branches",
	Departments: "departments",
	Regions: "regions",
	"Event Names": "eventNames",
	Budget: "budgetMasters",
};

export const MASTER_TYPES: Record<MasterName, MasterType> = {
	Branches: "branch",
	Departments: "department",
	Regions: "region",
	"Event Names": "eventName",
	Budget: "budgetMaster",
};
