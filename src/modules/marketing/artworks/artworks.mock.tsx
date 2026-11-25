// artworks/artworks.mock.tsx
// MOCK-LAYER (delete this file when the real API is live)
//
// One file holds the whole mock layer, same idea as Handouts' three:
//   1. the "Use mock data" runtime switch (remembered in localStorage;
//      VITE_ARTWORKS_MOCK=true is the first-visit default)
//   2. <ArtworkMockToggle /> — the checkbox
//   3. artworkMockApi — in-memory stand-in for the /artworks routes
//
// Every screen can be clicked through; state lives for the page session only.
// Seed data covers each situation:
//   AW-0051  links pending, event in 2 days   (urgent banner; includes a
//            CUSTOM artwork: non-standard size + written brief)
//   AW-0050  links pending, event TODAY
//   AW-0049  partly shared (2 of 4), event in 6 days
//   AW-0048  links pending, event in 20 days
//   AW-0047  all links shared, event in 9 days (still editable)
//   AW-0046  links pending, event date passed, not yet conducted
//   AW-0045  all shared, event conducted     (read-only)
//   AW-0044  event cancelled                 (read-only)
// Any EPC id that is not a mock one gets AW-0049 from getByEpc, so the
// read-only panel can be seen on any EPC's CRF tab in mock mode.

import { useSyncExternalStore } from "react";

import type {
	ArtworkDetail,
	ArtworkEventState,
	ArtworkItem,
	ArtworkListParams,
	ArtworkListResponse,
	ArtworkRequestStatus,
	ArtworkSummary,
	ArtworkTimelineEntry,
	ShareLinkInput,
} from "./artworks.types";

/* ========================================================================== */
/*                          1. Runtime switch + checkbox                       */
/* ========================================================================== */

const STORAGE_KEY = "artworks:use-mock-data";
const listeners = new Set<() => void>();

const readInitial = (): boolean => {
	try {
		const saved = window.localStorage.getItem(STORAGE_KEY);
		if (saved !== null) return saved === "true";
	} catch {
		// localStorage blocked, fall through to the env default.
	}
	return import.meta.env.VITE_ARTWORKS_MOCK === "true";
};

let enabled = readInitial();

export const isArtworkMockEnabled = () => enabled;

export const setArtworkMockEnabled = (next: boolean) => {
	enabled = next;
	try {
		window.localStorage.setItem(STORAGE_KEY, String(next));
	} catch {
		// ignore: the in-memory value still applies for this session.
	}
	listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/** [isMock, setMock]. Components using it re-render when the checkbox flips. */
export function useArtworkMockMode() {
	const isMock = useSyncExternalStore(
		subscribe,
		isArtworkMockEnabled,
		isArtworkMockEnabled,
	);
	return [isMock, setArtworkMockEnabled] as const;
}

export function ArtworkMockToggle() {
	const [isMock, setMock] = useArtworkMockMode();

	return (
		<label
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "var(--space-2)",
				fontSize: "0.8125rem",
				cursor: "pointer",
				userSelect: "none",
			}}
		>
			<input
				type="checkbox"
				checked={isMock}
				onChange={(event) => setMock(event.target.checked)}
			/>
			Use mock data
		</label>
	);
}

/* ========================================================================== */
/*                                 2. Mock data                               */
/* ========================================================================== */

const MAX_EDIT_ROUNDS = 5;
const REMIND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const delay = <T,>(value: T, ms = 250) =>
	new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const DAY_MS = 86_400_000;

const isoDaysFromNow = (days: number, hour = 10) => {
	const date = new Date(Date.now() + days * DAY_MS);
	date.setHours(hour, 0, 0, 0);
	return date.toISOString();
};

const startOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const daysBetweenNowAnd = (iso: string) =>
	Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / DAY_MS);

type EpcStatus = "APPROVED" | "CONDUCTED" | "CANCELLED";

type MockRow = {
	id: string;
	epcId: string;
	epcNumber: string;
	eventName: string;
	fromInDays: number;
	lengthDays: number;
	epcStatus: EpcStatus;
	requestedByName: string;
	proposer: NonNullable<ArtworkDetail["proposer"]>;
	createdDaysAgo: number;
	items: ArtworkItem[];
	timeline: ArtworkTimelineEntry[];
};

