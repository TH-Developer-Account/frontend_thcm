// modules/audit/dealerAudit/dealer-audit.mock.ts
//
// ┌──────────────────────────────────────────────────────────────────┐
// │ TEMPORARY — DELETE THIS FILE when the backend routes are live.   │
// └──────────────────────────────────────────────────────────────────┘
//
// An in-memory stand-in for the Dealer Audit backend. It returns RAW
// snake_case envelopes (exactly what ServerAxios would hand back in
// `response.data`), so the real mappers, schemas and permissions run
// against realistic data while the API is being built.
//
// It also enforces the server rules the UI relies on (valid status
// transitions, optimistic-concurrency `version`, evidence limits,
// mandatory geolocation, role visibility) so those paths can be tested.
//
// State lives in memory only and resets on page reload. Nothing is
// written to browser storage.

import {
	collectReviewItemIssues,
	collectSelfItemIssues,
} from "../shared/execution/audit-execution.validation";
import {
	validateAuditForSubmission,
	validateReviewForSubmission,
} from "./dealer-audit.schemas";
import {
	canTransitionAuditStatus,
	isAutoFinalizableStatus,
	isClarificationStatus,
	isReportAvailableStatus,
	isSelfAssessmentOpenStatus,
	isTerminalAuditStatus,
} from "./dealer-audit.status";
import {
	addDaysToIso,
	computeClarificationDueAt,
	getPeriodOf,
	getPeriodRange,
} from "./dealer-audit.sla";
import {
	mapChecklistItemResponse,
	mapChecklistResponse,
	normalizeAuditListParams,
} from "./dealer-audit.mappers";
import type {
	ApiEnvelope,
	ApiPaginatedEnvelope,
	ApproveAuditPayload,
	CreateDealerAuditPayload,
	DealerAuditChecklistItemResponse,
	DealerAuditChecklistResponse,
	DealerAuditDealerOptionResponse,
	DealerAuditEvidenceResponse,
	DealerAuditHistoryAction,
	DealerAuditHistoryEntryResponse,
	DealerAuditListParams,
	DealerAuditPeriod,
	DealerAuditReportResponse,
	DealerAuditResponse,
	DealerAuditReviewerOptionResponse,
	DealerAuditRole,
	DealerAuditStatus,
	FinalScoreSource,
	RaiseClarificationPayload,
	ReAuditPayload,
	ReassignReviewerPayload,
	RejectAuditPayload,
	RespondToClarificationPayload,
	ReviewAuditItemPayload,
	SaveAuditItemPayload,
	SaveAuditItemResponse,
	SubmitAuditPayload,
	SubmitReviewPayload,
	UploadEvidenceMeta,
} from "./dealer-audit.types";

// ── Errors ────────────────────────────────────────────────────────────

/** Shaped like an AxiosError so the shared error helpers work unchanged. */
export class MockHttpError extends Error {
	readonly response: {
		status: number;
		data: { message: string; errors?: Record<string, string[]> };
	};

	constructor(status: number, message: string) {
		super(message);
		this.name = "MockHttpError";
		this.response = { status, data: { message } };
	}
}

function fail(status: number, message: string): never {
	throw new MockHttpError(status, message);
}

// ── Acting user (set by the access hook; see useDealerAuditAccess) ─────

export interface MockActor {
	role: DealerAuditRole;
	userId: string | null;
	dealerId: string | null;
}

let actor: MockActor = { role: "ADMIN", userId: null, dealerId: null };
const DEFAULT_MOCK_DEALER_ID = "dealer-1";

export const setMockActor = (next: MockActor): void => {
	actor = next;
};

const actorDealerId = (): string => actor.dealerId ?? DEFAULT_MOCK_DEALER_ID;

const ACTOR_NAMES: Record<DealerAuditRole, string> = {
	ADMIN: "Admin",
	DEALER: "Dealer user",
	REVIEWER: "Reviewer",
	REVIEWER_MANAGER: "Reviewer manager",
	APPROVER: "Approver",
	AUDIT_MANAGER: "Audit manager",
	READ_ONLY: "Viewer",
};

// ── Seed catalogue ────────────────────────────────────────────────────

const DEALERS: DealerAuditDealerOptionResponse[] = [
	{ id: "dealer-1", code: "DLR-1001", name: "Demo Dealer — Pune", location: "Pune, Maharashtra", facility_type: null },
	{ id: "dealer-2", code: "DLR-1002", name: "Demo Dealer — Nagpur", location: "Nagpur, Maharashtra", facility_type: null },
	{ id: "dealer-3", code: "DLR-1003", name: "Demo Dealer — Hubballi", location: "Hubballi, Karnataka", facility_type: null },
	{ id: "dealer-4", code: "DLR-1004", name: "Demo Dealer — Raipur", location: "Raipur, Chhattisgarh", facility_type: null },
	{ id: "dealer-5", code: "DLR-1005", name: "Demo Dealer — Jaipur", location: "Jaipur, Rajasthan", facility_type: null },
];

const REVIEWERS: DealerAuditReviewerOptionResponse[] = [
	{ id: "reviewer-1", name: "Demo Reviewer One", designation: "Regional reviewer" },
	{ id: "reviewer-2", name: "Demo Reviewer Two", designation: "Regional reviewer" },
];

