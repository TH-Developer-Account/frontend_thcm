// utils/cpp.steps.ts — which wizard step owns which field, in screen order.
// ONE map, used by:
//   - "Next"    : validate exactly the current step's fields
//   - "Submit"  : find the FIRST invalid field (step order, then screen order),
//                 open its step and focus it
//   - the stepper: mark steps that still hold an error
// Paths are prefixes: "suppliers.existing" covers "suppliers.existing.name".
// The longest matching prefix wins, so "attachments.partSummary" (uploaded in
// Purchasing details) is never mistaken for the Attachments step.
import type { FieldErrors, FieldPath } from "react-hook-form";

import type { CppFormValues, CppStep, CppStepKey } from "../types/cpp.types";
import { CPP_CHECKLIST, CPP_SUPPORTING_DOCS } from "./cpp.utils";

export const STEP_FIELD_PATHS: Record<CppStepKey, readonly string[]> = {
	basic: [
		"category",
		"plant",
		"condition",
		"materialType",
		"effects",
		"initiationDate",
		"reason",
		"workflow.models",
		"workflow.plants",
		"priceType",
		"workflow.pricingCondition",
		"justification",
	],
	purchasing: [
		"suppliers.existing",
		"suppliers.other",
		"suppliers.recommended",
		"purchasingFile",
		"attachments.partSummary",
		"approvalValues.partValuePart",
		"approvalValues.partValue",
		"approvalValues.variationPct",
		"approvalValues.amountPart",
		"approvalValues.amount",
	],
	amortisation: ["amortisation"],
	volumes: ["volumes", "perMachineImpact", "costTracker"],
	master: ["masterData"],
	other: ["other.remarks", "other.plantPrices"],
	// Row by row, as the check list is drawn: answer, then its document.
	attachments: [
		...CPP_CHECKLIST.flatMap((item) => [
			`other.checklist.${item.key}`,
			`attachments.${item.key}`,
		]),
		...CPP_SUPPORTING_DOCS.map((item) => `attachments.${item.key}`),
	],
	workflow: [],
};

/** Fallback by top-level key, for a path no prefix above covers. */
const STEP_OF_ROOT: Record<string, CppStepKey> = {
	attachments: "attachments",
	other: "other",
	financial: "volumes",
};

const matches = (path: string, prefix: string) =>
	path === prefix || path.startsWith(`${prefix}.`);

/** The step that owns a field path, or null if none does. */
export const stepOfPath = (path: string): CppStepKey | null => {
	let best: { key: CppStepKey; length: number } | null = null;
	for (const [key, prefixes] of Object.entries(STEP_FIELD_PATHS) as [
		CppStepKey,
		readonly string[],
	][]) {
		for (const prefix of prefixes) {
			if (matches(path, prefix) && (!best || prefix.length > best.length))
				best = { key, length: prefix.length };
		}
	}
	return best?.key ?? STEP_OF_ROOT[path.split(".")[0]] ?? null;
};

/** Position of a path inside its step, for "first field on screen". */
const orderInStep = (path: string, key: CppStepKey): number => {
	const prefixes = STEP_FIELD_PATHS[key];
	let bestIndex = prefixes.length;
	let bestLength = -1;
	prefixes.forEach((prefix, index) => {
		if (matches(path, prefix) && prefix.length > bestLength) {
			bestIndex = index;
			bestLength = prefix.length;
		}
	});
	return bestIndex;
};

/** Paths of a step to pass to form.trigger(). */
export const stepTriggerPaths = (key: CppStepKey) =>
	STEP_FIELD_PATHS[key] as unknown as FieldPath<CppFormValues>[];

/* --------------------------------- errors --------------------------------- */

const SKIP_KEYS = new Set(["ref", "message", "type", "types"]);

/** Every leaf path that carries an error message, in object order. */
export const errorPaths = (node: unknown, prefix = ""): string[] => {
	if (!node || typeof node !== "object") return [];
	const record = node as Record<string, unknown>;
	const out: string[] = [];
	if (typeof record.message === "string" && record.message && prefix)
		out.push(prefix);
	for (const [key, child] of Object.entries(record)) {
		if (SKIP_KEYS.has(key)) continue;
		// Array-level errors ("add at least one row") sit under `root`.
		const next = key === "root" ? prefix : prefix ? `${prefix}.${key}` : key;
		out.push(...errorPaths(child, next));
	}
	return out;
};

