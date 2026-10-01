// modules/audit/dealerAudit/templates/dealer-template.config.ts
//
// Dealer Audit's field configuration for the shared template builder.
// Add / remove a dropdown here — the builder UI, zod validation, preview
// and listing columns pick it up automatically.
//
// ASSUMPTION: options are static until a master-data endpoint exists.
// When it does, build these configs from useMasterData() in the page and
// pass them down — the builder API does not change.

import type { AuditTemplateSelectFieldConfig } from "../../shared/templates/audit.template.types";
import type {
	DealerFacilityType,
	DealerParameterCategory,
	DealerParameterFunction,
} from "./dealer-template.types";

export const DEALER_FACILITY_TYPE_OPTIONS: ReadonlyArray<{
	value: DealerFacilityType;
	label: string;
}> = [
	{ value: "HEAD_OFFICE", label: "Head Office" },
	{ value: "BRANCH_OFFICE", label: "Branch Office" },
];

export const DEALER_AUDIT_CATEGORY_OPTIONS = [
	{ value: "FACILITY", label: "Facility & Infrastructure" },
	{ value: "WORKSHOP", label: "Service Workshop" },
	{ value: "WAREHOUSE", label: "Parts Warehouse" },
	{ value: "SALES", label: "Sales Process" },
	{ value: "SAFETY", label: "Safety & Environment" },
] as const;

export const DEALER_PARAMETER_FUNCTION_OPTIONS: ReadonlyArray<{
	value: DealerParameterFunction;
	label: string;
}> = [
	{ value: "COMMON", label: "Common" },
	{ value: "SALES", label: "Sales" },
	{ value: "SERVICE", label: "Service" },
	{ value: "PARTS", label: "Parts" },
];

export const DEALER_PARAMETER_CATEGORY_OPTIONS: ReadonlyArray<{
	value: DealerParameterCategory;
	label: string;
}> = [
	{ value: "INFRA", label: "Infra" },
	{ value: "PROCESS", label: "Process" },
];

/** Keys used in AuditTemplateDetailsFormValues.fields */
export const DEALER_DETAIL_FIELD_KEYS = {
	facilityType: "facilityType",
	auditCategory: "auditCategory",
} as const;

/** Keys used in AuditTemplateParameterFormValues.attributes */
export const DEALER_PARAMETER_FIELD_KEYS = {
	functionArea: "functionArea",
	category: "category",
} as const;

export const DEALER_TEMPLATE_DETAIL_FIELDS: readonly AuditTemplateSelectFieldConfig[] =
	[
		{
			type: "select",
			key: DEALER_DETAIL_FIELD_KEYS.facilityType,
			label: "Facility type",
			required: true,
			options: DEALER_FACILITY_TYPE_OPTIONS,
			helperText: "Audits for this facility type will use this template.",
		},
		{
			type: "select",
			key: DEALER_DETAIL_FIELD_KEYS.auditCategory,
			label: "Audit category",
			options: DEALER_AUDIT_CATEGORY_OPTIONS,
		},
	];

export const DEALER_TEMPLATE_PARAMETER_FIELDS: readonly AuditTemplateSelectFieldConfig[] =
	[
		{
			type: "select",
			key: DEALER_PARAMETER_FIELD_KEYS.functionArea,
			label: "Function",
			required: true,
			options: DEALER_PARAMETER_FUNCTION_OPTIONS,
		},
		{
			type: "select",
			key: DEALER_PARAMETER_FIELD_KEYS.category,
			label: "Category",
			required: true,
			options: DEALER_PARAMETER_CATEGORY_OPTIONS,
		},
	];
