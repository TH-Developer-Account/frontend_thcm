// handouts/handouts.mock.ts
// In-memory stand-in for the /handouts routes (VITE_HANDOUTS_MOCK=true), so
// the whole flow — request → approve/reject → deliver → closed — can be
// clicked through before the backend exists. State lives for the page session.
//
// The mock grants every action flag the status allows; the real backend
// computes them per caller (requester / approver / delivery team).

import type {
	CreateHandoutPayload,
	DeliverHandoutPayload,
	HandoutDetail,
	HandoutListParams,
	HandoutListResponse,
	HandoutPermissions,
	HandoutStatus,
	HandoutSummary,
	HandoutTimelineEntry,
} from "./handouts.types";

const delay = <T>(value: T, ms = 250) =>
	new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const isoDaysFromNow = (days: number) =>
	new Date(Date.now() + days * 86_400_000).toISOString();

const permissionsFor = (status: HandoutStatus): HandoutPermissions => ({
	canView: true,
	canCancel: status === "PENDING_APPROVAL",
	canApprove: status === "PENDING_APPROVAL",
	canReject: status === "PENDING_APPROVAL",
	canDeliver: status === "APPROVED",
});

const makeEntry = (
	action: HandoutTimelineEntry["action"],
	comment: string | null = null,
): HandoutTimelineEntry => ({
	id: crypto.randomUUID(),
	action,
	byName: "Demo user",
	at: new Date().toISOString(),
	comment,
});

const seed = (
	n: number,
	status: HandoutStatus,
	purpose: string,
): HandoutDetail => ({
	id: `mock-${n}`,
	requestNumber: `HO-${String(n).padStart(4, "0")}`,
	purpose,
	status,
	requiredBy: isoDaysFromNow(3),
	createdAt: isoDaysFromNow(-1),
	requestedByName: "Demo user",
	requestedByDesignation: "General Manager",
	requestedByDepartment: "Sales",
	deliverTo: "Block B, 2nd floor, Reception",
	contactPhone: "9800000010",
	remarks: null,
	items: [
		{
			id: `mock-${n}-1`,
			sku: "MOCK-BOTTLE-BLUE",
			title: "Steel water bottle",
			variantTitle: "Blue · 750 ml",
			imageUrl: null,
			quantity: 10,
			rate: 450,
			amount: 4500,
		},
	],
	itemCount: 1,
	totalQuantity: 10,
	totalAmount: 4500,
	timeline: [makeEntry("SUBMITTED")],
	delivery: null,
	rejectionReason: null,
	permissions: permissionsFor(status),
});

let store: HandoutDetail[] = [
	seed(42, "PENDING_APPROVAL", "Visiting customer delegation"),
	seed(39, "APPROVED", "Dealer principals visit"),
	seed(33, "CLOSED", "Plant tour, college group"),
];

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
		const n = 43 + store.length;
		const items = payload.items.map((item, index) => ({
			id: `mock-${n}-${index}`,
			sku: item.sku,
			title: item.title ?? item.sku,
			variantTitle: item.variantTitle ?? null,
			imageUrl: item.imageUrl ?? null,
			quantity: item.quantity,
			rate: item.rate,
			amount: item.quantity * item.rate,
		}));
		const created: HandoutDetail = {
			...seed(n, "PENDING_APPROVAL", payload.purpose),
			requiredBy: payload.requiredBy,
			deliverTo: payload.deliverTo,
			contactPhone: payload.contactPhone,
			remarks: payload.remarks || null,
			items,
			itemCount: items.length,
			totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
			totalAmount: items.reduce((s, i) => s + i.amount, 0),
		};
		store = [created, ...store];
		return delay({ id: created.id, requestNumber: created.requestNumber });
	},

	approve: async (id: string) => {
		const d = find(id);
		patch(id, {
			status: "APPROVED",
			timeline: [...d.timeline, makeEntry("APPROVED")],
		});
		await delay(undefined);
	},

	reject: async (id: string, reason: string) => {
		const d = find(id);
		patch(id, {
			status: "REJECTED",
			rejectionReason: reason,
			timeline: [...d.timeline, makeEntry("REJECTED", reason)],
		});
		await delay(undefined);
	},

	cancel: async (id: string, reason: string) => {
		const d = find(id);
		patch(id, {
			status: "CANCELLED",
			timeline: [...d.timeline, makeEntry("CANCELLED", reason)],
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
				deliveredByName: "Demo user",
			},
			timeline: [...d.timeline, makeEntry("DELIVERED", payload.note ?? null)],
		});
		await delay(undefined);
	},
};