/** Same rule as the backend's computeEventTiming. */
const timingOf = (
	row: MockRow,
): Pick<ArtworkSummary, "eventState" | "daysUntil" | "canShare"> => {
	if (row.epcStatus === "CANCELLED") {
		return { eventState: "CANCELLED", daysUntil: null, canShare: false };
	}
	if (row.epcStatus !== "APPROVED") {
		return { eventState: "CLOSED", daysUntil: null, canShare: false };
	}
	const days = daysBetweenNowAnd(isoDaysFromNow(row.fromInDays));
	const toEnd = days + row.lengthDays - 1;
	let eventState: ArtworkEventState;
	if (days > 0) eventState = "UPCOMING";
	else if (days === 0) eventState = "TODAY";
	else if (toEnd >= 0) eventState = "ONGOING";
	else eventState = "PASSED";
	return { eventState, daysUntil: days, canShare: true };
};

/** A link counts only while no change request is open on it. */
const isShared = (i: ArtworkItem) => Boolean(i.link) && i.status !== "EDIT_REQUESTED";

const statusOf = (items: ArtworkItem[]): ArtworkRequestStatus => {
	const shared = items.filter(isShared).length;
	if (shared === 0) return "PENDING";
	return shared === items.length ? "COMPLETED" : "IN_PROGRESS";
};

const entry = (
	action: ArtworkTimelineEntry["action"],
	byName: string,
	daysAgo: number,
	hour: number,
	items?: string[],
): ArtworkTimelineEntry => ({
	id: crypto.randomUUID(),
	action,
	byName,
	at: isoDaysFromNow(-daysAgo, hour),
	metadata: items ? { items } : null,
});

const LINK = (slug: string) => `https://drive.example.com/artworks/${slug}`;

const item = (
	n: number,
	index: number,
	title: string,
	width: string,
	height: string,
	quantity: number,
	shared?: string, // slug → already has a link
): ArtworkItem => ({
	id: `mock-aw-${n}-${index}`,
	title,
	description: null,
	quantity,
	width,
	height,
	unit: "px",
	link: shared ? LINK(shared) : null,
	linkNote: null,
	status: shared ? "LINK_SHARED" : "AWAITING_LINK",
	editRounds: [],
	attachments: [],
	lastReminderAt: null,
	sharedAt: shared ? isoDaysFromNow(-1, 14) : null,
	sharedByName: shared ? "Demo marketing" : null,
});

const BANNER = (n: number, i: number, shared?: string) =>
	item(n, i, "Event stage banner", "3840", "2160", 1, shared);
const SOCIAL = (n: number, i: number, shared?: string) =>
	item(n, i, "Social media post", "1080", "1080", 2, shared);
const STANDEE = (n: number, i: number, shared?: string) =>
	item(n, i, "Standee design", "2480", "3508", 4, shared);
const INVITE = (n: number, i: number, shared?: string) =>
	item(n, i, "Digital invitation", "1080", "1920", 1, shared);

/** A custom artwork: non-standard size + the requester's written brief. */
const CUSTOM_WALL = (n: number, i: number): ArtworkItem => ({
	...item(n, i, "Custom LED wall loop", "5120", "1080", 1),
	isCustom: true,
	productName: "Event stage banner",
	artworkType: "Custom artwork",
	attachments: [
		{
			id: "mock-att-1",
			fileName: "wall-layout.png",
			description: "Rough layout, logos on the right",
			sizeBytes: 182_000,
			url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='96' height='96' fill='%23e5e7eb'/><text x='48' y='54' font-size='14' text-anchor='middle' fill='%236b7280'>ref</text></svg>",
		},
	],
	description:
		"Ultra-wide LED wall loop for the demo arena. Brand colours, dealer logos on the right, event date and venue in the first 5 seconds. Deliver as MP4 (30 s loop) and a PNG poster frame.",
});

const PEOPLE = {
	one: {
		name: "Demo requester",
		email: "requester@example.com",
		phone: "9800000010",
	},
	two: {
		name: "Demo requester two",
		email: "requester2@example.com",
		phone: "9800000020",
	},
	three: {
		name: "Demo requester three",
		email: "requester3@example.com",
		phone: "9800000030",
	},
};

