// handouts/handouts.mock.ts
// MOCK-LAYER (delete this file when the real API is live)
//
// In-memory stand-in for the /handouts routes, switched on with the
// "Use mock data" checkbox (see handouts.mockMode.ts). The whole flow can be
// clicked through: request → approve / reject → deliver → closed. State lives
// for the page session only.
//
// Seed data covers every status so each screen can be seen:
//   HO-0042 / HO-0041  pending approval   (approver view, stock shortage banner)
//   HO-0040 / HO-0039  approved           (delivery team check + hand-over)
//   HO-0038            closed             (delivery card filled in)
//   HO-0037            rejected           (rejection banner)
//   HO-0036            cancelled
//
// The mock grants every action flag the status allows; the real backend
// computes them per caller (requester / approver / delivery team).

import type { ShopStockCheckResult } from "../crf";
import type {
	CreateHandoutPayload,
	DeliverHandoutPayload,
	HandoutDetail,
	HandoutItem,
	HandoutListParams,
	HandoutListResponse,
	HandoutPermissions,
	HandoutStatus,
	HandoutSummary,
	HandoutTimelineEntry,
} from "./handouts.types";

const delay = <T>(value: T, ms = 250) =>
	new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const isoDaysFromNow = (days: number, hour = 10) => {
	const date = new Date(Date.now() + days * 86_400_000);
	date.setHours(hour, 0, 0, 0);
	return date.toISOString();
};

const permissionsFor = (status: HandoutStatus): HandoutPermissions => ({
	canView: true,
	canCancel: status === "PENDING_APPROVAL",
	canApprove: status === "PENDING_APPROVAL",
	canReject: status === "PENDING_APPROVAL",
	canDeliver: status === "APPROVED",
});

/* -------------------------------- Stock ---------------------------------- */

// Display-only availability the detail page shows in the "Stock now" column.
// MOCK-CAP-NAVY is short and MOCK-MUG-WHITE is out, to show the warnings.
// Any other SKU (e.g. one added through the New request page) gets 50.
const MOCK_STOCK: Record<string, number> = {
	"MOCK-BOTTLE-BLUE": 120,
	"MOCK-CAP-NAVY": 8,
	"MOCK-DIARY-A5": 200,
	"MOCK-MUG-WHITE": 0,
};

/* -------------------------------- Seeding -------------------------------- */

const item = (
	n: number,
	index: number,
	sku: string,
	title: string,
	variantTitle: string,
	quantity: number,
	rate: number,
): HandoutItem => ({
	id: `mock-${n}-${index}`,
	sku,
	title,
	variantTitle,
	imageUrl: null,
	quantity,
	rate,
	amount: quantity * rate,
});

const BOTTLE = (n: number, i: number, qty: number) =>
	item(n, i, "MOCK-BOTTLE-BLUE", "Steel water bottle", "Blue · 750 ml", qty, 450);
const CAP = (n: number, i: number, qty: number) =>
	item(n, i, "MOCK-CAP-NAVY", "Branded cap", "Navy · Free size", qty, 280);
const DIARY = (n: number, i: number, qty: number) =>
	item(n, i, "MOCK-DIARY-A5", "Desk diary 2027", "A5 · Black", qty, 340);
const MUG = (n: number, i: number, qty: number) =>
	item(n, i, "MOCK-MUG-WHITE", "Ceramic mug", "White · 350 ml", qty, 220);

const entry = (
	action: HandoutTimelineEntry["action"],
	byName: string,
	daysAgo: number,
	hour: number,
	comment: string | null = null,
): HandoutTimelineEntry => ({
	id: crypto.randomUUID(),
	action,
	byName,
	at: isoDaysFromNow(-daysAgo, hour),
	comment,
});

type SeedOptions = {
	n: number;
	status: HandoutStatus;
	purpose: string;
	requestedByName: string;
	department: string;
	designation: string;
	deliverTo: string;
	phone: string;
	remarks?: string | null;
	items: HandoutItem[];
	createdDaysAgo: number;
	requiredInDays: number;
	timeline: HandoutTimelineEntry[];
	delivery?: HandoutDetail["delivery"];
	rejectionReason?: string | null;
};

const build = (o: SeedOptions): HandoutDetail => ({
	id: `mock-${o.n}`,
	requestNumber: `HO-${String(o.n).padStart(4, "0")}`,
	purpose: o.purpose,
	status: o.status,
	requiredBy: isoDaysFromNow(o.requiredInDays),
	createdAt: isoDaysFromNow(-o.createdDaysAgo, 15),
	requestedByName: o.requestedByName,
	requestedByDesignation: o.designation,
	requestedByDepartment: o.department,
	deliverTo: o.deliverTo,
	contactPhone: o.phone,
	remarks: o.remarks ?? null,
	items: o.items,
	itemCount: o.items.length,
	totalQuantity: o.items.reduce((sum, i) => sum + i.quantity, 0),
	totalAmount: o.items.reduce((sum, i) => sum + i.amount, 0),
	timeline: o.timeline,
	delivery: o.delivery ?? null,
	rejectionReason: o.rejectionReason ?? null,
	permissions: permissionsFor(o.status),
});

