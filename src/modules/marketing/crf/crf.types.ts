// crf/crf.types.ts
// CRF types + constants.

import type { ApiLineItem, LineItemOption } from "../shared/lineItem.types";
import type { ShopStockCheckStatus } from "./crf.shop.types";

/* ========================================================================== */
/*                                  Constants                                 */
/* ========================================================================== */

export const CRF_CATEGORIES = [
	{ title: "Printed Materials", value: "PRINTED_MATERIAL" },
	{ title: "Souvenirs", value: "SOUVENIR" },
	{ title: "Artworks", value: "ARTWORK" },
] as const;

export type CrfCategory = (typeof CRF_CATEGORIES)[number]["value"];

/* ========================================================================== */
/*                         Artwork (digital) resolution                       */
/* ========================================================================== */

/**
 * Artworks are digital deliverables, so size is a pixel resolution.
 * A preset fills width × height; "CUSTOM" lets the user type them.
 */
export const ARTWORK_RESOLUTION_PRESETS = [
	{ value: "FHD", label: "Full HD · 1920 × 1080", hint: "16:9 · screens, LED walls", width: 1920, height: 1080 },
	{ value: "UHD_4K", label: "4K UHD · 3840 × 2160", hint: "16:9 · large displays", width: 3840, height: 2160 },
	{ value: "HD", label: "HD · 1280 × 720", hint: "16:9 · web, presentations", width: 1280, height: 720 },
	{ value: "SQUARE", label: "Square · 1080 × 1080", hint: "1:1 · social post", width: 1080, height: 1080 },
	{ value: "PORTRAIT", label: "Portrait · 1080 × 1350", hint: "4:5 · social post", width: 1080, height: 1350 },
	{ value: "STORY", label: "Story / Reel · 1080 × 1920", hint: "9:16 · stories, reels", width: 1080, height: 1920 },
	{ value: "A4_300", label: "A4 print-ready · 2480 × 3508", hint: "300 dpi · flyers", width: 2480, height: 3508 },
	{ value: "A3_300", label: "A3 print-ready · 3508 × 4961", hint: "300 dpi · posters", width: 3508, height: 4961 },
	{ value: "BANNER", label: "Web banner · 1584 × 396", hint: "4:1 · LinkedIn / site header", width: 1584, height: 396 },
] as const;

export const ARTWORK_CUSTOM_PRESET = "CUSTOM" as const;

export type ArtworkResolutionPreset =
	| (typeof ARTWORK_RESOLUTION_PRESETS)[number]["value"]
	| typeof ARTWORK_CUSTOM_PRESET;

/** Matches a width × height back to its preset (CUSTOM when none match). */
export const findArtworkPreset = (
	width?: number | null,
	height?: number | null,
): ArtworkResolutionPreset | undefined => {
	if (!width || !height) return undefined;
	return (
		ARTWORK_RESOLUTION_PRESETS.find(
			(preset) => preset.width === Number(width) && preset.height === Number(height),
		)?.value ?? ARTWORK_CUSTOM_PRESET
	);
};

/* ========================================================================== */
/*                               Form line item                               */
/* ========================================================================== */

/**
 * One CRF line in the form. Extends the shared LineItemOption with the
 * per-category fields:
 *   • Souvenirs (store) — SKU/variant identity + a snapshot of what the user
 *     saw (image, price, compare-at, GST, stock) so historic CRFs don't change
 *     when the store does.
 *   • Artworks — pixel resolution (preset or custom).
 *   • Printed materials — no size fields at all.
 */
export type CrfLineItem = LineItemOption & {
	/* ---- Souvenir (store) ---- */
	sku?: string | null;
	variantId?: string | null;
	shopifyProductId?: string | null;
	variantTitle?: string | null;
	options?: Record<string, string>;
	imageUrl?: string | null;
	compareAtPrice?: number | null;
	gstRate?: number | null;
	/** Stock seen when added / at the last stock check (not a reservation). */
	availableQty?: number | null;
	/** Result of the last pre-save stock check. */
	stockStatus?: ShopStockCheckStatus | null;

	/* ---- Artwork ---- */
	resolutionPreset?: ArtworkResolutionPreset;
};

/* ========================================================================== */
/*                                 Read model                                 */
/* ========================================================================== */

export type CrfDetail = {
	id: string;
	lineItems: ApiLineItem[];
};

/* ========================================================================== */
/*                                  Payloads                                  */
/* ========================================================================== */

export type CrfLineItemPayload = {
	/** MAP product-master id. Printed materials & artworks only. */
	productId?: string;
	category: string;
	quantity: number;
	/** Unit price used for the line. */
	amount: number;
	/** amount × quantity. */
	total: number;
	description?: string;

	/* ---- Artwork (px) ---- */
	width?: number;
	height?: number;
	unit?: string;
	resolutionPreset?: ArtworkResolutionPreset;

	/* ---- Souvenir snapshot (store) ---- */
	sku?: string;
	variantId?: string;
	shopifyProductId?: string;
	title?: string;
	variantTitle?: string | null;
	options?: Record<string, string>;
	imageUrl?: string | null;
	compareAtPrice?: number | null;
	discountAmount?: number;
	gstRate?: number | null;
	taxableAmount?: number;
	gstAmount?: number;
	/** Payable for the line incl. GST. */
	grossTotal?: number;
};

export type CrfPayload = {
	epcId: string;
	lineItems: CrfLineItemPayload[];
};