const row = (o: {
	n: number;
	eventName: string;
	fromInDays: number;
	lengthDays?: number;
	epcStatus?: EpcStatus;
	who: keyof typeof PEOPLE;
	createdDaysAgo: number;
	items: ArtworkItem[];
	timeline: ArtworkTimelineEntry[];
}): MockRow => ({
	id: `mock-aw-${o.n}`,
	epcId: `mock-epc-${o.n}`,
	epcNumber: `AW-${String(o.n).padStart(4, "0")}`,
	eventName: o.eventName,
	fromInDays: o.fromInDays,
	lengthDays: o.lengthDays ?? 1,
	epcStatus: o.epcStatus ?? "APPROVED",
	requestedByName: PEOPLE[o.who].name,
	proposer: PEOPLE[o.who],
	createdDaysAgo: o.createdDaysAgo,
	items: o.items,
	timeline: o.timeline,
});

const created = (daysAgo: number) =>
	entry("REQUEST_CREATED", "System", daysAgo, 9);
const reminder = (daysAgo: number) =>
	entry("REMINDER_SENT", "System", daysAgo, 9);

let store: MockRow[] = [
	row({
		n: 51,
		eventName: "Excavator demo day, Bengaluru",
		fromInDays: 2,
		who: "one",
		createdDaysAgo: 4,
		items: [BANNER(51, 1), SOCIAL(51, 2), STANDEE(51, 3), CUSTOM_WALL(51, 4)],
		timeline: [created(4), reminder(1)],
	}),
	row({
		n: 50,
		eventName: "Dealer meet, Mysuru",
		fromInDays: 0,
		who: "two",
		createdDaysAgo: 6,
		items: [INVITE(50, 1), STANDEE(50, 2)],
		timeline: [created(6), reminder(3), reminder(1), reminder(0)],
	}),
	row({
		n: 49,
		eventName: "Customer day, Hubballi",
		fromInDays: 6,
		who: "three",
		createdDaysAgo: 3,
		items: [
			BANNER(49, 1, "banner-hubballi"),
			SOCIAL(49, 2, "social-hubballi"),
			STANDEE(49, 3),
			INVITE(49, 4),
		],
		timeline: [
			created(3),
			entry("LINKS_SHARED", "Demo marketing", 1, 14, [
				"Event stage banner",
				"Social media post",
			]),
		],
	}),
	row({
		n: 48,
		eventName: "Road show, Mangaluru",
		fromInDays: 20,
		lengthDays: 3,
		who: "one",
		createdDaysAgo: 1,
		items: [BANNER(48, 1), INVITE(48, 2)],
		timeline: [created(1)],
	}),
	row({
		n: 47,
		eventName: "Product launch, Belagavi",
		fromInDays: 9,
		who: "two",
		createdDaysAgo: 5,
		items: [BANNER(47, 1, "banner-belagavi"), INVITE(47, 2, "invite-belagavi")],
		timeline: [
			created(5),
			entry("LINKS_SHARED", "Demo marketing", 2, 11, [
				"Event stage banner",
				"Digital invitation",
			]),
			entry("COMPLETED", "Demo marketing", 2, 11),
		],
	}),
	row({
		n: 46,
		eventName: "Service camp, Tumakuru",
		fromInDays: -3,
		who: "three",
		createdDaysAgo: 12,
		items: [SOCIAL(46, 1), STANDEE(46, 2)],
		timeline: [created(12), reminder(9), reminder(5)],
	}),
	row({
		n: 45,
		eventName: "Expo stall, Davanagere",
		fromInDays: -8,
		epcStatus: "CONDUCTED",
		who: "one",
		createdDaysAgo: 20,
		items: [BANNER(45, 1, "banner-expo"), STANDEE(45, 2, "standee-expo")],
		timeline: [
			created(20),
			entry("LINKS_SHARED", "Demo marketing", 14, 12, [
				"Event stage banner",
				"Standee design",
			]),
			entry("COMPLETED", "Demo marketing", 14, 12),
		],
	}),
	row({
		n: 44,
		eventName: "Open house, Ballari",
		fromInDays: 4,
		epcStatus: "CANCELLED",
		who: "two",
		createdDaysAgo: 10,
		items: [INVITE(44, 1)],
		timeline: [created(10)],
	}),
];

/* ---- shaping (what the backend's shapeSummary / buildDetail return) ---- */