let store: HandoutDetail[] = [
	build({
		n: 42,
		status: "PENDING_APPROVAL",
		purpose: "Visiting customer delegation",
		requestedByName: "Demo requester",
		designation: "General Manager",
		department: "Sales",
		deliverTo: "Block B, 2nd floor, Reception",
		phone: "9800000010",
		remarks: "Delegation arrives at 11 am, kits needed before that.",
		items: [BOTTLE(42, 1, 10), CAP(42, 2, 20), MUG(42, 3, 5)],
		createdDaysAgo: 0,
		requiredInDays: 3,
		timeline: [entry("SUBMITTED", "Demo requester", 0, 9)],
	}),
	build({
		n: 41,
		status: "PENDING_APPROVAL",
		purpose: "New joiners welcome kit",
		requestedByName: "Demo requester two",
		designation: "HR Manager",
		department: "Human Resources",
		deliverTo: "HR desk, Block A, ground floor",
		phone: "9800000020",
		items: [DIARY(41, 1, 15), BOTTLE(41, 2, 15)],
		createdDaysAgo: 1,
		requiredInDays: 5,
		timeline: [entry("SUBMITTED", "Demo requester two", 1, 11)],
	}),
	build({
		n: 40,
		status: "APPROVED",
		purpose: "Dealer principals visit",
		requestedByName: "Demo requester",
		designation: "General Manager",
		department: "Sales",
		deliverTo: "Conference hall, Block C",
		phone: "9800000010",
		remarks: "Hand over at the end of the plant tour.",
		items: [BOTTLE(40, 1, 12), DIARY(40, 2, 12), CAP(40, 3, 6)],
		createdDaysAgo: 2,
		requiredInDays: 1,
		timeline: [
			entry("SUBMITTED", "Demo requester", 2, 10),
			entry("APPROVED", "Demo approver", 1, 12),
		],
	}),
	build({
		n: 39,
		status: "APPROVED",
		purpose: "College group plant tour",
		requestedByName: "Demo requester three",
		designation: "Plant Head",
		department: "Operations",
		deliverTo: "Security gate, Main entrance",
		phone: "9800000030",
		items: [DIARY(39, 1, 25), MUG(39, 2, 25)],
		createdDaysAgo: 3,
		requiredInDays: 2,
		timeline: [
			entry("SUBMITTED", "Demo requester three", 3, 14),
			entry("APPROVED", "Demo approver", 2, 10, "Approved for the tour."),
		],
	}),
	build({
		n: 38,
		status: "CLOSED",
		purpose: "Annual day chief guest gifts",
		requestedByName: "Demo requester",
		designation: "General Manager",
		department: "Sales",
		deliverTo: "Auditorium, Block D",
		phone: "9800000010",
		items: [BOTTLE(38, 1, 4), DIARY(38, 2, 4)],
		createdDaysAgo: 9,
		requiredInDays: -6,
		timeline: [
			entry("SUBMITTED", "Demo requester", 9, 10),
			entry("APPROVED", "Demo approver", 8, 11),
			entry("DELIVERED", "Demo delivery", 7, 16, "Handed over at the auditorium."),
		],
		delivery: {
			handedToName: "Event coordinator",
			deliveredOn: isoDaysFromNow(-7, 16),
			note: "Handed over at the auditorium.",
			deliveredByName: "Demo delivery",
		},
	}),
	build({
		n: 37,
		status: "REJECTED",
		purpose: "Team lunch giveaways",
		requestedByName: "Demo requester two",
		designation: "HR Manager",
		department: "Human Resources",
		deliverTo: "Cafeteria",
		phone: "9800000020",
		items: [MUG(37, 1, 40)],
		createdDaysAgo: 12,
		requiredInDays: -9,
		timeline: [
			entry("SUBMITTED", "Demo requester two", 12, 10),
			entry(
				"REJECTED",
				"Demo approver",
				11,
				15,
				"Internal events are not covered by handouts.",
			),
		],
		rejectionReason: "Internal events are not covered by handouts.",
	}),
	build({
		n: 36,
		status: "CANCELLED",
		purpose: "Training batch souvenirs",
		requestedByName: "Demo requester three",
		designation: "Plant Head",
		department: "Operations",
		deliverTo: "Training room",
		phone: "9800000030",
		items: [CAP(36, 1, 10)],
		createdDaysAgo: 14,
		requiredInDays: -10,
		timeline: [
			entry("SUBMITTED", "Demo requester three", 14, 10),
			entry("CANCELLED", "Demo requester three", 13, 9, "Training postponed."),
		],
	}),
];

let nextNumber = 50;

