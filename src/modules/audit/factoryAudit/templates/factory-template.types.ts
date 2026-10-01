// modules/audit/factoryAudit/templates/factory-template.types.ts
//
// Factory Audit template contracts — separate from Dealer Audit because
// the tables differ (plant / audit area / severity instead of facility
// type / function / category). Shares only the builder form shape.
//
// ASSUMPTION: provisional names until the Factory Audit API contract lands.

import type { TemplateLifecycleStatus } from "../../shared/templates/audit.template.types";

export type FactoryPlantType = "ASSEMBLY" | "FABRICATION" | "PAINT_SHOP";
export type FactoryFindingSeverity = "MAJOR" | "MINOR" | "OBSERVATION";

export interface FactoryScoreLevelResponse {
	score: number;
	description: string;
}

export interface FactoryChecklistItemResponse {
	item_id: string;
	order_no: number;
	check_point: string;
	method_of_check: string | null;
	process_area: string | null;
	severity: FactoryFindingSeverity | null;
	scored: boolean;
	rubric: FactoryScoreLevelResponse[] | null;
	photo_mandatory: boolean;
	photo_min: number | null;
	photo_max: number | null;
}

export interface FactoryChecklistGroupResponse {
	group_id: string;
	order_no: number;
	group_name: string;
	items: FactoryChecklistItemResponse[] | null;
}

export interface FactoryChecklistTemplateResponse {
	template_id: string;
	title: string;
	remarks: string | null;
	plant_type: FactoryPlantType | null;
	audit_area: string | null;
	state: TemplateLifecycleStatus;
	revision: number;
	modified_on: string | null;
	groups: FactoryChecklistGroupResponse[] | null;
}

export interface FactoryChecklistItemPayload {
	item_id?: string;
	order_no: number;
	check_point: string;
	method_of_check: string | null;
	process_area: string | null;
	severity: FactoryFindingSeverity | null;
	scored: boolean;
	rubric: FactoryScoreLevelResponse[];
	photo_mandatory: boolean;
	photo_min: number | null;
	photo_max: number | null;
}

export interface FactoryChecklistGroupPayload {
	group_id?: string;
	order_no: number;
	group_name: string;
	items: FactoryChecklistItemPayload[];
}

export interface SaveFactoryChecklistTemplatePayload {
	title: string;
	remarks: string | null;
	plant_type: FactoryPlantType | null;
	audit_area: string | null;
	groups: FactoryChecklistGroupPayload[];
	revision?: number;
}
