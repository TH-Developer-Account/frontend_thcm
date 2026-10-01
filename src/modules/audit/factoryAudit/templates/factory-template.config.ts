// modules/audit/factoryAudit/templates/factory-template.config.ts
//
// Factory Audit plugs different fields into the SAME shared builder.

import type { AuditTemplateFieldConfig } from "../../shared/templates/audit.template.types";
import type {
	FactoryFindingSeverity,
	FactoryPlantType,
} from "./factory-template.types";

export const FACTORY_PLANT_TYPE_OPTIONS: ReadonlyArray<{
	value: FactoryPlantType;
	label: string;
}> = [
	{ value: "ASSEMBLY", label: "Assembly" },
	{ value: "FABRICATION", label: "Fabrication" },
	{ value: "PAINT_SHOP", label: "Paint shop" },
];

export const FACTORY_SEVERITY_OPTIONS: ReadonlyArray<{
	value: FactoryFindingSeverity;
	label: string;
}> = [
	{ value: "MAJOR", label: "Major" },
	{ value: "MINOR", label: "Minor" },
	{ value: "OBSERVATION", label: "Observation" },
];

export const FACTORY_DETAIL_FIELD_KEYS = {
	plantType: "plantType",
	auditArea: "auditArea",
} as const;

export const FACTORY_PARAMETER_FIELD_KEYS = {
	processArea: "processArea",
	severity: "severity",
} as const;

export const FACTORY_TEMPLATE_DETAIL_FIELDS: readonly AuditTemplateFieldConfig[] = [
	{
		type: "select",
		key: FACTORY_DETAIL_FIELD_KEYS.plantType,
		label: "Plant type",
		required: true,
		options: FACTORY_PLANT_TYPE_OPTIONS,
	},
	{
		type: "text",
		key: FACTORY_DETAIL_FIELD_KEYS.auditArea,
		label: "Audit area",
		placeholder: "e.g. Boom welding line",
		maxLength: 80,
	},
];

export const FACTORY_TEMPLATE_PARAMETER_FIELDS: readonly AuditTemplateFieldConfig[] =
	[
		{
			type: "text",
			key: FACTORY_PARAMETER_FIELD_KEYS.processArea,
			label: "Process area",
			maxLength: 80,
		},
		{
			type: "select",
			key: FACTORY_PARAMETER_FIELD_KEYS.severity,
			label: "Severity if non-compliant",
			required: true,
			options: FACTORY_SEVERITY_OPTIONS,
		},
	];
