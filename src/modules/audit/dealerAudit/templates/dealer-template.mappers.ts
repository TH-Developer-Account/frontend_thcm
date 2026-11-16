// modules/audit/dealerAudit/templates/dealer-template.mappers.ts
//
// Dealer template shape conversion — the ONLY place that knows both the
// Dealer domain model and the shared builder form shape.
//
//   backend ──▶ domain ──▶ builder form values ──▶ create/update payload
//                (see dealer-template.backend.ts for the first arrow)
//
// Dealer checklists are one flat parameter list. The shared builder still
// holds them as a single hidden section, so:
//   • reading: all parameters go into ONE form section
//   • writing: every section's parameters are flattened into `parameters[]`

import type { ServerFieldError } from "../../shared/audit-error.utils";
import {
	TEMPLATE_DEFAULT_MAX_EVIDENCE,
	TEMPLATE_DEFAULT_MIN_EVIDENCE,
} from "../../shared/templates/audit-template.constants";
import type {
	AuditTemplateBuilderValues,
	AuditTemplateListRow,
	AuditTemplateParameterFormValues,
} from "../../shared/templates/audit.template.types";
import {
	createClientId,
	createEmptySection,
	createScoreLevel,
	getFieldOptionLabel,
	sortScoreLevels,
} from "../../shared/templates/audit-template.utils";
import {
	DEALER_DETAIL_FIELD_KEYS,
	DEALER_FACILITY_TYPE_OPTIONS,
	DEALER_PARAMETER_CATEGORY_OPTIONS,
	DEALER_PARAMETER_FIELD_KEYS,
	DEALER_PARAMETER_FUNCTION_OPTIONS,
	DEALER_TEMPLATE_DETAIL_FIELDS,
	DEALER_TEMPLATE_PARAMETER_FIELDS,
} from "./dealer-template.config";
import type {
	CreateDealerChecklistTemplatePayload,
	DealerChecklistLibraryFilters,
	DealerChecklistParameter,
	DealerChecklistParameterPayload,
	DealerChecklistTemplate,
	DealerChecklistTemplateListItem,
	DealerChecklistTemplateListParams,
	DealerFacilityType,
	UpdateDealerChecklistTemplatePayload,
} from "./dealer-template.types";

// ── Helpers ───────────────────────────────────────────────────────────

const isDealerFacilityType = (value: string): value is DealerFacilityType =>
	DEALER_FACILITY_TYPE_OPTIONS.some((option) => option.value === value);

const toNullableText = (value: string): string | null => {
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
};

/**
 * Function / Category are free text on the server, so rows saved earlier may
 * differ in case from today's option values ("INFRA" vs "Infra"). Map those
 * back onto the matching option; anything else is kept as-is so no data is
 * lost (the Select simply asks the user to pick a valid option).
 */
const toOptionValue = (
	options: ReadonlyArray<{ value: string; label: string }>,
	raw: string | null,
): string => {
	const text = (raw ?? "").trim();
	if (!text) return "";
	const lower = text.toLowerCase();
	const match = options.find(
		(option) =>
			option.value.toLowerCase() === lower ||
			option.label.toLowerCase() === lower,
	);
	return match ? match.value : text;
};

// ── Domain → builder form values ──────────────────────────────────────

const mapParameterToForm = (
	parameter: DealerChecklistParameter,
): AuditTemplateParameterFormValues => ({
	id: createClientId(),
	serverId: parameter.id,
	title: parameter.title,
	guidance: parameter.guidance,
	attributes: {
		[DEALER_PARAMETER_FIELD_KEYS.functionArea]: toOptionValue(
			DEALER_PARAMETER_FUNCTION_OPTIONS,
			parameter.functionArea,
		),
		[DEALER_PARAMETER_FIELD_KEYS.category]: toOptionValue(
			DEALER_PARAMETER_CATEGORY_OPTIONS,
			parameter.category,
		),
	},
	isScored: parameter.isScored,
	scoreLevels: sortScoreLevels(parameter.scoreLevels).map((level) =>
		createScoreLevel(level.score, level.criteria),
	),
	evidenceRequired: parameter.evidenceRequired,
	minEvidenceCount: parameter.minEvidenceCount ?? TEMPLATE_DEFAULT_MIN_EVIDENCE,
	maxEvidenceCount: parameter.maxEvidenceCount ?? TEMPLATE_DEFAULT_MAX_EVIDENCE,
});

export const mapDealerTemplateToBuilderValues = (
	template: DealerChecklistTemplate,
): AuditTemplateBuilderValues => ({
	details: {
		name: template.name,
		description: template.description,
		fields: {
			[DEALER_DETAIL_FIELD_KEYS.facilityType]: template.facilityType ?? "",
		},
	},
	// A draft saved from the Details step has no parameters yet — give the
	// Build step one blank row to start from (UI-only, never persisted blank).
	sections: template.parameters.length
		? [
				{
					id: createClientId(),
					serverId: null,
					name: "",
					parameters: template.parameters.map(mapParameterToForm),
				},
			]
		: [createEmptySection(DEALER_TEMPLATE_PARAMETER_FIELDS)],
});