const toSummary = (r: MockRow): ArtworkSummary => ({
	id: r.id,
	epcId: r.epcId,
	epcNumber: r.epcNumber,
	eventName: r.eventName,
	eventFromDate: isoDaysFromNow(r.fromInDays, 9),
	eventToDate: isoDaysFromNow(r.fromInDays + r.lengthDays - 1, 18),
	status: statusOf(r.items),
	itemCount: r.items.length,
	sharedCount: r.items.filter(isShared).length,
	editRequestedCount: r.items.filter((i) => i.status === "EDIT_REQUESTED").length,
	requestedByName: r.requestedByName,
	createdAt: isoDaysFromNow(-r.createdDaysAgo, 15),
	...timingOf(r),
});

const toDetail = (r: MockRow): ArtworkDetail => {
	const summary = toSummary(r);
	return {
		...summary,
		proposer: r.proposer,
		items: r.items,
		timeline: r.timeline,
		// The real backend also requires ARTWORK write; the mock grants it.
		permissions: {
			canView: true,
			canShareLinks: summary.canShare,
			// The mock user is both requester and team member.
			canRequestEdit: r.items.some((i) => i.link && i.status !== "EDIT_REQUESTED"),
			canRemind: r.items.some((i) => !i.link || i.status === "EDIT_REQUESTED"),
			maxEditRounds: MAX_EDIT_ROUNDS,
		},
	};
};

const find = (id: string) => {
	const found = store.find((r) => r.id === id);
	if (!found) throw new Error("Artwork request not found.");
	return found;
};

const isValidHttpUrl = (value: string) => {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};

/* ========================================================================== */
/*                                   3. API                                   */
/* ========================================================================== */

