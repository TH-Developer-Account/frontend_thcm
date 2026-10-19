import type { GradeOption } from "../types/reimbursementClaim.types";

/**
 * Grade → annual cap. MUST match the GradeEligibility table (see
 * seed-grade-eligibility.sql). While MEDICLAIM_BACKEND.gradesEndpoint is
 * false this list is the grade dropdown; the server still recomputes
 * eligibility from the table on every submit.
 */
export const GRADE_OPTIONS: GradeOption[] = [
	{ label: "EG", value: "EG", eligibility: 75_000 },
	{ label: "EG-1A", value: "EG-1A", eligibility: 75_000 },
	{ label: "EG-1B", value: "EG-1B", eligibility: 75_000 },
	{ label: "EG-2A", value: "EG-2A", eligibility: 75_000 },
	{ label: "EG-2A1", value: "EG-2A1", eligibility: 75_000 },
	{ label: "EG-2B", value: "EG-2B", eligibility: 75_000 },
	{ label: "EG-3", value: "EG-3", eligibility: 75_000 },
	{ label: "EG-4", value: "EG-4", eligibility: 75_000 },
	{ label: "TM-0", value: "TM-0", eligibility: 30_000 },
	{ label: "TM-1", value: "TM-1", eligibility: 30_000 },
	{ label: "TM-3", value: "TM-3", eligibility: 30_000 },
	{ label: "TM-4", value: "TM-4", eligibility: 30_000 },
	{ label: "TM-5", value: "TM-5", eligibility: 30_000 },
	{ label: "TS-2", value: "TS-2", eligibility: 25_000 },
];

/** @deprecated use GRADE_OPTIONS. */
export const FALLBACK_GRADE_OPTIONS = GRADE_OPTIONS;

export const toGradeOptions = (
	rows: Array<{ grade: string; annualCap: number | string | null }>,
): GradeOption[] =>
	rows
		.filter((row) => row.grade?.trim())
		.map((row) => {
			const cap = Number(row.annualCap);
			return {
				label: row.grade.trim(),
				value: row.grade.trim(),
				eligibility: Number.isFinite(cap) ? cap : null,
			};
		});

/**
 * Final option list for the grade select:
 *  - backend list (or GRADE_OPTIONS when there is none)
 *  - plus the claim's CURRENT grade if it isn't in the list (e.g. legacy
 *    retiree grades like EG-2B), with its cap derived from the server-
 *    computed eligibleAmount + alreadySettled, so the dropdown never shows
 *    blank for a prefilled grade and validation doesn't reject it.
 */
export function resolveGradeOptions(
	apiOptions: GradeOption[] | undefined,
	currentGrade?: string | null,
	derivedCap?: number | null,
): GradeOption[] {
	const base = apiOptions?.length ? apiOptions : GRADE_OPTIONS;
	const grade = currentGrade?.trim();
	if (!grade || base.some((option) => option.value === grade)) return base;
	return [
		...base,
		{
			label: grade,
			value: grade,
			eligibility:
				typeof derivedCap === "number" && Number.isFinite(derivedCap) && derivedCap > 0
					? derivedCap
					: null,
		},
	];
}