// ── Builder form values → payload ─────────────────────────────────────

const isBlankParameter = (parameter: AuditTemplateParameterFormValues) =>
	!parameter.title.trim() && !parameter.guidance.trim();

/**
 * `photoKeys` carries each saved parameter's reference photo (serverId → key).
 * The builder form does not edit photos yet, so without this a re-save would
 * silently drop them.
 */
export type ReferencePhotoKeys = ReadonlyMap<string, string | null>;

export const getReferencePhotoKeys = (
	template: DealerChecklistTemplate | null,
): ReferencePhotoKeys =>
	new Map(
		(template?.parameters ?? []).map((parameter) => [
			parameter.id,
			parameter.referencePhotoKey,
		]),
	);

const mapParameterToPayload = (
	parameter: AuditTemplateParameterFormValues,
	photoKeys: ReferencePhotoKeys,
): DealerChecklistParameterPayload => {
	const title = parameter.title.trim();

	return {
		...(parameter.serverId ? { id: parameter.serverId } : {}),
		functionName: toNullableText(
			parameter.attributes[DEALER_PARAMETER_FIELD_KEYS.functionArea] ?? "",
		),
		categoryName: toNullableText(
			parameter.attributes[DEALER_PARAMETER_FIELD_KEYS.category] ?? "",
		),
		title,
		// Check point is mandatory server-side; fall back to the title when no
		// guidance was typed (the read side hides it again).
		checkPoint: parameter.guidance.trim() || title,
		isScored: parameter.isScored,
		scoreLevels: parameter.isScored
			? sortScoreLevels(parameter.scoreLevels).map((level) => ({
					score: level.score,
					criteria: level.criteria.trim(),
				}))
			: [],
		evidenceRequired: parameter.evidenceRequired,
		minEvidenceCount: parameter.evidenceRequired
			? parameter.minEvidenceCount
			: null,
		maxEvidenceCount: parameter.evidenceRequired
			? parameter.maxEvidenceCount
			: null,
		referencePhotoKey: parameter.serverId
			? (photoKeys.get(parameter.serverId) ?? null)
			: null,
	};
};

export const mapBuilderValuesToCreateDealerTemplatePayload = (
	values: AuditTemplateBuilderValues,
	photoKeys: ReferencePhotoKeys = new Map(),
): CreateDealerChecklistTemplatePayload => {
	const facilityType =
		values.details.fields[DEALER_DETAIL_FIELD_KEYS.facilityType] ?? "";

	return {
		name: values.details.name.trim(),
		description: toNullableText(values.details.description),
		facilityType: isDealerFacilityType(facilityType) ? facilityType : null,
		parameters: values.sections
			.flatMap((section) => section.parameters)
			.filter((parameter) => !isBlankParameter(parameter))
			.map((parameter) => mapParameterToPayload(parameter, photoKeys)),
	};
};

export const mapBuilderValuesToUpdateDealerTemplatePayload = (
	values: AuditTemplateBuilderValues,
	expectedUpdatedAt: string | null,
	photoKeys: ReferencePhotoKeys = new Map(),
): UpdateDealerChecklistTemplatePayload => ({
	...mapBuilderValuesToCreateDealerTemplatePayload(values, photoKeys),
	expectedUpdatedAt,
});


// ── Server validation errors → form fields ────────────────────────────

export interface FormFieldErrorTarget {
	/** react-hook-form field name inside the Details or Build form. */
	name: string;
	message: string;
}

export interface MappedServerErrors {
	details: FormFieldErrorTarget[];
	build: FormFieldErrorTarget[];
	/** Messages with no matching field (shown in the toast only). */
	unmapped: ServerFieldError[];
}

const PARAMETER_FIELD_TO_FORM: Record<string, string> = {
	functionName: `attributes.${DEALER_PARAMETER_FIELD_KEYS.functionArea}`,
	categoryName: `attributes.${DEALER_PARAMETER_FIELD_KEYS.category}`,
	title: "title",
	checkPoint: "guidance",
	minEvidenceCount: "minEvidenceCount",
	maxEvidenceCount: "maxEvidenceCount",
};

/**
 * The payload is a flat, blank-filtered list, so `parameters.3` is not
 * necessarily form row 3. Rebuild the same ordering to find the real
 * (section, row) the server meant.
 */