export const artworkMockApi = {
	list: async (params: ArtworkListParams): Promise<ArtworkListResponse> => {
		const query = params.search?.trim().toLowerCase();
		const summaries = store
			.map(toSummary)
			.filter((s) => {
				if (
					params.view === "pending" &&
					(s.status === "COMPLETED" || !s.canShare)
				)
					return false;
				if (params.view === "shared" && s.status !== "COMPLETED") return false;
				if (
					query &&
					!`${s.epcNumber} ${s.eventName}`.toLowerCase().includes(query)
				)
					return false;
				return true;
			})
			.sort((a, b) => {
				const diff =
					new Date(a.eventFromDate ?? 0).getTime() -
					new Date(b.eventFromDate ?? 0).getTime();
				return params.view === "pending" ? diff : -diff;
			});

		const start = (params.page - 1) * params.pageSize;
		return delay({
			items: summaries.slice(start, start + params.pageSize),
			total: summaries.length,
		});
	},

	get: async (id: string) => delay(toDetail(find(id))),

	getByEpc: async (epcId: string) => {
		const match =
			store.find((r) => r.epcId === epcId) ??
			store.find((r) => r.epcNumber === "AW-0049"); // any other EPC: show the panel
		return delay(match ? toDetail(match) : null);
	},

	shareLinks: async (id: string, links: ShareLinkInput[]) => {
		const target = find(id);
		if (!timingOf(target).canShare) {
			throw new Error(
				"Links can only be shared while the event is approved and not yet conducted",
			);
		}

		// Validate everything first, like the backend, so nothing half-saves.
		for (const input of links) {
			const link = input.link?.trim() ?? "";
			if (link && !isValidHttpUrl(link)) {
				throw new Error(`"${link.slice(0, 60)}" is not a valid link`);
			}
			if (!target.items.some((i) => i.id === input.itemId)) {
				throw new Error(`Unknown artwork line "${input.itemId}"`);
			}
		}

		const wasComplete = statusOf(target.items) === "COMPLETED";
		const setNow: string[] = [];
		const clearedNow: string[] = [];
		const updatedNow: string[] = [];

		const items = target.items.map((existing) => {
			const input = links.find((l) => l.itemId === existing.id);
			if (!input) return existing;
			const link = input.link?.trim() || null;
			const wasEditRequested = existing.status === "EDIT_REQUESTED";
			// Same URL is fine when the requester asked for changes (file replaced in place).
			if (link === existing.link && !wasEditRequested) return existing;
			if (wasEditRequested && link) {
				updatedNow.push(existing.title);
			} else {
				(link ? setNow : clearedNow).push(existing.title);
			}
			const nowIso = new Date().toISOString();
			return {
				...existing,
				link,
				sharedAt: link ? nowIso : null,
				sharedByName: link ? "Demo marketing" : null,
				status: link ? ("LINK_SHARED" as const) : ("AWAITING_LINK" as const),
				editRounds: (existing.editRounds ?? []).map((round) =>
					round.resolvedAt || !link ? round : { ...round, resolvedAt: nowIso },
				),
			};
		});

		if (setNow.length + clearedNow.length + updatedNow.length === 0) {
			throw new Error("No changes to save");
		}

		const now = (
			action: ArtworkTimelineEntry["action"],
			names?: string[],
		): ArtworkTimelineEntry => ({
			id: crypto.randomUUID(),
			action,
			byName: "Demo marketing",
			at: new Date().toISOString(),
			metadata: names ? { items: names } : null,
		});

		const timeline = [...target.timeline];
		if (setNow.length) timeline.push(now("LINKS_SHARED", setNow));
		if (updatedNow.length) timeline.push(now("LINK_UPDATED", updatedNow));
		if (clearedNow.length) timeline.push(now("LINKS_CLEARED", clearedNow));
		if (!wasComplete && statusOf(items) === "COMPLETED") {
			timeline.push(now("COMPLETED"));
		}

		store = store.map((r) => (r.id === id ? { ...r, items, timeline } : r));
		return delay({ id, status: statusOf(items) as string });
	},
	/** Requester asks for changes on one shared artwork. */
	requestEdit: async (id: string, itemId: string, note: string) => {
		const target = find(id);
		if (!timingOf(target).canShare) {
			throw new Error("Edits can only be requested while the event is approved");
		}
		const existing = target.items.find((i) => i.id === itemId);
		if (!existing) throw new Error(`Unknown artwork line "${itemId}"`);
		if (!existing.link) throw new Error("There is no shared link to edit yet");
		if (existing.status === "EDIT_REQUESTED") {
			throw new Error("An edit request is already open for this artwork");
		}
		const text = note.trim();
		if (text.length < 5 || text.length > 1000) {
			throw new Error("Describe the change in 5 to 1000 characters");
		}
		if ((existing.editRounds?.length ?? 0) >= MAX_EDIT_ROUNDS) {
			throw new Error(`You can request edits ${MAX_EDIT_ROUNDS} times per artwork`);
		}

		const nowIso = new Date().toISOString();
		const items = target.items.map((i) =>
			i.id === itemId
				? {
						...i,
						status: "EDIT_REQUESTED" as const,
						editRounds: [
							...(i.editRounds ?? []),
							{
								id: crypto.randomUUID(),
								note: text,
								previousLink: i.link,
								requestedByName: target.proposer.name,
								createdAt: nowIso,
								resolvedAt: null,
							},
						],
					}
				: i,
		);
		const timeline = [
			...target.timeline,
			{
				id: crypto.randomUUID(),
				action: "EDIT_REQUESTED" as const,
				byName: target.proposer.name,
				at: nowIso,
				metadata: { items: [existing.title] },
			},
		];
		store = store.map((r) => (r.id === id ? { ...r, items, timeline } : r));
		return delay({ id, itemId });
	},

	/** Requester nudges the team (one per artwork per 24 h). */
	remind: async (id: string, itemId: string) => {
		const target = find(id);
		const existing = target.items.find((i) => i.id === itemId);
		if (!existing) throw new Error(`Unknown artwork line "${itemId}"`);
		if (existing.link && existing.status !== "EDIT_REQUESTED") {
			throw new Error("Nothing is pending on this artwork");
		}
		const last = existing.lastReminderAt ? new Date(existing.lastReminderAt).getTime() : 0;
		if (Date.now() - last < REMIND_COOLDOWN_MS) {
			throw new Error("You already reminded the team in the last 24 hours");
		}
		const nowIso = new Date().toISOString();
		const items = target.items.map((i) =>
			i.id === itemId ? { ...i, lastReminderAt: nowIso } : i,
		);
		const timeline = [
			...target.timeline,
			{
				id: crypto.randomUUID(),
				action: "REMINDER_SENT" as const,
				byName: target.proposer.name,
				at: nowIso,
				metadata: { items: [existing.title] },
			},
		];
		store = store.map((r) => (r.id === id ? { ...r, items, timeline } : r));
		return delay({ id, itemId });
	},
};
