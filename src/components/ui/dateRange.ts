// utils/dateRange.ts
// Shared event-date helpers for the EPC views (ActivityDetailsSection,
// DateRangeSection, …). Everything works on CALENDAR DAYS so a date never
// shifts by a day because of time zones, and "1 day" vs "N days" is decided
// in exactly one place.

const DAY_MS = 86_400_000;

/**
 * "2026-10-17", "2026-10-17T00:00:00Z" and "2026-10-17T00:00:00.000Z" are
 * date-only values (Prisma @db.Date serialises like this) — read them as-is.
 * Anything else is a real timestamp and is read in the user's local time.
 */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.0+)?Z)?$/;

/** UTC-midnight timestamp of the calendar day, or null if unparseable. */
export const toCalendarDay = (value?: string | null): number | null => {
	if (!value) return null;

	const match = DATE_ONLY.exec(value.trim());

	if (match) {
		return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return null;

	return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

export type EventSchedule = {
	/**
	 * single  → from and to are the same day (or `to` is missing)
	 * range   → multi-day event
	 * invalid → no usable start date, or `to` is before `from`
	 */
	kind: "single" | "range" | "invalid";
	days: number;
	/** "1 day" · "3 days" · "--" */
	durationLabel: string;
	from: number | null;
	to: number | null;
};

export const getEventSchedule = (
	fromDate?: string | null,
	toDate?: string | null,
): EventSchedule => {
	const from = toCalendarDay(fromDate);
	// A missing end date means a one-day event on the start date.
	const to = toCalendarDay(toDate) ?? from;

	if (from === null || to === null || to < from) {
		return {
			kind: "invalid",
			days: 0,
			durationLabel: "--",
			from: null,
			to: null,
		};
	}

	const days = Math.round((to - from) / DAY_MS) + 1;

	return {
		kind: days === 1 ? "single" : "range",
		days,
		durationLabel: `${days} ${days === 1 ? "day" : "days"}`,
		from,
		to,
	};
};

/** 1778457600000 → "17 Oct 2026" */
export const formatCalendarDay = (day: number | null): string =>
	day === null
		? "--"
		: new Date(day).toLocaleDateString("en-IN", {
				day: "numeric",
				month: "short",
				year: "numeric",
				timeZone: "UTC",
			});

/** → "Sat" */
export const getCalendarWeekday = (day: number | null): string =>
	day === null
		? ""
		: new Date(day).toLocaleDateString("en-IN", {
				weekday: "short",
				timeZone: "UTC",
			});

/** Value for <time dateTime="…"> */
export const toDateTimeAttr = (day: number | null): string | undefined =>
	day === null ? undefined : new Date(day).toISOString().slice(0, 10);
