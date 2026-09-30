// src/content/vendor.content.ts
//
// Single source of truth for every user-facing string in the vendor
// onboarding module — form labels/placeholders/helper text, validation
// messages, toast copy, DPDP notice, listing/dashboard copy, and audit-log
// message templates. Zod schemas, hooks and components all read from this
// file instead of hardcoding copy inline, so an edit here is the ONE
// place that needs to change (including for translation).
//
// To add a language: add vendor.content.<locale>.json next to this file
// with the same shape as vendor.content.en.json, then register it in
// CONTENT_BY_LOCALE below. Nothing else in the app needs to change —
// every caller goes through `vendorContent` / `loadVendorContent`, never
// the JSON file directly.
//
// This is intentionally a light-weight seam, not a full i18n library:
// there's no runtime locale switching wired up yet (loadVendorContent
// always returns "en" until a caller passes the app's active locale).

import en from "./vendor.content.en.json";

export type VendorContent = typeof en;

const CONTENT_BY_LOCALE: Record<string, VendorContent> = {
	en,
};

export const DEFAULT_VENDOR_CONTENT_LOCALE = "en";

/**
 * Returns the vendor onboarding content bundle for a locale, falling
 * back to English when that locale isn't registered yet.
 */
export const loadVendorContent = (
	locale: string = DEFAULT_VENDOR_CONTENT_LOCALE,
): VendorContent => CONTENT_BY_LOCALE[locale] ?? en;

// The module-level default. Import this directly for the common case;
// call loadVendorContent(locale) instead once the app has a locale to pass.
export const vendorContent: VendorContent = loadVendorContent();

/**
 * Fills `{token}` placeholders in a content string, e.g.
 *
 *   formatVendorMessage(vendorContent.toast.publicSubmit.missingDocsDescription, {
 *     documents: missing.join(", "),
 *   })
 *
 * An unrecognized token is left as literal text instead of throwing, so a
 * future content edit that drops a placeholder never breaks the UI — it
 * just shows the raw "{token}" in the copy, which is a visible, fixable
 * content bug rather than a runtime error.
 */
export const formatVendorMessage = (
	template: string,
	values: Record<string, string | number | undefined | null>,
): string =>
	template.replace(/\{(\w+)\}/g, (match, token: string) => {
		const value = values[token];
		return value === undefined || value === null ? match : String(value);
	});
