// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { makeItem, makeSelf } from "../../../shared/execution/__tests__/testFactories";
import type {
	DealerAuditDealerOption,
	DealerAuditListItem,
	DealerAuditPeriod,
	DealerAuditReviewerOption,
	DealerAuditStatus,
} from "../../dealer-audit.types";
import {
	mapFormToCreateCyclePayload,
	mapResendToPayload,
} from "../dealer-cycle.mappers";
import {
	autoAssignReviewers,
	buildAuditsCsv,
	buildScoreMatrixRows,
	canRemindAudit,
	computeDealerEligibility,
	computeQueueCounts,
	computeReviewerWorkload,
	countUnassigned,
	getAuditProgressStep,
	getDealerPrimaryAction,
	getDeficiencies,
	getQueueTabForStatus,
	getScoreDrops,
	parseRecipientList,
	sortAuditsForDealer,
	toAssignmentList,
} from "../dealer-cycle.logic";
import {
	findFirstInvalidStep,
	validateCycleDetails,
	validateCycleReviewers,
} from "../dealer-cycle.schemas";
import type { CreateAuditCycleFormValues } from "../dealer-cycle.types";

const PERIOD: DealerAuditPeriod = { type: "QUARTERLY", year: 2026, quarter: 4 };

const makeAudit = (overrides: Partial<DealerAuditListItem> = {}): DealerAuditListItem => ({
	id: "a1",
	auditNumber: "AUD-1",
	dealerId: "d1",
	dealerCode: "D001",
	dealerName: "Dealer One",
	location: "Pune",
	facilityType: "3S",
	templateName: "3S Checklist",
	templateVersion: 1,
	period: PERIOD,
	status: "IN_PROGRESS",
	assignedReviewer: { id: "r1", name: "Ravi" },
	dueAt: "2026-12-31T00:00:00Z",
	completedItems: 2,
	totalItems: 10,
	selfScore: null,
	finalScore: null,
	maxScore: 100,
	finalScoreSource: "PENDING",
	openClarificationCount: 0,
	updatedAt: "2026-11-01T00:00:00Z",
	...overrides,
});

const dealer = (id: string, facilityType: DealerAuditDealerOption["facilityType"] = "3S"): DealerAuditDealerOption => ({
	id,
	code: id.toUpperCase(),
	name: `Dealer ${id}`,
	location: "Pune",
	facilityType,
});

const reviewer = (id: string, name: string): DealerAuditReviewerOption => ({
	id,
	name,
	designation: null,
});

describe("dealer eligibility", () => {
	it("blocks a dealer that already has a live audit in the period", () => {
		const result = computeDealerEligibility({
			dealers: [dealer("d1"), dealer("d2")],
			existingAudits: [makeAudit({ dealerId: "d1" })],
			period: PERIOD,
			templateFacilityType: "3S",
		});
		expect(result[0]).toMatchObject({ isEligible: false, reason: "ALREADY_AUDITED", blockingAuditNumber: "AUD-1" });
		expect(result[1].isEligible).toBe(true);
	});

	it("ignores audits from another period", () => {
		const result = computeDealerEligibility({
			dealers: [dealer("d1")],
			existingAudits: [makeAudit({ period: { type: "QUARTERLY", year: 2026, quarter: 3 } })],
			period: PERIOD,
			templateFacilityType: null,
		});
		expect(result[0].isEligible).toBe(true);
	});

	it("blocks a dealer whose facility type differs from the checklist", () => {
		const result = computeDealerEligibility({
			dealers: [dealer("d1", "1S")],
			existingAudits: [],
			period: PERIOD,
			templateFacilityType: "3S",
		});
		expect(result[0].reason).toBe("FACILITY_MISMATCH");
	});
});

