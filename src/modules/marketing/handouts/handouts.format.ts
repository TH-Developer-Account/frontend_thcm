// handouts/handouts.format.ts
// Display helpers (dd MMM yyyy, with time). Money / quantity reuse the CRF's
// formatCrfAmount / formatCrfQuantity so numbers look identical everywhere.

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

export const formatHandoutDate = (value?: string | null) => {
	if (!value) return "--";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "--" : dateFormatter.format(date);
};

export const formatHandoutDateTime = (value?: string | null) => {
	if (!value) return "--";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "--" : dateTimeFormatter.format(date);
};

/** "1 item" / "3 items" */
export const pluralItems = (count: number) =>
	`${count} ${count === 1 ? "item" : "items"}`;

/* ---- Date picker ⇄ form value ("YYYY-MM-DD", what <input type="date"> used) ---- */

const pad = (n: number) => String(n).padStart(2, "0");

/** Date → "YYYY-MM-DD" in local time (no UTC shift, no display formatting). */
export const toDateInputValue = (date: Date) =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "YYYY-MM-DD" (or "YYYY-MM-DDTHH:mm") → local Date, or undefined. */
export const fromDateInputValue = (value?: string | null) => {
	if (!value) return undefined;
	const date = new Date(`${value.slice(0, 10)}T00:00:00`);
	return Number.isNaN(date.getTime()) ? undefined : date;
};