const getPayloadParameterPositions = (
	values: AuditTemplateBuilderValues,
): Array<{ sectionIndex: number; parameterIndex: number }> =>
	values.sections.flatMap((section, sectionIndex) =>
		section.parameters
			.map((parameter, parameterIndex) => ({
				parameter,
				sectionIndex,
				parameterIndex,
			}))
			.filter(({ parameter }) => !isBlankParameter(parameter))
			.map(({ sectionIndex, parameterIndex }) => ({
				sectionIndex,
				parameterIndex,
			})),
	);

export const mapServerErrorsToFormErrors = (
	errors: readonly ServerFieldError[],
	values: AuditTemplateBuilderValues,
): MappedServerErrors => {
	const result: MappedServerErrors = { details: [], build: [], unmapped: [] };
	const positions = getPayloadParameterPositions(values);

	for (const error of errors) {
		if (error.path === "name" || error.path === "description") {
			result.details.push({ name: error.path, message: error.message });
			continue;
		}
		if (error.path === "officeType") {
			result.details.push({
				name: `fields.${DEALER_DETAIL_FIELD_KEYS.facilityType}`,
				message: error.message,
			});
			continue;
		}

		const parameterMatch = /^parameters\.(\d+)\.(.+)$/.exec(error.path);
		const position = parameterMatch ? positions[Number(parameterMatch[1])] : undefined;
		if (!parameterMatch || !position) {
			result.unmapped.push(error);
			continue;
		}

		const base = `sections.${position.sectionIndex}.parameters.${position.parameterIndex}`;
		const rest = parameterMatch[2];
		const levelMatch = /^scoreLevels\.(\d+)\.(score|criteria)$/.exec(rest);

		if (levelMatch) {
			// Server order is score-sorted; the form's level order can differ.
			const sorted = sortScoreLevels(
				values.sections[position.sectionIndex].parameters[position.parameterIndex]
					.scoreLevels,
			);
			const formLevelIndex = values.sections[position.sectionIndex].parameters[
				position.parameterIndex
			].scoreLevels.indexOf(sorted[Number(levelMatch[1])]);
			if (formLevelIndex >= 0) {
				result.build.push({
					name: `${base}.scoreLevels.${formLevelIndex}.${levelMatch[2]}`,
					message: error.message,
				});
				continue;
			}
		}

		const formField = PARAMETER_FIELD_TO_FORM[rest];
		if (formField) {
			result.build.push({ name: `${base}.${formField}`, message: error.message });
		} else {
			// e.g. "scoreLevels" (needs at least one level): put it on the title.
			result.build.push({ name: `${base}.title`, message: error.message });
		}
	}

	return result;
};

// ── Listing ───────────────────────────────────────────────────────────

const facilityTypeField = DEALER_TEMPLATE_DETAIL_FIELDS.find(
	(config) => config.key === DEALER_DETAIL_FIELD_KEYS.facilityType,
);

export const mapDealerTemplateListItemToRow = (
	item: DealerChecklistTemplateListItem,
): AuditTemplateListRow => ({
	id: item.id,
	name: item.name,
	description: item.description,
	status: item.status,
	version: item.version,
	// Dealer checklists are a flat list; the Sections column is hidden.
	sectionCount: item.parameterCount > 0 ? 1 : 0,
	parameterCount: item.parameterCount,
	totalPoints: item.totalPoints,
	updatedAt: item.updatedAt,
	updatedByName: item.updatedByName,
	fieldLabels: {
		[DEALER_DETAIL_FIELD_KEYS.facilityType]: facilityTypeField
			? getFieldOptionLabel(facilityTypeField, item.facilityType ?? "")
			: "",
	},
});

// ── List params (normalized so equal filters share one cache entry) ───

export const DEFAULT_DEALER_TEMPLATE_LIST_PARAMS: DealerChecklistTemplateListParams =
	{
		page: 1,
		pageSize: 10,
		search: "",
		statuses: [],
		facilityTypes: [],
		sortBy: "updatedAt",
		sortOrder: "desc",
	};

const uniqueSorted = <T extends string>(values: readonly T[]): T[] =>
	Array.from(new Set(values)).sort();

export const normalizeDealerTemplateListParams = (
	params: DealerChecklistTemplateListParams,
): DealerChecklistTemplateListParams => ({
	page: Math.max(1, Math.trunc(params.page) || 1),
	pageSize: Math.max(1, Math.trunc(params.pageSize) || 10),
	search: params.search.trim().replace(/\s+/g, " "),
	statuses: uniqueSorted(params.statuses),
	facilityTypes: uniqueSorted(params.facilityTypes),
	sortBy: params.sortBy,
	sortOrder: params.sortOrder,
});

export const mapFiltersToListParams = (
	filters: DealerChecklistLibraryFilters,
): Pick<DealerChecklistTemplateListParams, "facilityTypes"> => ({
	facilityTypes: filters.facilityTypes.filter(isDealerFacilityType),
});
