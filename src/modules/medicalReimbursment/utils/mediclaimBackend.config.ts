/**
 * What the deployed medi-claim backend supports.
 *
 * The frontend is mapped to the CURRENT backend (mediclaim.routes.ts /
 * mediclaim.controller.ts / guest.routes.ts as deployed). Each flag below is
 * an endpoint or behaviour that backend does NOT have yet; while it is
 * `false` the frontend never calls it and uses the fallback described.
 *
 * When the backend gains one of these, flip the flag — no other change needed.
 */
export const MEDICLAIM_BACKEND = {
	/**
	 * GET /medi-claim/grades, /guest/grades, /public/:token/grades.
	 * false → grade dropdown uses GRADE_OPTIONS in gradeEligibility.constants.ts
	 * (keep that list in sync with the GradeEligibility table).
	 */
	gradesEndpoint: false,

	/** GET /medi-claim/guest/profile + POST /medi-claim/guest/submit. false → guests can't start a claim; HR initiates every claim. */
	guestCreateClaim: false,

	/** POST /guest/reset-password. false → "Forgot password" shows a contact-HR message. */
	guestPasswordReset: false,

	/** approved-amounts accepts `approved: false`. false → an approved bill can only be re-approved with a new amount. */
	unapproveLineItem: false,

	/** GET /medi-claim accepts `status`. false → the frontend filters by status itself. */
	listingStatusFilter: false,

	/** POST /:id/close allows the external approver. false → only the initiator can close. */
	externalApproverClose: false,

	/** Eligibility counted per financial year (Apr–Mar). false → calendar year (Jan–Dec), as the backend counts it. */
	financialYearEligibility: false,
} as const;

/** Label for the eligibility period, matching how the backend counts settled amounts. */
export function getEligibilityPeriodLabel(ref: Date = new Date()): string {
	if (!MEDICLAIM_BACKEND.financialYearEligibility) {
		return `Jan–Dec ${ref.getFullYear()}`;
	}
	const startYear = ref.getMonth() >= 3 ? ref.getFullYear() : ref.getFullYear() - 1;
	return `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** Backend caps `page_size` at 100. */
export const MEDICLAIM_MAX_PAGE_SIZE = 100;
