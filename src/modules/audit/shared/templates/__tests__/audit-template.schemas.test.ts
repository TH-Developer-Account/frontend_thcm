import { describe, expect, it } from "vitest";

import {
	createAuditTemplateBuildSchema,
	createAuditTemplateDetailsSchema,
} from "../audit-template.schemas";
import type {
	AuditTemplateFieldConfig,
	AuditTemplateParameterFormValues,
} from "../audit.template.types";
import {
	createEmptyParameter,
	createScoreLevel,
	deriveTemplateSummary,
	getNextAvailableScore,
} from "../audit-template.utils";

const PARAMETER_FIELDS: AuditTemplateFieldConfig[] = [
	{
		type: "select",
		key: "category",
		label: "Category",
		required: true,
		options: [
			{ value: "INFRA", label: "Infra" },
			{ value: "PROCESS", label: "Process" },
		],
	},
];

const buildSchema = createAuditTemplateBuildSchema(PARAMETER_FIELDS);

const validParameter = (
	overrides: Partial<AuditTemplateParameterFormValues> = {},
): AuditTemplateParameterFormValues => ({
	...createEmptyParameter(PARAMETER_FIELDS),
	title: "Reception counter",
	attributes: { category: "INFRA" },
	...overrides,
});

const withParameter = (parameter: AuditTemplateParameterFormValues) => ({
	sections: [{ id: "s1", serverId: null, name: "Common", parameters: [parameter] }],
});

const issuePaths = (result: ReturnType<typeof buildSchema.safeParse>) =>
	result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));

describe("details schema", () => {
	const schema = createAuditTemplateDetailsSchema([
		{
			type: "select",
			key: "facilityType",
			label: "Facility type",
			required: true,
			options: [{ value: "HEAD_OFFICE", label: "Head Office" }],
		},
	]);

	it("requires name and configured required fields", () => {
		const result = schema.safeParse({ name: "  ", description: "", fields: {} });
		expect(result.success).toBe(false);
		expect(result.error?.issues.map((i) => i.path.join("."))).toEqual(
			expect.arrayContaining(["name", "fields.facilityType"]),
		);
	});

	it("rejects an option outside the configured list", () => {
		const result = schema.safeParse({
			name: "HO audit",
			description: "",
			fields: { facilityType: "WAREHOUSE" },
		});
		expect(result.success).toBe(false);
	});

	it("accepts valid values", () => {
		const result = schema.safeParse({
			name: "HO audit",
			description: "",
			fields: { facilityType: "HEAD_OFFICE" },
		});
		expect(result.success).toBe(true);
	});
});

describe("scoring matrix", () => {
	it("accepts a sparse scale like 0 / 3 / 5", () => {
		const result = buildSchema.safeParse(
			withParameter(
				validParameter({
					scoreLevels: [
						createScoreLevel(5, "As per DIM"),
						createScoreLevel(3, "Not as per DIM"),
						createScoreLevel(0, "Else"),
					],
				}),
			),
		);
		expect(result.success).toBe(true);
	});

	it("accepts 1 to 5 without a zero", () => {
		const result = buildSchema.safeParse(
			withParameter(
				validParameter({
					scoreLevels: [1, 2, 3, 4, 5].map((score) => createScoreLevel(score, `L${score}`)),
				}),
			),
		);
		expect(result.success).toBe(true);
	});

	it("rejects duplicate, out-of-range and blank-criteria rows", () => {
		const result = buildSchema.safeParse(
			withParameter(
				validParameter({
					scoreLevels: [
						createScoreLevel(5, "Yes"),
						createScoreLevel(5, "Also yes"),
						createScoreLevel(7, "Too high"),
						createScoreLevel(0, "  "),
					],
				}),
			),
		);
		expect(issuePaths(result)).toEqual(
			expect.arrayContaining([
				"sections.0.parameters.0.scoreLevels.1.score",
				"sections.0.parameters.0.scoreLevels.2.score",
				"sections.0.parameters.0.scoreLevels.3.criteria",
			]),
		);
	});

	it("rejects an empty score (NaN from a cleared number input)", () => {
		const result = buildSchema.safeParse(
			withParameter(
				validParameter({
					scoreLevels: [createScoreLevel(Number.NaN, "Yes"), createScoreLevel(0, "No")],
				}),
			),
		);
		expect(issuePaths(result)).toContain("sections.0.parameters.0.scoreLevels.0.score");
	});

	it("requires at least two levels", () => {
		const result = buildSchema.safeParse(
			withParameter(validParameter({ scoreLevels: [createScoreLevel(5, "Yes")] })),
		);
		expect(issuePaths(result)).toContain("sections.0.parameters.0.scoreLevels");
	});

	it("ignores score rows when the parameter is not scored", () => {
		const result = buildSchema.safeParse(
			withParameter(
				validParameter({ isScored: false, scoreLevels: [createScoreLevel(9, "")] }),
			),
		);
		expect(result.success).toBe(true);
	});
});

describe("evidence + structure", () => {
	it("validates min/max photos only when evidence is required", () => {
		const off = buildSchema.safeParse(
			withParameter(validParameter({ evidenceRequired: false, minEvidenceCount: Number.NaN })),
		);
		expect(off.success).toBe(true);

		const on = buildSchema.safeParse(
			withParameter(
				validParameter({ evidenceRequired: true, minEvidenceCount: 3, maxEvidenceCount: 1 }),
			),
		);
		expect(issuePaths(on)).toContain("sections.0.parameters.0.maxEvidenceCount");
	});

	it("requires parameter-level configured fields", () => {
		const result = buildSchema.safeParse(
			withParameter(validParameter({ attributes: { category: "" } })),
		);
		expect(issuePaths(result)).toContain("sections.0.parameters.0.attributes.category");
	});

	it("requires a section name and flags duplicate names", () => {
		const parameter = validParameter();
		const result = buildSchema.safeParse({
			sections: [
				{ id: "a", serverId: null, name: "Common", parameters: [parameter] },
				{ id: "b", serverId: null, name: " common ", parameters: [parameter] },
				{ id: "c", serverId: null, name: "", parameters: [parameter] },
			],
		});
		expect(issuePaths(result)).toEqual(
			expect.arrayContaining(["sections.1.name", "sections.2.name"]),
		);
	});
});

describe("utils", () => {
	it("suggests the highest unused score", () => {
		expect(getNextAvailableScore([{ score: 5 }, { score: 4 }])).toBe(3);
		expect(getNextAvailableScore([0, 1, 2, 3, 4, 5].map((score) => ({ score })))).toBeNull();
	});

	it("totals max points from scored parameters only", () => {
		const summary = deriveTemplateSummary([
			{
				id: "s",
				serverId: null,
				name: "",
				parameters: [
					validParameter({ scoreLevels: [createScoreLevel(3, "a"), createScoreLevel(0, "b")] }),
					validParameter({ isScored: false }),
					validParameter({ evidenceRequired: true }),
				],
			},
		]);
		expect(summary.totalPoints).toBe(3 + 0 + 5);
		expect(summary.scoredParameterCount).toBe(2);
		expect(summary.evidenceParameterCount).toBe(1);
		expect(summary.perSection[0].name).toBe("Section 1");
	});
});
