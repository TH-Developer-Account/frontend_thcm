// modules/audit/dealerAudit/templates/dealer-template.config.ts
//
// Dealer Audit's field configuration for the shared template builder.
// Add / remove a dropdown option here — the builder UI, zod validation,
// preview and listing columns pick it up automatically.
//
// Function and Category are plain text on the server: the option `value`
// IS the text that is stored, so keep values human-readable and stable
// (renaming one does not rename rows that are already saved).

import type { AuditTemplateSelectFieldConfig } from "../../shared/templates/audit.template.types";
import type { DealerFacilityType } from "./dealer-template.types";

export const DEALER_FACILITY_TYPE_OPTIONS: ReadonlyArray<{
	value: DealerFacilityType;
	label: string;
}> = [
	{ value: "HEAD_OFFICE", label: "Head Office" },
	{ value: "BRANCH_OFFICE", label: "Branch Office" },
];

export const DEALER_PARAMETER_FUNCTION_OPTIONS: ReadonlyArray<{
	value: string;
	label: string;
}> = [
	{ value: "Common", label: "Common" },
	{ value: "Sales", label: "Sales" },
	{ value: "Service", label: "Service" },
	{ value: "Parts", label: "Parts" },
];

export const DEALER_PARAMETER_CATEGORY_OPTIONS: ReadonlyArray<{
	value: string;
	label: string;
}> = [
	{ value: "Infra", label: "Infra" },
	{ value: "Process", label: "Process" },
];

/** Keys used in AuditTemplateDetailsFormValues.fields */
export const DEALER_DETAIL_FIELD_KEYS = {
	facilityType: "facilityType",
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