describe("reviewer auto-assign", () => {
	const reviewers = [reviewer("r1", "Asha"), reviewer("r2", "Bala")];

	it("gives each dealer to the least-loaded reviewer", () => {
		const result = autoAssignReviewers({
			dealerIds: ["d1", "d2", "d3"],
			reviewers,
			workload: [
				{ reviewerId: "r1", openAudits: 5 },
				{ reviewerId: "r2", openAudits: 0 },
			],
		});
		expect(Object.values(result).filter((id) => id === "r2")).toHaveLength(3);
	});

	it("is deterministic and balances equal loads", () => {
		const input = {
			dealerIds: ["d1", "d2", "d3", "d4"],
			reviewers,
			workload: [],
		};
		expect(autoAssignReviewers(input)).toEqual(autoAssignReviewers(input));
		const counts = Object.values(autoAssignReviewers(input)).reduce<Record<string, number>>(
			(acc, id) => ({ ...acc, [id]: (acc[id] ?? 0) + 1 }),
			{},
		);
		expect(counts).toEqual({ r1: 2, r2: 2 });
	});

	it("keeps assignments the user already made", () => {
		const result = autoAssignReviewers({
			dealerIds: ["d1", "d2"],
			reviewers,
			workload: [],
			keep: { d1: "r2" },
		});
		expect(result.d1).toBe("r2");
	});

	it("returns nothing without reviewers", () => {
		expect(autoAssignReviewers({ dealerIds: ["d1"], reviewers: [], workload: [] })).toEqual({});
	});

	it("counts open audits only for the workload", () => {
		const load = computeReviewerWorkload(reviewers, [
			makeAudit({ id: "1" }),
			makeAudit({ id: "2", status: "CLOSED" }),
		]);
		expect(load.find((entry) => entry.reviewerId === "r1")?.openAudits).toBe(1);
	});

	it("lists only assigned dealers and counts the rest", () => {
		expect(toAssignmentList(["d1", "d2"], { d1: "r1" })).toEqual([{ dealerId: "d1", reviewerId: "r1" }]);
		expect(countUnassigned(["d1", "d2"], { d1: "r1" })).toBe(1);
	});
});

describe("wizard validation", () => {
	const values: CreateAuditCycleFormValues = {
		name: "Q4 2026 audit",
		templateId: "t1",
		periodType: "QUARTERLY",
		year: 2026,
		quarter: 4,
		dueDate: "2026-12-31",
		notes: "",
		dealerIds: ["d1", "d2"],
		reviewerByDealer: { d1: "r1", d2: "r2" },
	};
	const now = new Date("2026-11-04T00:00:00Z");

	it("accepts a complete cycle", () => {
		expect(findFirstInvalidStep(values, new Set(), now)).toBeNull();
	});

	it("requires a name and a checklist", () => {
		const errors = validateCycleDetails({ ...values, name: " ", templateId: "" }, now);
		expect(Object.keys(errors)).toEqual(expect.arrayContaining(["name", "templateId"]));
	});

	it("rejects a due date in the past", () => {
		expect(Object.keys(validateCycleDetails({ ...values, dueDate: "2026-01-01" }, now))).toContain("dueDate");
	});

	it("flags the details step first, then dealers, then reviewers", () => {
		expect(findFirstInvalidStep({ ...values, name: "" }, new Set(), now)).toBe("DETAILS");
		expect(findFirstInvalidStep({ ...values, dealerIds: [] }, new Set(), now)).toBe("DEALERS");
		expect(findFirstInvalidStep(values, new Set(["d1"]), now)).toBe("DEALERS");
		expect(findFirstInvalidStep({ ...values, reviewerByDealer: { d1: "r1" } }, new Set(), now)).toBe("REVIEWERS");
	});

	it("requires a reviewer for every dealer", () => {
		expect(Object.keys(validateCycleReviewers({ ...values, reviewerByDealer: {} }))).not.toHaveLength(0);
	});
});

describe("mappers", () => {
	it("builds the launch payload with only assigned dealers", () => {
		const payload = mapFormToCreateCyclePayload({
			name: "  Q4  ",
			templateId: "t1",
			periodType: "QUARTERLY",
			year: 2026,
			quarter: 4,
			dueDate: "2026-12-31",
			notes: "  ",
			dealerIds: ["d1", "d2"],
			reviewerByDealer: { d1: "r1" },
		});
		expect(payload.name).toBe("Q4");
		expect(payload.notes).toBeNull();
		expect(payload.assignments).toEqual([{ dealer_id: "d1", reviewer_id: "r1" }]);
	});

	it("trims report recipients", () => {
		expect(mapResendToPayload({ auditId: "a", recipients: [" a@x.com ", ""] }).recipients).toEqual(["a@x.com"]);
	});
});

