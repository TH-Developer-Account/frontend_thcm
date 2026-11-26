import { describe, expect, it } from "vitest";

import { createAuditTemplateBuildSchema } from "../../../shared/templates/audit-template.schemas";
import {
	mapBackendTemplateToDomain,
	mapCreatePayloadToBackendBody,
	mapUpdatePayloadToBackendBody,
	type BackendParameter,
	type BackendTemplate,
} from "../dealer-template.backend";
import { DEALER_TEMPLATE_PARAMETER_FIELDS } from "../dealer-template.config";
import {
	getReferencePhotoKeys,
	mapBuilderValuesToCreateDealerTemplatePayload,
	mapBuilderValuesToUpdateDealerTemplatePayload,
	mapDealerTemplateToBuilderValues,
} from "../dealer-template.mappers";

const parameter = (
	id: string,
	order: number,
	title: string,
	overrides: Partial<BackendParameter> = {},
): BackendParameter => ({
	id,
	order,
	functionName: "Sales",
	categoryName: "Infra",
	title,
	checkPoint: `Check ${title}`,
	isScored: true,
	scoreLevels: [
		{ score: 5, criteria: "Yes" },
		{ score: 3, criteria: "Partly" },
		{ score: 0, criteria: "No" },
	],
	evidenceRequired: false,
	minEvidenceCount: null,
	maxEvidenceCount: null,
	referencePhotoKey: null,
	referencePhotoUrl: null,
	...overrides,
});

const response: BackendTemplate = {
	id: "tpl-flat",
	name: "Flat",
	description: null,
	officeType: "HEAD_OFFICE",
	status: "DRAFT",
	version: 1,
	totalScore: 10,
	updatedAt: "2026-11-15T06:00:00.000Z",
	updatedByName: "Monica",
	parameters: [
		parameter("p2", 2, "B", { referencePhotoKey: "dealer-audit-templates/reference-photos/b.jpg" }),
		parameter("p1", 1, "A"),
	],
};

const toValues = () =>
	mapDealerTemplateToBuilderValues(mapBackendTemplateToDomain(response));

describe("dealer flat template mapping", () => {
	it("puts every parameter into one hidden section, in order", () => {
		const values = toValues();
		expect(values.sections).toHaveLength(1);
		expect(values.sections[0].parameters.map((p) => p.title)).toEqual(["A", "B"]);
	});

	it("round-trips function, category and ALL score levels", () => {
		const payload = mapBuilderValuesToCreateDealerTemplatePayload(toValues());
		expect(payload.parameters[0]).toMatchObject({
			functionName: "Sales",
			categoryName: "Infra",
			isScored: true,
		});
		expect(payload.parameters[0].scoreLevels).toEqual([
			{ score: 5, criteria: "Yes" },
			{ score: 3, criteria: "Partly" },
			{ score: 0, criteria: "No" },
		]);
	});

	it("maps legacy upper-case values onto today's option values", () => {
		const legacy = mapDealerTemplateToBuilderValues(
			mapBackendTemplateToDomain({
				...response,
				parameters: [parameter("p1", 1, "A", { categoryName: "INFRA", functionName: "COMMON" })],
			}),
		);
		const [first] = legacy.sections[0].parameters;
		expect(first.attributes.category).toBe("Infra");
		expect(first.attributes.functionArea).toBe("Common");
	});

	it("keeps reference photos on re-save and sends expectedUpdatedAt", () => {
		const template = mapBackendTemplateToDomain(response);
		const payload = mapBuilderValuesToUpdateDealerTemplatePayload(
			mapDealerTemplateToBuilderValues(template),
			template.updatedAt,
			getReferencePhotoKeys(template),
		);
		expect(payload.parameters[1].referencePhotoKey).toBe(
			"dealer-audit-templates/reference-photos/b.jpg",
		);
		expect(mapUpdatePayloadToBackendBody(payload).expectedUpdatedAt).toBe(
			"2026-11-15T06:00:00.000Z",
		);
	});

	it("falls back to the title when no guidance was typed, and hides it again", () => {
		const values = toValues();
		values.sections[0].parameters[0].guidance = "";
		const payload = mapBuilderValuesToCreateDealerTemplatePayload(values);
		expect(payload.parameters[0].checkPoint).toBe("A");

		const reread = mapBackendTemplateToDomain({
			...response,
			parameters: [parameter("p1", 1, "A", { checkPoint: "A" })],
		});
		expect(reread.parameters[0].guidance).toBe("");
	});

	it("sends an empty parameter list for a draft saved from the Details step", () => {
		const values = mapDealerTemplateToBuilderValues(
			mapBackendTemplateToDomain({ ...response, parameters: [] }),
		);
		const body = mapCreatePayloadToBackendBody(
			mapBuilderValuesToCreateDealerTemplatePayload(values),
		);
		expect(body.parameters).toEqual([]);
		expect(body.officeType).toBe("HEAD_OFFICE");
	});

	it("does not require a section name in the flat schema", () => {
		const values = toValues();
		values.sections[0].name = "";
		const flat = createAuditTemplateBuildSchema(DEALER_TEMPLATE_PARAMETER_FIELDS, "flat");
		const sectioned = createAuditTemplateBuildSchema(DEALER_TEMPLATE_PARAMETER_FIELDS, "sections");
		expect(flat.safeParse({ sections: values.sections }).success).toBe(true);
		expect(sectioned.safeParse({ sections: values.sections }).success).toBe(false);
	});
});
