// artworks/artworks.format.ts
// Display helpers. Kept local so the module does not depend on the CRF or
// Handouts modules.

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

export const formatArtworkDate = (value?: string | null) => {
	if (!value) return "--";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "--" : dateFormatter.format(date);
};

export const formatArtworkDateTime = (value?: string | null) => {
	if (!value) return "--";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "--" : dateTimeFormatter.format(date);
};

/** "From – To" when the event spans days, else just the one date. */
export const formatArtworkDateRange = (
	from?: string | null,
	to?: string | null,
) => {
	const start = formatArtworkDate(from);
	const end = formatArtworkDate(to);
	return end === "--" || end === start ? start : `${start} – ${end}`;
};

/** "1920 × 1080 px" — empty when no size was given. */
export const formatArtworkSize = (
	width?: string | null,
	height?: string | null,
	unit?: string | null,
) => {
	if (!width || !height) return "--";
	return `${width} × ${height}${unit ? ` ${unit}` : ""}`;
};

/** "today" / "tomorrow" / "in 5 days" / "3 days ago" */
export const describeDays = (days: number) => {
	if (days === 0) return "today";
	if (days === 1) return "tomorrow";
	if (days > 1) return `in ${days} days`;
	if (days === -1) return "yesterday";
	return `${Math.abs(days)} days ago`;
};

export const pluralArtworks = (count: number) =>
	`${count} ${count === 1 ? "artwork" : "artworks"}`;

/** Same rule the backend applies: a well-formed http(s) URL. */
export const isValidHttpUrl = (value: string) => {
	try {
		const url = new URL(value.trim());
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};