interface ItemSpec {
	title: string;
	section: string;
	levels: number[];
	/** [required, min, max] or null when no evidence is needed. */
	evidence: [boolean, number, number];
}

const ITEM_SPECS: ItemSpec[] = [
	{ section: "Showroom & Facility", title: "Signage and branding", levels: [0, 1, 3, 5], evidence: [true, 1, 3] },
	{ section: "Showroom & Facility", title: "Machine display area", levels: [0, 2, 5], evidence: [true, 1, 2] },
	{ section: "Showroom & Facility", title: "Customer lounge and amenities", levels: [0, 1, 2], evidence: [false, 0, 2] },
	{ section: "Showroom & Facility", title: "Fire safety and signage", levels: [0, 5, 10], evidence: [true, 1, 3] },
	{ section: "Service Workshop", title: "Workshop layout and housekeeping", levels: [0, 2, 4, 5], evidence: [true, 1, 3] },
	{ section: "Service Workshop", title: "Special tools availability", levels: [0, 5, 10], evidence: [true, 2, 4] },
	{ section: "Service Workshop", title: "Technician training records", levels: [0, 1, 2, 3], evidence: [false, 0, 2] },
	{ section: "Service Workshop", title: "Waste oil and environment handling", levels: [0, 5], evidence: [true, 1, 2] },
	{ section: "Spare Parts", title: "Parts store organisation", levels: [0, 2, 5], evidence: [true, 1, 3] },
	{ section: "Spare Parts", title: "Fast-moving parts stock level", levels: [0, 5, 10], evidence: [false, 0, 3] },
	{ section: "Spare Parts", title: "Genuine parts storage and labelling", levels: [0, 1, 2], evidence: [true, 1, 2] },
];

const PLACEHOLDER_IMAGE =
	"data:image/svg+xml;utf8," +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" fill="#6b7280" font-size="18" text-anchor="middle">Mock evidence</text></svg>',
	);

// ── Store ─────────────────────────────────────────────────────────────

interface MockAudit {
	meta: DealerAuditResponse;
	items: DealerAuditChecklistItemResponse[];
	history: DealerAuditHistoryEntryResponse[];
	/** Every uploaded photo, attached to an item or not. */
	pool: Map<string, DealerAuditEvidenceResponse>;
}

const audits = new Map<string, MockAudit>();
let idCounter = 0;
const nextId = (prefix: string): string => `${prefix}-${++idCounter}`;
const nowIso = (): string => new Date().toISOString();
const delay = (ms = 250): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

const sectionIdOf = (name: string): string =>
	`section-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`;

const buildItems = (): DealerAuditChecklistItemResponse[] => {
	return ITEM_SPECS.map((spec, index) => {
		const max = Math.max(...spec.levels);
		return {
			id: nextId("item"),
			sequence: index + 1,
			section_id: sectionIdOf(spec.section),
			section_name: spec.section,
			title: spec.title,
			guidance: `Assess "${spec.title}" against the criteria and capture photographic evidence where required.`,
			criteria: [`Score between 0 and ${max}.`],
			category: null,
			function_area: null,
			is_scored: true,
			score_levels: spec.levels.map((score) => ({
				score,
				criteria:
					score === 0
						? "Not available / not applicable (score 0)"
						: `Meets ${score} of ${max} points`,
			})),
			min_score: Math.min(...spec.levels),
			max_score: max,
			evidence_required: spec.evidence[0],
			min_evidence_count: spec.evidence[1],
			max_evidence_count: spec.evidence[2],
			self: null,
			review: null,
			clarification: null,
		};
	});
};

const addHistory = (
	audit: MockAudit,
	action: DealerAuditHistoryAction,
	fromStatus: DealerAuditStatus | null,
	toStatus: DealerAuditStatus | null,
	comment: string | null = null,
): void => {
	audit.history.push({
		id: nextId("hist"),
		action,
		actor_name: ACTOR_NAMES[actor.role],
		actor_role: actor.role,
		occurred_at: nowIso(),
		from_status: fromStatus,
		to_status: toStatus,
		comment,
	});
};

const scoredItems = (audit: MockAudit) =>
	audit.items.filter((item) => item.is_scored);

const maxScoreOf = (audit: MockAudit): number =>
	scoredItems(audit).reduce((sum, item) => sum + (item.max_score ?? 0), 0);

const selfScoreOf = (audit: MockAudit): number =>
	scoredItems(audit).reduce((sum, item) => sum + (item.self?.score ?? 0), 0);

const itemFinal = (
	item: DealerAuditChecklistItemResponse,
): { score: number; source: FinalScoreSource } => {
	if (item.review?.score !== null && item.review?.score !== undefined) {
		return { score: item.review.score, source: "REVIEWER" };
	}
	if (item.self?.score !== null && item.self?.score !== undefined) {
		return { score: item.self.score, source: "SELF_AUTO" };
	}
	return { score: 0, source: "PENDING" };
};

const finalScoreOf = (audit: MockAudit): number =>
	scoredItems(audit).reduce((sum, item) => sum + itemFinal(item).score, 0);

const refresh = (audit: MockAudit): void => {
	const { meta, items } = audit;
	meta.total_items = items.length;
	meta.completed_items = items.filter((i) => i.self?.is_complete).length;
	meta.self_score = items.some((i) => i.self) ? selfScoreOf(audit) : null;
	meta.max_score = maxScoreOf(audit);
	meta.open_clarification_count = items.filter(
		(i) => i.clarification?.status === "OPEN",
	).length;
	meta.updated_at = nowIso();
};

