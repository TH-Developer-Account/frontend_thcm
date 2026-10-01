import { describe, expect, it } from "vitest";
import { mockDealerTemplateApi } from "../dealer-template.mock";
import { DEFAULT_DEALER_TEMPLATE_LIST_PARAMS } from "../dealer-template.mappers";

describe("mock adapter honours the API contract", () => {
	it("filters, sorts and paginates", async () => {
		const page = await mockDealerTemplateApi.getTemplates({ ...DEFAULT_DEALER_TEMPLATE_LIST_PARAMS, pageSize: 2, sortBy: "name", sortOrder: "asc" });
		expect(page.totalItems).toBe(3);
		expect(page.totalPages).toBe(2);
		expect(page.items.map((i) => i.name)[0]).toMatch(/^Branch/);
		const drafts = await mockDealerTemplateApi.getTemplates({ ...DEFAULT_DEALER_TEMPLATE_LIST_PARAMS, statuses: ["DRAFT"] });
		expect(drafts.items.every((i) => i.status === "DRAFT")).toBe(true);
	});

	it("rejects stale versions with 409 and bumps version when editing published", async () => {
		const t = await mockDealerTemplateApi.getTemplate("tpl-ho-infra");
		const payload = { name: t.name, description: null, facility_type: t.facilityType, audit_category: t.auditCategory, sections: [] };
		await expect(mockDealerTemplateApi.updateTemplate({ templateId: t.id, payload: { ...payload, version: 1 } })).rejects.toMatchObject({ response: { status: 409 } });
		const updated = await mockDealerTemplateApi.updateTemplate({ templateId: t.id, payload: { ...payload, version: t.version } });
		expect(updated.version).toBe(t.version + 1);
		expect(updated.status).toBe("DRAFT");
	});
});
