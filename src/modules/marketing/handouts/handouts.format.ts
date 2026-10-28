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