const transition = (
	audit: MockAudit,
	to: DealerAuditStatus,
	action: DealerAuditHistoryAction,
	comment: string | null = null,
): void => {
	const from = audit.meta.status;
	if (!canTransitionAuditStatus(from, to)) {
		fail(409, `Invalid status change: ${from} → ${to}.`);
	}
	audit.meta.status = to;
	audit.meta.version += 1;
	addHistory(audit, action, from, to, comment);
	refresh(audit);
};

// ── Seed data ─────────────────────────────────────────────────────────

const shiftQuarter = (period: DealerAuditPeriod, by: number): DealerAuditPeriod => {
	const quarter = period.quarter ?? 1;
	const index = period.year * 4 + (quarter - 1) + by;
	return {
		type: "QUARTERLY",
		year: Math.floor(index / 4),
		quarter: ((index % 4) + 1) as 1 | 2 | 3 | 4,
	};
};

const makeEvidence = (count: number): DealerAuditEvidenceResponse[] =>
	Array.from({ length: count }, () => ({
		id: nextId("evd"),
		url: PLACEHOLDER_IMAGE,
		thumbnail_url: PLACEHOLDER_IMAGE,
		file_name: "mock-evidence.svg",
		size_bytes: 1024,
		mime_type: "image/svg+xml",
		captured_at: nowIso(),
		latitude: 18.5204,
		longitude: 73.8567,
		accuracy_m: 12,
	}));

const answer = (
	audit: MockAudit,
	item: DealerAuditChecklistItemResponse,
	score: number,
): void => {
	const count = item.evidence_required ? (item.min_evidence_count ?? 1) : 0;
	const evidence = makeEvidence(count);
	evidence.forEach((e) => audit.pool.set(e.id, e));
	item.self = {
		score,
		remarks: score === 0 ? "Not available at this facility." : "Verified on site.",
		evidence,
		answered_at: nowIso(),
		is_complete: true,
	};
};

const review = (
	item: DealerAuditChecklistItemResponse,
	score: number | null,
	decision: ReviewAuditItemPayload["decision"],
	reason: string | null = null,
): void => {
	item.review = {
		score,
		remarks: decision === "DEFICIENT" ? "Gap observed during verification." : "",
		decision,
		score_change_reason: reason,
		reviewed_at: nowIso(),
	};
};

const seedAudit = (
	dealerIndex: number,
	period: DealerAuditPeriod,
	status: DealerAuditStatus,
	dueInDays: number | null,
	reviewerIndex: number,
	fill: (audit: MockAudit) => void,
): MockAudit => {
	const dealer = DEALERS[dealerIndex];
	const reviewer = REVIEWERS[reviewerIndex];
	const id = nextId("audit");
	const created = addDaysToIso(nowIso(), -20);
	const audit: MockAudit = {
		meta: {
			id,
			audit_number: `DA-${String(idCounter).padStart(4, "0")}`,
			dealer_id: dealer.id,
			dealer_code: dealer.code,
			dealer_name: dealer.name,
			location: dealer.location,
			facility_type: dealer.facility_type,
			template_name: "Dealer Facility Audit",
			template_version: 1,
			template_id: "template-1",
			period_type: period.type,
			period_year: period.year,
			period_quarter: period.quarter,
			status,
			assigned_reviewer: { id: reviewer.id, name: reviewer.name },
			due_at: dueInDays === null ? null : addDaysToIso(nowIso(), dueInDays),
			completed_items: 0,
			total_items: 0,
			self_score: null,
			final_score: null,
			max_score: 0,
			final_score_source: "PENDING",
			open_clarification_count: 0,
			updated_at: created,
			created_at: created,
			submitted_at: null,
			closed_at: null,
			version: 1,
			auto_finalize_at: getPeriodRange(period).end.toISOString(),
		},
		items: buildItems(),
		history: [],
		pool: new Map(),
	};
	audit.history.push({
		id: nextId("hist"),
		action: "CREATED",
		actor_name: "Admin",
		actor_role: "ADMIN",
		occurred_at: created,
		from_status: null,
		to_status: "DRAFT",
		comment: null,
	});
	fill(audit);
	refresh(audit);
	audits.set(id, audit);
	return audit;
};

const answerAll = (audit: MockAudit, pick: (i: number) => number): void =>
	audit.items.forEach((item, i) => {
		const allowed = (item.score_levels ?? []).map((l) => l.score);
		answer(audit, item, allowed[Math.min(pick(i), allowed.length - 1)]);
	});