describe("queues, reminders and progress", () => {
	it("puts statuses in the right reviewer tab", () => {
		expect(getQueueTabForStatus("SUBMITTED")).toBe("TO_REVIEW");
		expect(getQueueTabForStatus("UNDER_REVIEW")).toBe("IN_REVIEW");
		expect(getQueueTabForStatus("CLARIFICATION_REQUIRED")).toBe("WITH_DEALER");
		expect(getQueueTabForStatus("DRAFT")).toBeNull();
	});

	it("counts audits per tab", () => {
		const counts = computeQueueCounts([
			makeAudit({ status: "SUBMITTED" }),
			makeAudit({ status: "RESUBMITTED" }),
			makeAudit({ status: "UNDER_REVIEW" }),
		]);
		expect(counts.TO_REVIEW).toBe(2);
		expect(counts.IN_REVIEW).toBe(1);
	});

	it("reminds only audits the dealer still has to act on", () => {
		expect(canRemindAudit({ status: "IN_PROGRESS" })).toBe(true);
		expect(canRemindAudit({ status: "CLOSED" })).toBe(false);
	});

	it("maps every status to a progress step", () => {
		const expected: Array<[DealerAuditStatus, number]> = [
			["DRAFT", 1],
			["UNDER_REVIEW", 2],
			["PENDING_APPROVAL", 3],
			["APPROVED", 4],
			["CANCELLED", 0],
		];
		for (const [status, step] of expected) expect(getAuditProgressStep(status)).toBe(step);
	});
});

describe("dealer primary action", () => {
	it("picks one clear next step", () => {
		expect(getDealerPrimaryAction(makeAudit({ status: "DRAFT" }))).toBe("start");
		expect(getDealerPrimaryAction(makeAudit({ status: "IN_PROGRESS" }))).toBe("continue");
		expect(
			getDealerPrimaryAction(makeAudit({ status: "IN_PROGRESS", completedItems: 10, totalItems: 10 })),
		).toBe("submit");
		expect(getDealerPrimaryAction(makeAudit({ status: "CLARIFICATION_REQUIRED" }))).toBe("fix");
		expect(getDealerPrimaryAction(makeAudit({ status: "UNDER_REVIEW" }))).toBe("viewStatus");
		expect(getDealerPrimaryAction(makeAudit({ status: "APPROVED" }))).toBe("viewReport");
	});

	it("lists audits that need action first, then by due date", () => {
		const sorted = sortAuditsForDealer([
			makeAudit({ id: "done", status: "APPROVED" }),
			makeAudit({ id: "late", status: "IN_PROGRESS", dueAt: "2026-12-31T00:00:00Z" }),
			makeAudit({ id: "soon", status: "DRAFT", dueAt: "2026-11-10T00:00:00Z" }),
		]);
		expect(sorted.map((audit) => audit.id)).toEqual(["soon", "late", "done"]);
	});
});

describe("score views", () => {
	const dropped = makeItem({
		id: "i1",
		sequence: 1,
		maxScore: 5,
		self: makeSelf({ score: 5, isComplete: true }),
		review: { score: 4, remarks: "", decision: "ACCEPTED", scoreChangeReason: "Photo unclear", reviewedAt: null },
	});
	const same = makeItem({
		id: "i2",
		sequence: 2,
		maxScore: 5,
		self: makeSelf({ score: 5, isComplete: true }),
		review: { score: 5, remarks: "", decision: "ACCEPTED", scoreChangeReason: null, reviewedAt: null },
	});

	it("lists only score drops, biggest first", () => {
		const drops = getScoreDrops([same, dropped]);
		expect(drops).toHaveLength(1);
		expect(drops[0]).toMatchObject({ dealerScore: 5, reviewerScore: 4, drop: 1 });
	});

	it("lists items below full marks as deficiencies", () => {
		expect(getDeficiencies([same, dropped]).map((entry) => entry.item.id)).toEqual(["i1"]);
	});

	it("builds one matrix row per section with dealer and reviewer totals", () => {
		const rows = buildScoreMatrixRows([
			{ id: "s1", sequence: 1, name: "Showroom", items: [dropped, same] },
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ dealerScore: 10, reviewerScore: 9, maxScore: 10 });
	});
});

describe("recipients and CSV", () => {
	it("splits, lowercases and de-duplicates addresses", () => {
		const parsed = parseRecipientList("A@x.com, a@x.com; b@y.com  bad");
		expect(parsed.emails).toEqual(["a@x.com", "b@y.com"]);
		expect(parsed.invalid).toEqual(["bad"]);
	});

	it("escapes commas and quotes in the summary CSV", () => {
		const csv = buildAuditsCsv([makeAudit({ dealerName: 'Shree, "Auto"' })], (status) => status);
		expect(csv).toContain('"Shree, ""Auto"""');
	});
});
