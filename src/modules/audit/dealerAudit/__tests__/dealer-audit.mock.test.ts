import { beforeEach, describe, expect, it } from "vitest";

import {
	mockDealerAuditBackend as backend,
	resetMockDealerAuditData,
	runQuarterEndJob,
	setMockActor,
} from "../dealer-audit.mock";
import {
	mapFormToCreateAuditPayload,
	mapReviewFormToPayload,
} from "../dealer-audit.mappers";

const asRole = (role: Parameters<typeof setMockActor>[0]["role"]) =>
	setMockActor({ role, userId: null, dealerId: null });

const listAll = async () => {
	asRole("ADMIN");
	const result = await backend.getAudits({ pageSize: 100 });
	return result.data;
};

const errorStatus = async (run: () => Promise<unknown>): Promise<number | null> => {
	try {
		await run();
		return null;
	} catch (error) {
		return (error as { response?: { status?: number } }).response?.status ?? null;
	}
};

beforeEach(() => {
	resetMockDealerAuditData();
	asRole("ADMIN");
});

describe("mock backend rules", () => {
	it("never lets an admin approve or reject", async () => {
		const [audit] = await listAll();
		asRole("ADMIN");
		expect(await errorStatus(() => backend.approveAudit(audit.id, { remarks: "", version: audit.version }))).toBe(403);
		expect(await errorStatus(() => backend.rejectAudit(audit.id, { reason: "x", version: audit.version }))).toBe(403);
	});

	it("never lets a reviewer approve", async () => {
		const [audit] = await listAll();
		asRole("REVIEWER");
		expect(await errorStatus(() => backend.approveAudit(audit.id, { remarks: "", version: audit.version }))).toBe(403);
	});

	it("rejects a stale version with 409", async () => {
		const pending = (await listAll()).find((a) => a.status === "PENDING_APPROVAL");
		if (!pending) return;
		asRole("APPROVER");
		expect(await errorStatus(() => backend.approveAudit(pending.id, { remarks: "", version: pending.version + 99 }))).toBe(409);
	});

	it("refuses a duplicate audit for the same dealer and period", async () => {
		const [existing] = await listAll();
		asRole("ADMIN");
		const reviewers = (await backend.getReviewerOptions()).data;
		const payload = mapFormToCreateAuditPayload({
			templateId: "tpl-1",
			dealerIds: [existing.dealer_id],
			reviewerId: reviewers[0].id,
			periodType: existing.period_type,
			year: existing.period_year,
			quarter: existing.period_quarter ?? 1,
			dueDate: "2099-01-01",
		});
		expect(await errorStatus(() => backend.createAudits(payload))).toBe(409);
	});
});

describe("quarter-end job", () => {
	it("closes waiting audits with the dealer's initial score and expires unsubmitted ones", async () => {
		const before = await listAll();
		const result = runQuarterEndJob(new Date(2100, 0, 1));
		const after = await listAll();

		for (const id of result.finalized) {
			const audit = after.find((a) => a.id === id);
			expect(audit?.status).toBe("CLOSED");
			expect(audit?.final_score_source).toBe("SELF_AUTO");
		}
		for (const id of result.expired) {
			expect(after.find((a) => a.id === id)?.status).toBe("EXPIRED");
		}
		// Audits already closed are left untouched.
		for (const audit of before.filter((a) => a.status === "CLOSED")) {
			expect(after.find((a) => a.id === audit.id)?.status).toBe("CLOSED");
		}
	});

	it("does nothing before the period has ended", () => {
		const result = runQuarterEndJob(new Date(2000, 0, 1));
		expect(result.finalized).toHaveLength(0);
		expect(result.expired).toHaveLength(0);
	});
});

describe("payload mappers", () => {
	it("only sends a score-change reason when the score changed", () => {
		const values = {
			score: 2,
			remarks: " weak ",
			decision: "DEFICIENT" as const,
			scoreChangeReason: " not as shown ",
		};
		expect(mapReviewFormToPayload(values, 4)).toMatchObject({
			reviewer_score: 2,
			reviewer_remarks: "weak",
			score_change_reason: "not as shown",
		});
		expect(mapReviewFormToPayload({ ...values, score: 4 }, 4).score_change_reason).toBeNull();
	});

	it("sends no quarter for a yearly audit", () => {
		const payload = mapFormToCreateAuditPayload({
			templateId: "t",
			dealerIds: ["d"],
			reviewerId: "r",
			periodType: "YEARLY",
			year: 2026,
			quarter: 3,
			dueDate: "2027-03-31",
		});
		expect(payload.period_quarter).toBeNull();
	});
});
