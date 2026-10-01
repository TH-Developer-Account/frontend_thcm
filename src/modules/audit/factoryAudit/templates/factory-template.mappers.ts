// modules/audit/factoryAudit/templates/factory-template.mappers.ts
//
// Factory response ⇄ shared builder values. Same builder, different DB shape.

import {
	TEMPLATE_DEFAULT_MAX_EVIDENCE,
	TEMPLATE_DEFAULT_MIN_EVIDENCE,
} from "../../shared/templates/audit-template.constants";
import type { AuditTemplateBuilderValues } from "../../shared/templates/audit.template.types";
import {
	createClientId,
	createEmptySection,
	createScoreLevel,
	sortScoreLevels,
} from "../../shared/templates/audit-template.utils";
import {
	FACTORY_DETAIL_FIELD_KEYS,
	FACTORY_PARAMETER_FIELD_KEYS,
	FACTORY_PLANT_TYPE_OPTIONS,
	FACTORY_SEVERITY_OPTIONS,
	FACTORY_TEMPLATE_PARAMETER_FIELDS,
} from "./factory-template.config";
import type {
	FactoryChecklistTemplateResponse,
	FactoryFindingSeverity,
	FactoryPlantType,
	SaveFactoryChecklistTemplatePayload,
} from "./factory-template.types";

const isPlantType = (value: string): value is FactoryPlantType =>
	FACTORY_PLANT_TYPE_OPTIONS.some((option) => option.value === value);

const isSeverity = (value: string): value is FactoryFindingSeverity =>
	FACTORY_SEVERITY_OPTIONS.some((option) => option.value === value);

const toNullableText = (value: string): string | null => value.trim() || null;

const byOrder = <T extends { order_no: number }>(a: T, b: T) =>
	a.order_no - b.order_no;

export const mapFactoryTemplateToBuilderValues = (
	response: FactoryChecklistTemplateResponse,
): AuditTemplateBuilderValues => {
	const sections = [...(response.groups ?? [])].sort(byOrder).map((group) => ({
		id: createClientId(),
		serverId: group.group_id,
		name: group.group_name,
		parameters: [...(group.items ?? [])].sort(byOrder).map((item) => ({
			id: createClientId(),
			serverId: item.item_id,
			title: item.check_point,
			guidance: item.method_of_check ?? "",
			attributes: {
				[FACTORY_PARAMETER_FIELD_KEYS.processArea]: item.process_area ?? "",
				[FACTORY_PARAMETER_FIELD_KEYS.severity]: item.severity ?? "",
			},
			isScored: item.scored,
			scoreLevels: sortScoreLevels(item.rubric ?? []).map((level) =>
				createScoreLevel(level.score, level.description),
			),
			evidenceRequired: item.photo_mandatory,
			minEvidenceCount: item.photo_min ?? TEMPLATE_DEFAULT_MIN_EVIDENCE,
			maxEvidenceCount: item.photo_max ?? TEMPLATE_DEFAULT_MAX_EVIDENCE,
		})),
	}));

	return {
		details: {
			name: response.title,
			description: response.remarks ?? "",
			fields: {
				[FACTORY_DETAIL_FIELD_KEYS.plantType]: response.plant_type ?? "",
				[FACTORY_DETAIL_FIELD_KEYS.auditArea]: response.audit_area ?? "",
			},
		},
		sections: sections.length
			? sections
			: [createEmptySection(FACTORY_TEMPLATE_PARAMETER_FIELDS)],
	};
};

export const mapBuilderValuesToFactoryTemplatePayload = (
	values: AuditTemplateBuilderValues,
	revision?: number,
): SaveFactoryChecklistTemplatePayload => {
	const plantType = values.details.fields[FACTORY_DETAIL_FIELD_KEYS.plantType] ?? "";

	return {
		title: values.details.name.trim(),
		remarks: toNullableText(values.details.description),
		plant_type: isPlantType(plantType) ? plantType : null,
		audit_area: toNullableText(
			values.details.fields[FACTORY_DETAIL_FIELD_KEYS.auditArea] ?? "",
		),
		...(revision !== undefined ? { revision } : {}),
		groups: values.sections
			.filter((section) => section.name.trim())
			.map((section, sectionIndex) => ({
				...(section.serverId ? { group_id: section.serverId } : {}),
				order_no: sectionIndex + 1,
				group_name: section.name.trim(),
				items: section.parameters
					.filter((parameter) => parameter.title.trim())
					.map((parameter, parameterIndex) => {
						const severity =
							parameter.attributes[FACTORY_PARAMETER_FIELD_KEYS.severity] ?? "";
						return {
							...(parameter.serverId ? { item_id: parameter.serverId } : {}),
							order_no: parameterIndex + 1,
							check_point: parameter.title.trim(),
							method_of_check: toNullableText(parameter.guidance),
							process_area: toNullableText(
								parameter.attributes[FACTORY_PARAMETER_FIELD_KEYS.processArea] ??
									"",
							),
							severity: isSeverity(severity) ? severity : null,
							scored: parameter.isScored,
							rubric: parameter.isScored
								? sortScoreLevels(parameter.scoreLevels).map((level) => ({
										score: level.score,
										description: level.criteria.trim(),
									}))
								: [],
							photo_mandatory: parameter.evidenceRequired,
							photo_min: parameter.evidenceRequired
								? parameter.minEvidenceCount
								: null,
							photo_max: parameter.evidenceRequired
								? parameter.maxEvidenceCount
								: null,
						};
					}),
			})),
	};
};
