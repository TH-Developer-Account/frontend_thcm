import { describe, expect, it } from "vitest";

import { resolveDealerAuditRole } from "../dealer-audit.access";
import {
	getDealerAuditPermissions,
	getAssessmentMode,
	resolveAuditPermissions,
} from "../dealer-audit.permissions";
import {
	validateAuditForSubmission,
	validateReviewForSubmission,
} from "../dealer-audit.schemas";
import {
	computeSlaState,
	getAuditReminders,
	getPeriodOf,
	getPeriodRange,
} from "../dealer-audit.sla";
import {
	ALLOWED_AUDIT_TRANSITIONS,
	canTransitionAuditStatus,
	isTerminalAuditStatus,
} from "../dealer-audit.status";
import type { DealerAuditRole, DealerAuditStatus } from "../dealer-audit.types";
import { makeItem, makeSelf } from "../../shared/execution/__tests__/testFactories";

const ALL_STATUSES = Object.keys(ALLOWED_AUDIT_TRANSITIONS) as DealerAuditStatus[];

describe("status transitions", () => {
	it("only references known statuses", () => {
		for (const targets of Object.values(ALLOWED_AUDIT_TRANSITIONS)) {
			for (const target of targets) expect(ALL_STATUSES).toContain(target);
		}
	});

	it("treats closed, rejected, expired and cancelled as terminal", () => {
		for (const status of ["CLOSED", "REJECTED", "EXPIRED", "CANCELLED"] as const) {
			expect(isTerminalAuditStatus(status)).toBe(true);
			expect(canTransitionAuditStatus(status, "IN_PROGRESS")).toBe(false);
		}
	});

	it("does not allow approval straight from submission", () => {
		expect(canTransitionAuditStatus("SUBMITTED", "APPROVED")).toBe(false);
		expect(canTransitionAuditStatus("PENDING_APPROVAL", "APPROVED")).toBe(true);
	});
});

describe("role resolution", () => {
	const base = {
		designation: undefined,
		isSuperAdmin: false,
		canManageApp: false,
		canWrite: false,
		canRead: true,
	} as const;

	it("maps dealer users with a grant to DEALER", () => {
		expect(resolveDealerAuditRole({ ...base, userRole: "DEALER" })).toBe("DEALER");
	});
	it("denies dealer users without a grant", () => {
		expect(
			resolveDealerAuditRole({ ...base, userRole: "DEALER", canRead: false }),
		).toBeUndefined();
	});
	it("falls back to ADMIN / REVIEWER / READ_ONLY", () => {
		expect(
			resolveDealerAuditRole({ ...base, userRole: "EMPLOYEE", isSuperAdmin: true }),
		).toBe("ADMIN");
		expect(
			resolveDealerAuditRole({ ...base, userRole: "EMPLOYEE", canWrite: true }),
		).toBe("REVIEWER");
		expect(resolveDealerAuditRole({ ...base, userRole: "EMPLOYEE" })).toBe(
			"READ_ONLY",
		);
	});
});

describe("permissions", () => {
	const user = { userId: "u1", dealerId: "d1" };
	const subject = (status: DealerAuditStatus, extra = {}) => ({
		status,
		dealerId: "d1",
		assignedReviewerId: "u1",
		openClarificationCount: 0,
		...extra,
	});

	it("admin can see everything but never approve or reject", () => {
		const admin = getDealerAuditPermissions("ADMIN");
		expect(admin.canApprove).toBe(false);
		expect(admin.canReject).toBe(false);
		expect(admin.canReview).toBe(false);
		expect(admin.canViewHistory).toBe(true);
		expect(admin.canViewComments).toBe(true);
	});

	it("dealer sees no workflow, comments or reviewer assessment", () => {
		const dealer = getDealerAuditPermissions("DEALER");
		expect(dealer.canViewWorkflow).toBe(false);
		expect(dealer.canViewComments).toBe(false);
		expect(dealer.canViewHistory).toBe(false);
		expect(dealer.canViewReviewerAssessment).toBe(false);
	});

	it("blocks a dealer from another dealership", () => {
		const result = resolveAuditPermissions(
			"DEALER",
			user,
			subject("IN_PROGRESS", { dealerId: "other" }),
		);
		expect(result.canView).toBe(false);
		expect(result.canEditSelfAssessment).toBe(false);
	});

	it("lets the dealer edit only while the self assessment is open", () => {
		expect(
			resolveAuditPermissions("DEALER", user, subject("IN_PROGRESS"))
				.canEditSelfAssessment,
		).toBe(true);
		expect(
			resolveAuditPermissions("DEALER", user, subject("UNDER_REVIEW"))
				.canEditSelfAssessment,
		).toBe(false);
	});

	it("makes closed audits fully read-only for every role", () => {
		const roles: DealerAuditRole[] = [
			"DEALER",
			"REVIEWER",
			"APPROVER",
			"REVIEWER_MANAGER",
			"AUDIT_MANAGER",
			"ADMIN",
		];
		for (const role of roles) {
			const result = resolveAuditPermissions(role, user, subject("CLOSED"));
			expect(result.canEditSelfAssessment).toBe(false);
			expect(result.canReview).toBe(false);
			expect(result.canApprove).toBe(false);
			expect(result.canReject).toBe(false);
			expect(result.canReassignReviewer).toBe(false);
		}
	});

	it("blocks approval while a clarification is open", () => {
		const approver = resolveAuditPermissions(
			"APPROVER",
			user,
			subject("PENDING_APPROVAL", { openClarificationCount: 1 }),
		);
		expect(approver.canApprove).toBe(false);
	});

	it("blocks a reviewer who is not assigned to the audit", () => {
		const result = resolveAuditPermissions(
			"REVIEWER",
			user,
			subject("UNDER_REVIEW", { assignedReviewerId: "someone-else" }),
		);
		expect(result.canView).toBe(false);
		expect(result.canReview).toBe(false);
	});

	it("derives the assessment mode from permissions", () => {
		expect(
			getAssessmentMode(
				resolveAuditPermissions("DEALER", user, subject("IN_PROGRESS")),
			),
		).toBe("SELF");
		expect(
			getAssessmentMode(
				resolveAuditPermissions("REVIEWER", user, subject("UNDER_REVIEW")),
			),
		).toBe("REVIEW");
		expect(
			getAssessmentMode(
				resolveAuditPermissions("DEALER", user, subject("CLOSED")),
			),
		).toBe("READ_ONLY");
	});
});