/**
 * The first invalid field: earliest step, then the order fields are drawn in.
 * `onlyStep` limits the search to one step (used by "Next").
 */
export const firstErrorPath = (
	errors: FieldErrors<CppFormValues>,
	steps: CppStep[],
	onlyStep?: CppStepKey,
): string | null => {
	const ranked = errorPaths(errors)
		.map((path, position) => {
			const key = stepOfPath(path);
			const stepIndex = key ? steps.findIndex((s) => s.key === key) : -1;
			return {
				path,
				key,
				stepIndex: stepIndex < 0 ? steps.length : stepIndex,
				inStep: key ? orderInStep(path, key) : 0,
				position,
			};
		})
		.filter((item) => !onlyStep || item.key === onlyStep)
		.sort(
			(a, b) =>
				a.stepIndex - b.stepIndex ||
				a.inStep - b.inStep ||
				a.position - b.position,
		);
	return ranked[0]?.path ?? null;
};

/** Steps that still hold at least one error. */
export const stepsWithErrors = (
	errors: FieldErrors<CppFormValues>,
): Set<CppStepKey> =>
	new Set(
		errorPaths(errors)
			.map(stepOfPath)
			.filter((key): key is CppStepKey => key !== null),
	);

const getIn = (source: unknown, path: string): unknown =>
	path
		.split(".")
		.reduce<unknown>(
			(node, key) =>
				node && typeof node === "object"
					? (node as Record<string, unknown>)[key]
					: undefined,
			source,
		);

const setIn = (target: Record<string, unknown>, path: string, value: unknown) => {
	const keys = path.split(".");
	let node = target;
	keys.slice(0, -1).forEach((key) => {
		if (!node[key] || typeof node[key] !== "object") node[key] = {};
		node = node[key] as Record<string, unknown>;
	});
	node[keys[keys.length - 1]] = value;
};

/** Only the errors of one step (for the summary above the step). */
export const errorsOfStep = (
	errors: FieldErrors<CppFormValues>,
	key: CppStepKey,
): FieldErrors<CppFormValues> => {
	const out: Record<string, unknown> = {};
	for (const path of errorPaths(errors))
		if (stepOfPath(path) === key) setIn(out, path, getIn(errors, path));
	return out as FieldErrors<CppFormValues>;
};

/* --------------------------------- focus ---------------------------------- */

const FOCUSABLE =
	'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const byAttribute = (attribute: string, value: string) =>
	document.querySelector<HTMLElement>(`[${attribute}="${CSS.escape(value)}"]`);

/** The element drawn for a path: by id, name, or the CppFields anchor. */
const findFieldElement = (path: string): HTMLElement | null => {
	const direct =
		document.getElementById(path) ??
		byAttribute("name", path) ??
		byAttribute("data-cpp-field", path);
	if (!direct) return null;
	if (direct.matches(FOCUSABLE)) return direct;
	return direct.querySelector<HTMLElement>(FOCUSABLE) ?? direct;
};

/**
 * Scrolls to and focuses the field for `path`. Walks up the path
 * ("masterData.plantDetails.2.taxCode" -> "masterData.plantDetails.2" -> …)
 * until something on screen matches. Returns false when nothing matched.
 */
export const focusField = (path: string): boolean => {
	if (typeof document === "undefined") return false;
	const parts = path.split(".");
	for (let length = parts.length; length > 0; length -= 1) {
		const element = findFieldElement(parts.slice(0, length).join("."));
		if (!element) continue;
		// display: contents anchors have no box — scroll their first real child.
		const box =
			getComputedStyle(element).display === "contents"
				? ((element.firstElementChild as HTMLElement | null) ?? element)
				: element;
		box.scrollIntoView({ behavior: "smooth", block: "center" });
		element.focus({ preventScroll: true });
		return true;
	}
	return false;
};