const seed = (): void => {
	audits.clear();
	idCounter = 0;
	const current = getPeriodOf(new Date(), "QUARTERLY");
	const previous = shiftQuarter(current, -1);

	// 1 Draft — nothing answered
	seedAudit(0, current, "DRAFT", 6, 0, () => undefined);

	// 2 In progress — due soon, half answered
	seedAudit(1, current, "IN_PROGRESS", 2, 0, (a) =>
		a.items.slice(0, 5).forEach((item) => answer(a, item, item.max_score ?? 0)),
	);

	// 3 Submitted — waiting for a reviewer
	seedAudit(2, current, "SUBMITTED", null, 1, (a) => {
		answerAll(a, (i) => i % 3);
		a.meta.submitted_at = nowIso();
	});

	// 4 Under review — partly reviewed
	seedAudit(3, current, "UNDER_REVIEW", null, 0, (a) => {
		answerAll(a, (i) => (i % 2) + 1);
		a.items.slice(0, 4).forEach((item) => {
			const self = item.self?.score ?? 0;
			review(item, self, "ACCEPTED");
		});
	});

	// 5 Clarification required — overdue, two flagged items
	seedAudit(4, current, "CLARIFICATION_REQUIRED", -1, 0, (a) => {
		answerAll(a, () => 1);
		a.items.slice(0, 11).forEach((item) => review(item, item.self?.score ?? 0, "ACCEPTED"));
		a.items.slice(1, 3).forEach((item) => {
			review(item, item.self?.score ?? 0, "CLARIFICATION_REQUIRED");
			item.clarification = {
				id: nextId("clr"),
				status: "OPEN",
				remarks: "Photo is unclear — recapture showing the full area.",
				raised_at: addDaysToIso(nowIso(), -8),
				due_at: addDaysToIso(nowIso(), -1),
				response: null,
				responded_at: null,
			};
		});
	});

	// 6 Pending approval (previous quarter)
	seedAudit(0, previous, "PENDING_APPROVAL", null, 1, (a) => {
		answerAll(a, (i) => i % 3);
		a.items.forEach((item) => {
			const self = item.self?.score ?? 0;
			const changed = item.sequence === 2;
			review(
				item,
				changed ? Math.max(0, self - 2) : self,
				"ACCEPTED",
				changed ? "Display area smaller than declared." : null,
			);
		});
		a.meta.final_score = finalScoreOf(a);
		a.meta.final_score_source = "REVIEWER";
	});

	// 7 Closed (previous quarter) — final by reviewer
	seedAudit(1, previous, "CLOSED", null, 0, (a) => {
		answerAll(a, (i) => (i % 2) + 1);
		a.items.forEach((item) => review(item, item.self?.score ?? 0, "ACCEPTED"));
		a.meta.final_score = finalScoreOf(a);
		a.meta.final_score_source = "REVIEWER";
		a.meta.closed_at = nowIso();
	});

	// 8 Submitted in a quarter that has already ended → quarter-end job target
	seedAudit(2, shiftQuarter(current, -2), "SUBMITTED", null, 1, (a) => {
		answerAll(a, () => 1);
	});
};

seed();

/** Reset to the seed data (handy while testing in the console). */
export const resetMockDealerAuditData = (): void => seed();

// ── View helpers (what the actor is allowed to receive) ────────────────

const isDealer = (): boolean => actor.role === "DEALER";

const assertCanSee = (audit: MockAudit): void => {
	if (isDealer() && audit.meta.dealer_id !== actorDealerId()) {
		fail(404, "Audit not found.");
	}
};

const getAuditOrFail = (auditId: string): MockAudit => {
	const audit = audits.get(auditId);
	if (!audit) return fail(404, "Audit not found.");
	assertCanSee(audit);
	return audit;
};

const getItemOrFail = (
	audit: MockAudit,
	itemId: string,
): DealerAuditChecklistItemResponse => {
	const item = audit.items.find((i) => i.id === itemId);
	if (!item) return fail(404, "Checklist item not found.");
	return item;
};

const assertVersion = (audit: MockAudit, version: number): void => {
	if (audit.meta.version !== version) {
		fail(409, "This audit was updated by another user.");
	}
};

const assertRole = (allowed: readonly DealerAuditRole[]): void => {
	if (!allowed.includes(actor.role)) {
		fail(403, "You do not have permission to perform this action.");
	}
};

const metaForActor = (audit: MockAudit): DealerAuditResponse => {
	const meta = { ...audit.meta };
	if (isDealer()) {
		meta.assigned_reviewer = null;
		if (!isReportAvailableStatus(meta.status)) meta.final_score = null;
	}
	return meta;
};

const itemForActor = (
	item: DealerAuditChecklistItemResponse,
): DealerAuditChecklistItemResponse =>
	isDealer() ? { ...item, review: null } : { ...item };

const envelope = <T>(data: T, message?: string): ApiEnvelope<T> => ({
	success: true,
	message,
	data,
});

// ── Operations ────────────────────────────────────────────────────────

const isPeriodMatch = (meta: DealerAuditResponse, p: DealerAuditListParams): boolean =>
	(p.periodType === null || meta.period_type === p.periodType) &&
	(p.year === null || meta.period_year === p.year) &&
	(p.quarter === null || meta.period_quarter === p.quarter);

const SORTERS: Record<
	DealerAuditListParams["sortBy"],
	(a: DealerAuditResponse, b: DealerAuditResponse) => number
