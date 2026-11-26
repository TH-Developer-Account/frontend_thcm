import { describe, expect, it } from "vitest";

import {
	mapBuilderValuesToCreateDealerTemplatePayload,
	mapBuilderValuesToUpdateDealerTemplatePayload,
	mapDealerChecklistTemplateResponse,
	mapDealerTemplateListParamsToQuery,
	mapDealerTemplateToBuilderValues,
	normalizeDealerTemplateListParams,
	DEFAULT_DEALER_TEMPLATE_LIST_PARAMS,
} from "../dealer-template.mappers";
import type { DealerChecklistTemplateResponse } from "../dealer-template.types";
import { mapFactoryTemplateToBuilderValues, mapBuilderValuesToFactoryTemplatePayload } from "../../../factoryAudit/templates/factory-template.mappers";

const response: DealerChecklistTemplateResponse = {
	id: "tpl-1",
	name: "HO audit",
	description: null,
	facility_type: "HEAD_OFFICE",
	audit_category: null,
	status: "PUBLISHED",
	version: 2,
	created_at: "2026-09-01T00:00:00Z",
	updated_at: null,
	updated_by_name: null,
	sections: [
		{
			id: "sec-2",
			sequence: 2,
			name: "Parts",
			parameters: [],
		},
		{
			id: "sec-1",
			sequence: 1,
			name: "Common",
			parameters: [
				{
					id: "par-1",
					sequence: 1,
					title: "Reception",
					guidance: null,
					function_area: "COMMON",
					category: "INFRA",
					is_scored: true,
					score_levels: [
						{ score: 0, criteria: "Else" },
						{ score: 5, criteria: "As per DIM" },
						{ score: 3, criteria: "Branding only" },
					],
					evidence_required: false,
					min_evidence_count: null,
					max_evidence_count: null,
				},
			],
		},
	],
};

describe("dealer template mappers", () => {
	it("normalizes nulls, sorts by sequence and preserves ids", () => {
		const template = mapDealerChecklistTemplateResponse(response);
		expect(template.description).toBe("");
		expect(template.sections.map((s) => s.id)).toEqual(["sec-1", "sec-2"]);
		expect(template.sections[0].parameters[0].id).toBe("par-1");
	});

	it("round-trips response → builder → update payload", () => {
		const values = mapDealerTemplateToBuilderValues(
			mapDealerChecklistTemplateResponse(response),
		);
		expect(values.details.fields.facilityType).toBe("HEAD_OFFICE");
		expect(values.sections[0].parameters[0].scoreLevels.map((l) => l.score)).toEqual([5, 3, 0]);

		const payload = mapBuilderValuesToUpdateDealerTemplatePayload(values, 2);
		expect(payload.version).toBe(2);
		expect(payload.sections[0]).toMatchObject({ id: "sec-1", sequence: 1, name: "Common" });
		expect(payload.sections[0].parameters[0]).toMatchObject({
			id: "par-1",
			function_area: "COMMON",
			category: "INFRA",
			guidance: null,
			min_evidence_count: null,
		});
	});

	it("drops untouched blank sections and omits ids for new rows", () => {
		const values = mapDealerTemplateToBuilderValues(
			mapDealerChecklistTemplateResponse({ ...response, sections: [] }),
		);
		// empty template gets one blank UI section …
		expect(values.sections).toHaveLength(1);
		// … which is never persisted.
		expect(mapBuilderValuesToCreateDealerTemplatePayload(values).sections).toEqual([]);

		values.sections[0].name = "New section";
		values.sections[0].parameters[0].title = "New param";
		const payload = mapBuilderValuesToCreateDealerTemplatePayload(values);
		expect(payload.sections[0]).not.toHaveProperty("id");
		expect(payload.sections[0].parameters[0]).not.toHaveProperty("id");
	});

	it("sends no score levels when parameter is not scored", () => {
		const values = mapDealerTemplateToBuilderValues(
			mapDealerChecklistTemplateResponse(response),
		);
		values.sections[0].parameters[0].isScored = false;
		const payload = mapBuilderValuesToCreateDealerTemplatePayload(values);
		expect(payload.sections[0].parameters[0].score_levels).toEqual([]);
	});

	it("normalizes list params so equal filters produce equal keys", () => {
		const a = normalizeDealerTemplateListParams({
			...DEFAULT_DEALER_TEMPLATE_LIST_PARAMS,
			search: "  head   office ",
			facilityTypes: ["BRANCH_OFFICE", "HEAD_OFFICE", "HEAD_OFFICE"],
		});
		const b = normalizeDealerTemplateListParams({
			...DEFAULT_DEALER_TEMPLATE_LIST_PARAMS,
			search: "head office",
			facilityTypes: ["HEAD_OFFICE", "BRANCH_OFFICE"],
		});
		expect(a).toEqual(b);
		expect(mapDealerTemplateListParamsToQuery(a)).toMatchObject({
			search: "head office",
			facility_type: "BRANCH_OFFICE,HEAD_OFFICE",
			sort_by: "updated_at",
		});
	});
});

describe("factory template mappers use their own payload", () => {
	it("maps builder values to factory column names", () => {
		const values = mapFactoryTemplateToBuilderValues({
			template_id: "f1",
			title: "Weld line",
			remarks: null,
			plant_type: "FABRICATION",
			audit_area: null,
			state: "DRAFT",
			revision: 1,
			modified_on: null,
			groups: [
				{
					group_id: "g1",
					order_no: 1,
					group_name: "Safety",
					items: [
						{
							item_id: "i1",
							order_no: 1,
							check_point: "PPE worn",
							method_of_check: null,
							process_area: null,
							severity: "MAJOR",
							scored: true,
							rubric: [{ score: 5, description: "All" }, { score: 0, description: "None" }],
							photo_mandatory: true,
							photo_min: 1,
							photo_max: 2,
						},
					],
				},
			],
		});
		const payload = mapBuilderValuesToFactoryTemplatePayload(values, 1);
		expect(payload).toMatchObject({ title: "Weld line", plant_type: "FABRICATION", revision: 1 });
		expect(payload.groups[0].items[0]).toMatchObject({
			item_id: "i1",
			check_point: "PPE worn",
			severity: "MAJOR",
			photo_max: 2,
		});
	});
});
