import content from "./businessPartner.content.en.json";

/**
 * Typed accessor for Business Partner create/update page copy.
 * Requires `resolveJsonModule: true` (already enabled for Vendor Onboarding).
 */
export const businessPartnerContent = content;

/**
 * Replaces `{token}` placeholders in a content template.
 * Unknown tokens are left untouched so a missing value is visible in QA
 * rather than silently rendering an empty string.
 */
export const formatBusinessPartnerMessage = (
	template: string,
	tokens: Record<string, string | number>,
): string =>
	template.replace(/\{(\w+)\}/g, (match, key: string) =>
		key in tokens ? String(tokens[key]) : match,
	);
