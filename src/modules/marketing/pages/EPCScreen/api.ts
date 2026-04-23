import type { DateRange } from "react-day-picker";

export const fetchDropdownOptions = async () => {
	const res = await fetch("/api/epc/options");
	if (!res.ok) throw new Error("Failed to fetch options");
	return res.json();
};

export const fetchBranchesByZone = async (regionId: string) => {
	const res = await fetch(`/api/epc/branches?region=${regionId}`);
	if (!res.ok) throw new Error("Failed to fetch branches");
	return res.json();
};

export const generateEpfNumber = async () => {
	const res = await fetch("/api/epc/generate-number");
	if (!res.ok) throw new Error("Failed to generate EPF number");
	return res.json();
};

export const fetchEpcById = async (id: string) => {
	const res = await fetch(`/api/epc/${id}`);
	if (!res.ok) throw new Error("Failed to fetch EPC");
	return res.json();
};

export function parseApiDate(dateStr?: string | null) {
	if (!dateStr) return undefined;

	const date = new Date(dateStr);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toDateRange(from?: string, to?: string): DateRange | undefined {
	const parsedFrom = parseApiDate(from);
	const parsedTo = parseApiDate(to);

	if (!parsedFrom && !parsedTo) return undefined;

	return {
		from: parsedFrom,
		to: parsedTo,
	};
}

export function toIsoDateString(date?: Date) {
	return date ? date.toISOString() : "";
}
