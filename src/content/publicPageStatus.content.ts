import publicPageStatusContentEn from "./publicPageStatus.content.en.json";

/**
 * Typed accessor for the copy shown by PublicPageStatusCard on the public
 * Vendor Onboarding and Medical Claim pages (validating / link-invalid /
 * submitted states). Mirrors the pattern used by
 * `src/content/vendor.content.ts` — a single content file per surface,
 * loaded through a typed accessor rather than scattered string literals.
 *
 * Requires `resolveJsonModule: true` in tsconfig (already enabled for
 * `vendor.content.en.json` as part of the Vendor Onboarding RHF/Zod
 * migration).
 */

export type PublicPageStatusFlow = keyof typeof publicPageStatusContentEn;

export type PublicPageStatusFlowContent =
	(typeof publicPageStatusContentEn)[PublicPageStatusFlow];

export const publicPageStatusContent = publicPageStatusContentEn;

export const getPublicPageStatusContent = (
	flow: PublicPageStatusFlow,
): PublicPageStatusFlowContent => publicPageStatusContentEn[flow];
