// utils/epcSubmission.ts
import { formatDate, parseDateOnly } from "../../../../../utils/format";
import { getZoneCodeForBranch } from "./epc.zonemap";
/* ───────────────────────── Submission helpers ───────────────────────── */

type SubmissionLike = {
	status?: string | null;
	activeWorkflow?: unknown;
	workflow_id?: string | null;
};

export const isEpcSubmitted = (epc?: SubmissionLike | null): boolean => {
	if (!epc) return false;

	// A workflow attached is the only real proof of submission.
	if (epc.activeWorkflow || epc.workflow_id) return true;

	// No workflow → not submitted. PENDING is the normal "created, not yet
	// submitted" state. SUBMITTED is also treated as NOT submitted here because
	// older backends set it the moment an EPF was merely saved; without a
	// workflow it must never skip the Review & Submit step. Any other status
	// (APPROVED, REJECTED, CLOSED …) only exists after a workflow ran.
	const status = String(epc.status ?? "")
		.trim()
		.toUpperCase();
	return status !== "" && status !== "PENDING" && status !== "SUBMITTED";
};

/**
 * Can this user open the EPC view?
 *   • submitted EPC → yes (approvers, validators, proposer …)
 *   • not submitted → only its creator (view shows a "Not submitted" banner)
 */
export const canOpenEpcView = (
	epc: {
		created_by_id?: string | null;
		status?: string | null;
		activeWorkflow?: unknown;
		workflow_id?: string | null;
	},
	currentUserId?: string | null,
): boolean =>
	isEpcSubmitted(epc) ||
	(Boolean(currentUserId) && epc.created_by_id === currentUserId);

/* ───────────────────────── Master option helpers ───────────────────────── */

export type EpcOption = {
	value: string;
	label: string;
	code?: string;
	description?: string;
	department?: string;
	[key: string]: any;
};

export const findOption = (
	options: EpcOption[] = [],
	value?: string | null,
) => {
	if (!value) return null;

	return (
		options.find(
			(option) =>
				option.value === value ||
				option.code === value ||
				option.label === value,
		) ?? null
	);
};

/** Master code of a region/branch option (API may expose it under several names). */
export const getOptionCode = (option?: EpcOption | null) =>
	String(option?.code ?? option?.branch_code ?? option?.region_code ?? "")
		.trim()
		.toUpperCase();

/* ───────────────────────── Event date helpers ───────────────────────── */

export type EventDateMode = "single" | "range";

/**
 * Lower-cases, fixes the "demostration" typo and turns every run of
 * punctuation/whitespace into one space, so "Product-Launch", "Product Launch"
 * and "Customer Meet -Small" all compare cleanly.
 */
const normalizeEventName = (name?: string | null): string =>
	String(name ?? "")
		.toLowerCase()
		.replace(/demostration/g, "demonstration")
		.replace(/[^a-z0-9&]+/g, " ")
		.trim();

const toKeySet = (names: string[]) => new Set(names.map(normalizeEventName));

/**
 * Source: MarketingEventOutcomes.xlsx → Outcomes sheet, plus the labels used
 * in the Event Name master. Names are matched exactly OR as a prefix, so
 * "Customer Meet - Big (Above 50+ customers)" and "Customer Meet -Small"
 * both match "Customer Meet".
 */
const SINGLE_DATE_EVENTS = toKeySet([
	"Customer Meet",
	"KA Customer Meet",
	"Customer Meet-Key Account",
	"Product Launch",
	"Plant Visit",
	"Operator Meet",
	"Financier Meet",
	"General Report",
]);

const RANGE_DATE_EVENTS = toKeySet([
	"Loan Mela",
	"Exhibition",
	"Roadshow",
	"Machine Demonstration",
	"Stand Alone Fuel & Production Study",
	"Fuel & Production Benchmarking Study",
	"Service Campaign",
	"Parts Mela",
	"Training to Customer Staff",
	"Training to Operators",
	"Training to Mechanics",
]);

const matchesAny = (key: string, names: Set<string>) => {
	for (const name of names) {
		if (key === name || key.startsWith(`${name} `)) return true;
	}
	return false;
};

/**
 * Date mode for an event name. Events not in either list (Application Study,
 * Key Handovers, Newspaper Advertisement, Hoarding, Customer sign Boards, or a
 * newly typed event) fall back to `fallback` — "range", the previous behaviour.
 */
export const getEventDateMode = (
	eventName?: string | null,
	fallback: EventDateMode = "range",
): EventDateMode => {
	const key = normalizeEventName(eventName);
	if (matchesAny(key, SINGLE_DATE_EVENTS)) return "single";
	if (matchesAny(key, RANGE_DATE_EVENTS)) return "range";
	return fallback;
};

/** Resolves the mode from the selected event option (falls back to its raw value/label). */
export const resolveEventDateMode = (
	eventNames: EpcOption[] | undefined,
	selected?: string | null,
	readOnlyLabel?: string,
): EventDateMode => {
	const option = findOption(eventNames, selected);
	return getEventDateMode(option?.label ?? readOnlyLabel ?? selected);
};

export const getEventDateLabel = (mode: EventDateMode): string =>
	mode === "single" ? "Event Date" : "Event [From - To]";

export const getEventDateHelperText = (mode: EventDateMode): string =>
	mode === "single"
		? "Select the date of the event."
		: "Select the start and end date of the event.";

/**
 * "2026-10-05" | "05-10-2026" | ISO → "05/10/2026 - 07/10/2026".
 * Single mode → just "05/10/2026".
 */
export const formatEventDateRange = (
	from?: string,
	to?: string,
	mode: EventDateMode = "range",
): string => {
	const fromLabel = formatDate(parseDateOnly(from));
	const toLabel = formatDate(parseDateOnly(to));

	if (mode === "single") return fromLabel || toLabel || "";
	if (fromLabel && toLabel) return `${fromLabel} - ${toLabel}`;
	return fromLabel || toLabel || "";
};

/** Zone (region option `value`) a branch belongs to, or null if unmapped. */
export const resolveBranchRegionId = (
	branch: EpcOption,
	regions: EpcOption[] = [],
): string | null => {
	const direct =
		branch.regionId ??
		branch.region_id ??
		branch.zoneId ??
		branch.zone_id ??
		(typeof branch.region === "string" ? branch.region : undefined);

	if (direct) return findOption(regions, String(direct))?.value ?? null;

	const zoneCode = getZoneCodeForBranch(getOptionCode(branch));
	if (!zoneCode) return null;

	return regions.find((r) => getOptionCode(r) === zoneCode)?.value ?? null;
};