const toSummary = (d: HandoutDetail): HandoutSummary => ({
	id: d.id,
	requestNumber: d.requestNumber,
	purpose: d.purpose,
	status: d.status,
	requiredBy: d.requiredBy,
	createdAt: d.createdAt,
	requestedByName: d.requestedByName,
	itemCount: d.itemCount,
	totalQuantity: d.totalQuantity,
});

const find = (id: string) => {
	const found = store.find((d) => d.id === id);
	if (!found) throw new Error("Handout request not found.");
	return found;
};

const patch = (id: string, change: Partial<HandoutDetail>) => {
	store = store.map((d) =>
		d.id === id
			? {
					...d,
					...change,
					permissions: permissionsFor(change.status ?? d.status),
				}
			: d,
	);
};

const makeEntry = (
	action: HandoutTimelineEntry["action"],
	byName: string,
	comment: string | null = null,
): HandoutTimelineEntry => ({
	id: crypto.randomUUID(),
	action,
	byName,
	at: new Date().toISOString(),
	comment,
});

/* ---------------------------------- API ---------------------------------- */

export const handoutMockApi = {
	list: async (params: HandoutListParams): Promise<HandoutListResponse> => {
		const query = params.search?.trim().toLowerCase();
		const filtered = store.filter((d) => {
			if (params.status && d.status !== params.status) return false;
			if (params.view === "approve" && d.status !== "PENDING_APPROVAL")
				return false;
			if (params.view === "deliver" && d.status !== "APPROVED") return false;
			if (
				query &&
				!`${d.requestNumber} ${d.purpose}`.toLowerCase().includes(query)
			)
				return false;
			return true;
		});
		const start = (params.page - 1) * params.pageSize;
		return delay({
			items: filtered.slice(start, start + params.pageSize).map(toSummary),
			total: filtered.length,
		});
	},

	get: async (id: string) => delay(find(id)),

	create: async (payload: CreateHandoutPayload) => {
		const n = nextNumber++;
		const items: HandoutItem[] = payload.items.map((line, index) => ({
			id: `mock-${n}-${index}`,
			sku: line.sku,
			title: line.title ?? line.sku,
			variantTitle: line.variantTitle ?? null,
			imageUrl: line.imageUrl ?? null,
			quantity: line.quantity,
			rate: line.rate,
			amount: line.quantity * line.rate,
		}));
		const created = build({
			n,
			status: "PENDING_APPROVAL",
			purpose: payload.purpose,
			requestedByName: "Demo requester",
			designation: "General Manager",
			department: "Sales",
			deliverTo: payload.deliverTo,
			phone: payload.contactPhone,
			remarks: payload.remarks || null,
			items,
			createdDaysAgo: 0,
			requiredInDays: 0,
			timeline: [makeEntry("SUBMITTED", "Demo requester")],
		});
		created.requiredBy = payload.requiredBy;
		created.createdAt = new Date().toISOString();
		store = [created, ...store];
		return delay({ id: created.id, requestNumber: created.requestNumber });
	},

	approve: async (id: string) => {
		const d = find(id);
		patch(id, {
			status: "APPROVED",
			timeline: [...d.timeline, makeEntry("APPROVED", "Demo approver")],
		});
		await delay(undefined);
	},

	reject: async (id: string, reason: string) => {
		const d = find(id);
		patch(id, {
			status: "REJECTED",
			rejectionReason: reason,
			timeline: [...d.timeline, makeEntry("REJECTED", "Demo approver", reason)],
		});
		await delay(undefined);
	},

	cancel: async (id: string, reason: string) => {
		const d = find(id);
		patch(id, {
			status: "CANCELLED",
			timeline: [...d.timeline, makeEntry("CANCELLED", d.requestedByName, reason)],
		});
		await delay(undefined);
	},

	deliver: async (id: string, payload: DeliverHandoutPayload) => {
		const d = find(id);
		patch(id, {
			status: "CLOSED",
			delivery: {
				handedToName: payload.handedToName,
				deliveredOn: new Date(payload.deliveredOn).toISOString(),
				note: payload.note || null,
				deliveredByName: "Demo delivery",
			},
			timeline: [
				...d.timeline,
				makeEntry("DELIVERED", "Demo delivery", payload.note ?? null),
			],
		});
		await delay(undefined);
	},

	/**
	 * Stand-in for the CRF shop's POST /crf-shop/stock-check, used only for the
	 * "Stock now" column and the shortage banner in mock mode.
	 */
	stockCheck: async (
		lines: { sku: string; quantity: number }[],
	): Promise<ShopStockCheckResult> => {
		const result = lines.map(({ sku, quantity }) => {
			const available = MOCK_STOCK[sku] ?? 50;
			const status =
				available <= 0
					? "OUT_OF_STOCK"
					: available < quantity
						? "PARTIAL"
						: "AVAILABLE";
			return { sku, requested: quantity, available, status };
		});
		// Cast: the real result type may carry extra fields the UI never reads.
		return delay({ reserved: false, lines: result } as unknown as ShopStockCheckResult);
	},
};