> = {
	dueAt: (a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"),
	updatedAt: (a, b) => a.updated_at.localeCompare(b.updated_at),
	dealerName: (a, b) => a.dealer_name.localeCompare(b.dealer_name),
	status: (a, b) => a.status.localeCompare(b.status),
};

export const mockDealerAuditBackend = {
	async getAudits(
		rawParams: Partial<DealerAuditListParams>,
	): Promise<ApiPaginatedEnvelope<DealerAuditResponse>> {
		await delay();
		const params = normalizeAuditListParams(rawParams);
		const rows = [...audits.values()]
			.filter((a) => !isDealer() || a.meta.dealer_id === actorDealerId())
			.map(metaForActor)
			.filter((meta) => isPeriodMatch(meta, params))
			.filter(
				(meta) => !params.statuses.length || params.statuses.includes(meta.status),
			)
			.filter(
				(meta) =>
					!params.search ||
					`${meta.dealer_name} ${meta.dealer_code ?? ""} ${meta.audit_number} ${meta.location ?? ""}`
						.toLowerCase()
						.includes(params.search),
			)
			.sort((a, b) => {
				const result = SORTERS[params.sortBy](a, b);
				return params.sortOrder === "asc" ? result : -result;
			});

		const start = (params.page - 1) * params.pageSize;
		return {
			success: true,
			data: rows.slice(start, start + params.pageSize),
			meta: {
				page: params.page,
				page_size: params.pageSize,
				total_items: rows.length,
				total_pages: Math.max(1, Math.ceil(rows.length / params.pageSize)),
			},
		};
	},

	async getAudit(auditId: string): Promise<ApiEnvelope<DealerAuditResponse>> {
		await delay();
		return envelope(metaForActor(getAuditOrFail(auditId)));
	},

	async getChecklist(
		auditId: string,
	): Promise<ApiEnvelope<DealerAuditChecklistResponse>> {
		await delay();
		const audit = getAuditOrFail(auditId);
		return envelope({
			audit_id: audit.meta.id,
			dealer_name: audit.meta.dealer_name,
			dealer_code: audit.meta.dealer_code,
			location: audit.meta.location,
			status: audit.meta.status,
			version: audit.meta.version,
			sections: [...new Set(audit.items.map((i) => i.section_id))].map(
				(sectionId, index) => {
					const items = audit.items.filter((i) => i.section_id === sectionId);
					return {
						id: sectionId,
						sequence: index + 1,
						name: items[0].section_name,
						items: items.map(itemForActor),
					};
				},
			),
		});
	},

	async createAudits(
		payload: CreateDealerAuditPayload,
	): Promise<ApiEnvelope<DealerAuditResponse[]>> {
		await delay();
		assertRole(["ADMIN", "AUDIT_MANAGER"]);
		const reviewer = REVIEWERS.find((r) => r.id === payload.reviewer_id);
		if (!reviewer) fail(422, "Selected reviewer does not exist.");

		const duplicates = payload.dealer_ids.filter((dealerId) =>
			[...audits.values()].some(
				(a) =>
					a.meta.dealer_id === dealerId &&
					a.meta.period_type === payload.period_type &&
					a.meta.period_year === payload.period_year &&
					a.meta.period_quarter === payload.period_quarter &&
					a.meta.status !== "CANCELLED",
			),
		);
		if (duplicates.length) {
			fail(
				409,
				"An audit already exists for this dealer and period.",
			);
		}

		const period: DealerAuditPeriod = {
			type: payload.period_type,
			year: payload.period_year,
			quarter: payload.period_quarter,
		};
		const created = payload.dealer_ids.map((dealerId) => {
			const index = DEALERS.findIndex((d) => d.id === dealerId);
			if (index < 0) fail(422, "Selected dealer does not exist.");
			const audit = seedAudit(index, period, "DRAFT", 0, REVIEWERS.indexOf(reviewer), () => undefined);
			audit.meta.due_at = new Date(`${payload.due_date}T23:59:59`).toISOString();
			audit.meta.template_id = payload.template_id;
			addHistory(audit, "ASSIGNED", null, "DRAFT", `Assigned to ${reviewer.name}`);
			return audit.meta;
		});
		return envelope(created.map((m) => ({ ...m })), "Audits created");
	},

	async saveItem(
		auditId: string,
		itemId: string,
		payload: SaveAuditItemPayload,
	): Promise<ApiEnvelope<SaveAuditItemResponse>> {
		await delay(150);
		assertRole(["DEALER"]);
		const audit = getAuditOrFail(auditId);
		const item = getItemOrFail(audit, itemId);
		const { status } = audit.meta;

		const editable =
			isSelfAssessmentOpenStatus(status) ||
			(isClarificationStatus(status) && item.clarification?.status === "OPEN");
		if (!editable) fail(409, "This item can no longer be edited.");

		const evidence = payload.evidence_ids.map((id) => {
			const found = audit.pool.get(id);
			if (!found) return fail(422, "Evidence not found on the server. Upload it again.");
			return found;
		});

		const domain = mapChecklistItemResponse(item);
		const issues = collectSelfItemIssues(
			domain,
			{
				score: payload.score,
				remarks: payload.remarks,
				evidence: evidence.map(() => ({ status: "UPLOADED" as const, hasLocation: true })),
			},
			payload.mark_complete ? "complete" : "draft",
		);
		if (issues.length) fail(422, issues[0].message);

		item.self = {
			score: payload.score,
			remarks: payload.remarks,
			evidence,
			answered_at: nowIso(),
			is_complete: payload.mark_complete,
		};

		if (status === "DRAFT") {
			audit.meta.status = "IN_PROGRESS";
			audit.meta.version += 1;
			addHistory(audit, "STARTED", "DRAFT", "IN_PROGRESS");
		} else if (status === "CLARIFICATION_REQUIRED") {
			audit.meta.status = "RECTIFICATION_IN_PROGRESS";
			audit.meta.version += 1;
			addHistory(audit, "CLARIFICATION_RESPONDED", status, "RECTIFICATION_IN_PROGRESS");
		}
		refresh(audit);

		return envelope({
			item: itemForActor(item),
			audit_status: audit.meta.status,
			audit_version: audit.meta.version,
			completed_items: audit.meta.completed_items,
			total_items: audit.meta.total_items,
		});
	},

	async uploadEvidence(
		auditId: string,
		meta: UploadEvidenceMeta,
		file: Blob | null,
		fileName: string,
	): Promise<ApiEnvelope<DealerAuditEvidenceResponse>> {
		await delay(500);
		assertRole(["DEALER"]);
		const audit = getAuditOrFail(auditId);
		const item = getItemOrFail(audit, meta.item_id);

		if (
			typeof meta.latitude !== "number" ||
			typeof meta.longitude !== "number" ||
			Number.isNaN(meta.latitude) ||
			Number.isNaN(meta.longitude)
		) {
			fail(422, "Location is required for evidence.");
		}
		const attached = new Set((item.self?.evidence ?? []).map((e) => e.id));
		if (attached.size >= (item.max_evidence_count ?? 0)) {
			fail(422, `A maximum of ${item.max_evidence_count} photos is allowed.`);
		}

		const evidence: DealerAuditEvidenceResponse = {
			id: nextId("evd"),
			url: file ? URL.createObjectURL(file) : PLACEHOLDER_IMAGE,
			thumbnail_url: null,
			file_name: fileName,
			size_bytes: file?.size ?? null,
			mime_type: file?.type || "image/jpeg",
			captured_at: meta.captured_at,
			latitude: meta.latitude,
			longitude: meta.longitude,
			accuracy_m: meta.accuracy_m,
		};
		audit.pool.set(evidence.id, evidence);
		return envelope(evidence);
	},

	async deleteEvidence(
		auditId: string,
		itemId: string,
		evidenceId: string,
	): Promise<ApiEnvelope<null>> {
		await delay(150);
		assertRole(["DEALER"]);
		const audit = getAuditOrFail(auditId);
		const item = getItemOrFail(audit, itemId);
		audit.pool.delete(evidenceId);
		if (item.self) {
			item.self.evidence = (item.self.evidence ?? []).filter((e) => e.id !== evidenceId);
			item.self.is_complete = false;
		}
		refresh(audit);
		return envelope(null);
	},

	async submitAudit(
		auditId: string,
		payload: SubmitAuditPayload,
	): Promise<ApiEnvelope<DealerAuditResponse>> {
		await delay();
		assertRole(["DEALER"]);
		const audit = getAuditOrFail(auditId);
		assertVersion(audit, payload.version);

		const result = validateAuditForSubmission(
			mapChecklistResponse(checklistOf(audit)).sections.flatMap((s) => s.items),
			audit.meta.status,
		);
		if (!result.valid) {
			fail(422, `${result.incompleteCount} item(s) are incomplete.`);
		}

		const resubmission = isClarificationStatus(audit.meta.status);
		const target: DealerAuditStatus = resubmission ? "RESUBMITTED" : "SUBMITTED";
		transition(audit, target, resubmission ? "RESUBMITTED" : "SUBMITTED");
		audit.meta.submitted_at = nowIso();
		audit.meta.due_at = null;
		return envelope(metaForActor(audit), "Audit submitted");
	},

	async startReview(auditId: string): Promise<ApiEnvelope<DealerAuditResponse>> {
		await delay();
		assertRole(["REVIEWER", "REVIEWER_MANAGER"]);
		const audit = getAuditOrFail(auditId);
		transition(audit, "UNDER_REVIEW", "REVIEW_STARTED");
		return envelope(metaForActor(audit));
	},

	async reviewItem(
		auditId: string,
		itemId: string,
		payload: ReviewAuditItemPayload,
	): Promise<ApiEnvelope<SaveAuditItemResponse>> {
		await delay(150);
		assertRole(["REVIEWER", "REVIEWER_MANAGER"]);
		const audit = getAuditOrFail(auditId);
		if (audit.meta.status !== "UNDER_REVIEW") {
			fail(409, "Review has not been started for this audit.");
		}
		const item = getItemOrFail(audit, itemId);
		const domain = mapChecklistItemResponse(item);
		const issues = collectReviewItemIssues(
			domain,
			item.self?.score ?? null,
			{
				score: payload.reviewer_score,
				remarks: payload.reviewer_remarks,
				decision: payload.decision,
				scoreChangeReason: payload.score_change_reason ?? "",
			},
			"complete",
		);
		if (issues.length) fail(422, issues[0].message);

		item.review = {
			score: payload.reviewer_score,
			remarks: payload.reviewer_remarks,
			decision: payload.decision,
			score_change_reason: payload.score_change_reason,
			reviewed_at: nowIso(),
		};
		addHistory(audit, "ITEM_REVIEWED", null, null, item.title);
		refresh(audit);
		return envelope({
			item: { ...item },
			audit_status: audit.meta.status,
			audit_version: audit.meta.version,
			completed_items: audit.meta.completed_items,
			total_items: audit.meta.total_items,
		});
	},

	async raiseClarification(
		auditId: string,
		payload: RaiseClarificationPayload,
	): Promise<ApiEnvelope<DealerAuditResponse>> {
		await delay();
		assertRole(["REVIEWER", "REVIEWER_MANAGER", "APPROVER"]);
		const audit = getAuditOrFail(auditId);
		assertVersion(audit, payload.version);
		const raisedAt = nowIso();
		for (const itemId of payload.item_ids) {
			const item = getItemOrFail(audit, itemId);
			item.clarification = {
				id: nextId("clr"),
				status: "OPEN",
				remarks: payload.remarks,
				raised_at: raisedAt,
				due_at: computeClarificationDueAt(raisedAt),
				response: null,
				responded_at: null,
			};
		}
		audit.meta.due_at = computeClarificationDueAt(raisedAt);
		transition(audit, "CLARIFICATION_REQUIRED", "CLARIFICATION_RAISED", payload.remarks);
		return envelope(metaForActor(audit));
	},

	async respondToClarification(
		auditId: string,
		payload: RespondToClarificationPayload,
	): Promise<ApiEnvelope<DealerAuditChecklistItemResponse>> {
		await delay();
		assertRole(["DEALER"]);
		const audit = getAuditOrFail(auditId);
		const item = getItemOrFail(audit, payload.item_id);
		if (!isClarificationStatus(audit.meta.status) || item.clarification?.status !== "OPEN") {
			fail(409, "There is no open clarification for this item.");
		}
		if (!item.self?.is_complete) {
			fail(422, "Save the corrected answer before responding.");
		}
		item.clarification = {
			...item.clarification,
			status: "RESPONDED",
			response: payload.response,
			responded_at: nowIso(),
		};
		if (audit.meta.status === "CLARIFICATION_REQUIRED") {
			transition(audit, "RECTIFICATION_IN_PROGRESS", "CLARIFICATION_RESPONDED");
		}
		refresh(audit);
		return envelope(itemForActor(item));
	},

	async submitReview(
		auditId: string,
		payload: SubmitReviewPayload,
	): Promise<ApiEnvelope<DealerAuditResponse>> {
		await delay();
		assertRole(["REVIEWER", "REVIEWER_MANAGER"]);
		const audit = getAuditOrFail(auditId);
		assertVersion(audit, payload.version);
		if (audit.meta.open_clarification_count > 0) {
			fail(409, "Open clarifications must be resolved first.");
		}
		const result = validateReviewForSubmission(
			mapChecklistResponse(checklistOf(audit)).sections.flatMap((s) => s.items),
		);
		if (!result.valid) fail(422, `${result.incompleteCount} item(s) are not reviewed.`);

		audit.meta.final_score = finalScoreOf(audit);
		audit.meta.final_score_source = "REVIEWER";
		transition(audit, "PENDING_APPROVAL", "REVIEW_SUBMITTED");
		return envelope(metaForActor(audit));
	},

	async approveAudit(
		auditId: string,
		payload: ApproveAuditPayload,
	): Promise<ApiEnvelope<DealerAuditResponse>> {
		await delay();
		// ADMIN is deliberately NOT allowed: admin cannot approve or reject.
		assertRole(["APPROVER"]);
		const audit = getAuditOrFail(auditId);
		assertVersion(audit, payload.version);
		if (audit.meta.open_clarification_count > 0) {
			fail(409, "Open clarifications prevent approval.");
		}
		transition(audit, "APPROVED", "APPROVED", payload.remarks || null);
		return envelope(metaForActor(audit), "Audit approved");
	},

	async rejectAudit(
		auditId: string,
		payload: RejectAuditPayload,
	): Promise<ApiEnvelope<DealerAuditResponse>> {
		await delay();
		assertRole(["APPROVER"]);
		const audit = getAuditOrFail(auditId);
		assertVersion(audit, payload.version);
		transition(audit, "REJECTED", "REJECTED", payload.reason);
		return envelope(metaForActor(audit));
	},

	async reassignReviewer(
		auditId: string,
		payload: ReassignReviewerPayload,
	): Promise<ApiEnvelope<DealerAuditResponse>> {
		await delay();
		assertRole(["ADMIN", "AUDIT_MANAGER", "REVIEWER_MANAGER"]);
		const audit = getAuditOrFail(auditId);
		if (isTerminalAuditStatus(audit.meta.status)) {
			fail(409, "Closed audits cannot be reassigned.");
		}
		const reviewer = REVIEWERS.find((r) => r.id === payload.reviewer_id);
		if (!reviewer) return fail(422, "Selected reviewer does not exist.");
		const previous = audit.meta.assigned_reviewer?.name ?? "—";
		audit.meta.assigned_reviewer = { id: reviewer.id, name: reviewer.name };
		addHistory(
			audit,
			"REASSIGNED",
			null,
			null,
			`${previous} → ${reviewer.name}: ${payload.reason}`,
		);
		refresh(audit);
		return envelope(metaForActor(audit));
	},

	async reAudit(
		auditId: string,
		payload: ReAuditPayload,
	): Promise<ApiEnvelope<DealerAuditResponse>> {
		await delay();
		assertRole(["ADMIN", "AUDIT_MANAGER"]);
		const source = getAuditOrFail(auditId);
		if (!["CLOSED", "APPROVED", "IMPROVEMENT_REQUIRED"].includes(source.meta.status)) {
			fail(409, "Only a completed audit can be re-audited.");
		}
		const dealerIndex = DEALERS.findIndex((d) => d.id === source.meta.dealer_id);
		const reviewerIndex = Math.max(
			0,
			REVIEWERS.findIndex((r) => r.id === source.meta.assigned_reviewer?.id),
		);
		const next = seedAudit(
			dealerIndex,
			{
				type: source.meta.period_type,
				year: source.meta.period_year,
				quarter: source.meta.period_quarter,
			},
			"DRAFT",
			0,
			reviewerIndex,
			() => undefined,
		);
		next.meta.due_at = new Date(`${payload.due_date}T23:59:59`).toISOString();
		addHistory(source, "RE_AUDIT_CREATED", null, null, payload.reason);
		addHistory(next, "CREATED", null, "DRAFT", `Re-audit of ${source.meta.audit_number}: ${payload.reason}`);
		return envelope(metaForActor(next), "Re-audit created");
	},

	async getHistory(
		auditId: string,
	): Promise<ApiEnvelope<DealerAuditHistoryEntryResponse[]>> {
		await delay();
		// Dealers never see workflow history.
		assertRole(["ADMIN", "REVIEWER", "REVIEWER_MANAGER", "APPROVER", "AUDIT_MANAGER", "READ_ONLY"]);
		const audit = getAuditOrFail(auditId);
		return envelope(
			[...audit.history].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
		);
	},

	async getReport(auditId: string): Promise<ApiEnvelope<DealerAuditReportResponse>> {
		await delay();
		const audit = getAuditOrFail(auditId);
		if (!isReportAvailableStatus(audit.meta.status)) {
			fail(409, "The report is not available yet.");
		}
		const sectionIds = [...new Set(audit.items.map((i) => i.section_id))];
		return envelope({
			audit_id: audit.meta.id,
			audit_number: audit.meta.audit_number,
			dealer_name: audit.meta.dealer_name,
			dealer_code: audit.meta.dealer_code,
			location: audit.meta.location,
			period_type: audit.meta.period_type,
			period_year: audit.meta.period_year,
			period_quarter: audit.meta.period_quarter,
			status: audit.meta.status,
			self_score: audit.meta.self_score,
			final_score: audit.meta.final_score ?? finalScoreOf(audit),
			max_score: maxScoreOf(audit),
			final_score_source: audit.meta.final_score_source,
			sections: sectionIds.map((sectionId) => {
				const items = audit.items.filter((i) => i.section_id === sectionId && i.is_scored);
				return {
					section_id: sectionId,
					name: items[0]?.section_name ?? sectionId,
					score: items.reduce((sum, i) => sum + itemFinal(i).score, 0),
					max_score: items.reduce((sum, i) => sum + (i.max_score ?? 0), 0),
				};
			}),
			generated_at: nowIso(),
			download_url: null,
		});
	},

	async getDealerOptions(): Promise<ApiEnvelope<DealerAuditDealerOptionResponse[]>> {
		await delay(100);
		return envelope(DEALERS.map((d) => ({ ...d })));
	},

	async getReviewerOptions(): Promise<ApiEnvelope<DealerAuditReviewerOptionResponse[]>> {
		await delay(100);
		return envelope(REVIEWERS.map((r) => ({ ...r })));
	},
};

function checklistOf(audit: MockAudit): DealerAuditChecklistResponse {
	return {
		audit_id: audit.meta.id,
		dealer_name: audit.meta.dealer_name,
		dealer_code: audit.meta.dealer_code,
		location: audit.meta.location,
		status: audit.meta.status,
		version: audit.meta.version,
		sections: [
			{ id: "all", sequence: 1, name: "all", items: audit.items },
		],
	};
}

// ── Quarter-end job (what the BACKEND scheduler should do) ─────────────

export interface QuarterEndJobResult {
	finalized: string[];
	expired: string[];
}

/**
 * Reference implementation of the quarter-end rules, exported so it can be
 * unit-tested and triggered from tests:
 *   • audits waiting on review/approval → closed with the dealer's INITIAL
 *     score as final (source SELF_AUTO)
 *   • audits the dealer never submitted → EXPIRED
 */
export function runQuarterEndJob(now: Date = new Date()): QuarterEndJobResult {
	const result: QuarterEndJobResult = { finalized: [], expired: [] };
	for (const audit of audits.values()) {
		const periodEnd = getPeriodRange({
			type: audit.meta.period_type,
			year: audit.meta.period_year,
			quarter: audit.meta.period_quarter,
		}).end;
		if (periodEnd.getTime() >= now.getTime()) continue;

		const { status } = audit.meta;
		if (isAutoFinalizableStatus(status)) {
			audit.meta.final_score = selfScoreOf(audit);
			audit.meta.final_score_source = "SELF_AUTO";
			audit.meta.closed_at = nowIso();
			transition(audit, "CLOSED", "AUTO_FINALIZED", "Initial score taken as final at period end.");
			result.finalized.push(audit.meta.id);
		} else if (isSelfAssessmentOpenStatus(status) || isClarificationStatus(status)) {
			transition(audit, "EXPIRED", "EXPIRED");
			result.expired.push(audit.meta.id);
		}
	}
	return result;
}