describe("whole-audit validation", () => {
	it("flags incomplete items against server data only", () => {
		const done = makeItem({
			id: "a",
			self: makeSelf({ score: 3, isComplete: true }),
		});
		const open = makeItem({ id: "b", sequence: 2 });
		const result = validateAuditForSubmission([done, open], "IN_PROGRESS");
		expect(result.valid).toBe(false);
		expect(result.issues.map((i) => i.itemId)).toEqual(["b"]);
	});

	it("only requires flagged items during a clarification", () => {
		const answered = makeItem({
			id: "a",
			clarification: {
				id: "c1",
				status: "RESPONDED",
				remarks: "",
				raisedAt: "2026-01-01T00:00:00Z",
				dueAt: null,
				response: "ok",
				respondedAt: null,
			},
		});
		const open = makeItem({
			id: "b",
			sequence: 2,
			clarification: {
				id: "c2",
				status: "OPEN",
				remarks: "Explain",
				raisedAt: "2026-01-01T00:00:00Z",
				dueAt: null,
				response: null,
				respondedAt: null,
			},
		});
		const result = validateAuditForSubmission(
			[answered, open],
			"CLARIFICATION_REQUIRED",
		);
		expect(result.issues.map((i) => i.itemId)).toEqual(["b"]);
	});

	it("requires every item reviewed before review submission", () => {
		const reviewed = makeItem({
			id: "a",
			review: {
				score: 3,
				remarks: "",
				decision: "ACCEPTED",
				scoreChangeReason: null,
				reviewedAt: null,
			},
		});
		const pending = makeItem({ id: "b", sequence: 2 });
		expect(validateReviewForSubmission([reviewed]).valid).toBe(true);
		expect(validateReviewForSubmission([reviewed, pending]).incompleteCount).toBe(1);
	});
});

describe("periods, SLA and reminders", () => {
	it("uses an April fiscal year", () => {
		expect(getPeriodOf(new Date(2026, 3, 1), "QUARTERLY")).toEqual({
			type: "QUARTERLY",
			year: 2026,
			quarter: 1,
		});
		expect(getPeriodOf(new Date(2027, 0, 15), "QUARTERLY")).toEqual({
			type: "QUARTERLY",
			year: 2026,
			quarter: 4,
		});
		expect(getPeriodOf(new Date(2026, 1, 1), "YEARLY").year).toBe(2025);
	});

	it("ends a quarter on its last day", () => {
		const { start, end } = getPeriodRange({
			type: "QUARTERLY",
			year: 2026,
			quarter: 1,
		});
		expect(start.getMonth()).toBe(3);
		expect(end.getMonth()).toBe(5);
		expect(end.getDate()).toBe(30);
	});

	it("computes SLA state", () => {
		const now = new Date(2026, 4, 10);
		expect(computeSlaState("IN_PROGRESS", new Date(2026, 4, 9).toISOString(), now)).toBe("OVERDUE");
		expect(computeSlaState("IN_PROGRESS", new Date(2026, 4, 12).toISOString(), now)).toBe("DUE_SOON");
		expect(computeSlaState("IN_PROGRESS", new Date(2026, 4, 30).toISOString(), now)).toBe("ON_TRACK");
		expect(computeSlaState("CLOSED", new Date(2026, 4, 9).toISOString(), now)).toBe("NONE");
	});

	it("warns the dealer before quarter end and not after closure", () => {
		const period = { type: "QUARTERLY", year: 2026, quarter: 1 } as const;
		const now = new Date(2026, 5, 25);
		const open = getAuditReminders(
			{ status: "IN_PROGRESS", dueAt: null, period },
			"DEALER",
			now,
		);
		expect(open.some((r) => r.id === "period-expiry")).toBe(true);

		const waiting = getAuditReminders(
			{ status: "UNDER_REVIEW", dueAt: null, period },
			"DEALER",
			now,
		);
		expect(waiting.some((r) => r.id === "period-auto-finalize")).toBe(true);

		expect(
			getAuditReminders({ status: "CLOSED", dueAt: null, period }, "DEALER", now),
		).toEqual([]);
	});
});

