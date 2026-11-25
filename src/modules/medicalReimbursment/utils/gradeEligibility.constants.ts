import type { GradeEligibilityRow } from "../types/medicalClaimListing.types";
import type { GradeOption } from "../types/reimbursementClaim.types";

/**
 * Hospitalisation cover for EG grades — separate from the regular annual
 * limit. Mirrors HOSPITALISATION_ANNUAL_CAP in mediclaim.helper.ts (backend);
 * the live value from the API wins when present.
 */
export const HOSPITALISATION_ANNUAL_CAP = 125_000;

/** EG, EG-1A, EG-2B … — the only grades with hospitalisation cover. */
export const isHospitalisationGrade = (grade?: string | null): boolean =>
	/^EG/i.test((grade ?? "").trim());

/**
 * Stable empty list, so hooks that depend on the options array don't re-run
 * on every render while the grade master data is still loading.
 */
export const NO_GRADE_OPTIONS: GradeOption[] = [];

/**
 * Grade master data (GradeEligibility table) → select options.
 *
 * The API row is `{ value: <uuid>, label: "EG-1A", annualCap: "75000" | null }`.
 * The uuid is the table's row id — NOT what the claim stores. Claims, the HR
 * data and the backend all use the grade NAME, so the name is used for both
 * `label` and `value`. `annualCap: null` means the cap isn't configured yet,
 * which must stay `null` (Number(null) is 0, which would read as "no limit
 * left" instead of "no limit configured").
 */
export const toGradeOptions = (rows: GradeEligibilityRow[]): GradeOption[] =>
	rows
		.map((row) => {
			const name = (row.label ?? row.grade ?? "").trim();
			const rawCap = row.annualCap;
			const cap =
				rawCap === null || rawCap === undefined || rawCap === ""
					? null
					: Number(rawCap);
			return {
				label: name,
				value: name,
				eligibility: cap !== null && Number.isFinite(cap) ? cap : null,
			};
		})
		.filter((option) => option.value);

/**
 * Final option list for the grade select:
 *  - the grade master data from the API (empty until it has loaded)
 *  - plus the claim's CURRENT grade if it isn't in the list (e.g. legacy
 *    retiree grades), with its cap derived from the server-computed
 *    eligibleAmount + alreadySettled, so the dropdown never shows blank for
 *    a prefilled grade and validation doesn't reject it.
 */
export function resolveGradeOptions(
	apiOptions: GradeOption[] | undefined,
	currentGrade?: string | null,
	derivedCap?: number | null,
): GradeOption[] {
	const base = apiOptions ?? NO_GRADE_OPTIONS;
	const grade = currentGrade?.trim();
	if (!grade || base.some((option) => option.value === grade)) return base;
	return [
		...base,
		{
			label: grade,
			value: grade,
			eligibility:
				typeof derivedCap === "number" &&
				Number.isFinite(derivedCap) &&
				derivedCap > 0
					? derivedCap
					: null,
		},
	];
}
