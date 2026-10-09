// crf/core/types.ts
// CRF types + constants.
//
// The read model (ApiCrfItem / CrfDetail) and the write model (CrfItemInput /
// CrfPayload) are intentionally asymmetric: the backend stores a souvenir
// line as just { sku, requestedQty } — no title, price, image or GST, since
// that all lives in Shopify, not MAP (see crf.service.ts's CrfItemInput).
// CrfLineItem (the form/cart shape) carries the richer display fields the UI
// needs, but those are populated from a live store lookup, never persisted.

import type { LineItemOption } from "../../shared/lineItem.types";
import type { ShopStockCheckStatus } from "../shop/types";

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
 * One CRF line as the form/cart holds it. Extends the shared LineItemOption
 * with the per-category fields:
 *   • Souvenirs (store) — SKU identity + DISPLAY-ONLY fields (image, price,
 *     compare-at, GST, stock) backfilled from a live store lookup. None of
 *     these are sent back to the API and none are persisted — see
 *     buildCrfItemInput in crf.mapper.ts.
 *   • Artworks — pixel resolution (preset or custom).
 *   • Printed materials — no size fields at all.
 */
export type CrfLineItem = LineItemOption & {
	/* ---- Souvenir (store) — display only, never persisted ---- */
	sku?: string | null;
	/** Shopify variant id. Known while building the cart from the live
	 *  catalog; absent after reloading a saved CRF (the backend only kept
	 *  the sku) — sku alone is enough to re-order or re-identify the line. */
	variantId?: string | null;
	shopifyProductId?: string | null;
	variantTitle?: string | null;
	options?: Record<string, string>;
	imageUrl?: string | null;
	compareAtPrice?: number | null;
	gstRate?: number | null;
	/** Stock seen when added / at the last live lookup (not a reservation). */
	availableQty?: number | null;
	/** Result of the last pre-save stock check, or the CRF item's saved
	 *  REQUESTED/OUT_OF_STOCK status after a post-approval evaluation. */
	stockStatus?: ShopStockCheckStatus | null;

	/* ---- Artwork ---- */
	resolutionPreset?: ArtworkResolutionPreset;
};

/* ========================================================================== */
/*                          Read model (GET /crf/:crfId)                      */
/* ========================================================================== */

export type CrfProductRef = {
	id: string;
	name: string;
	description: string | null;
	partNumber: string | null;
	category: string;
	unitRate: string | number;
};

/** A printed-material / artwork line — backend's "CATALOG" source. */
export type CrfCatalogItem = {
	id: string;
	category: Exclude<CrfCategory, "SOUVENIR">;
	source: "CATALOG";
	productId: string;
	product: CrfProductRef | null;
	quantity: number;
	rate: number;
	amount: number;
	width: string | null;
	height: string | null;
	unit: string | null;
};

/** A souvenir line — backend's "SHOPIFY" source. No snapshot, by design. */
export type CrfShopifyItem = {
	id: string;
	category: "SOUVENIR";
	source: "SHOPIFY";
	sku: string;
	requestedQty: number;
	/** Set by the post-approval stock evaluation; REQUESTED until then. */
	status: "REQUESTED" | "OUT_OF_STOCK" | "ORDERED" | "DEBITED";
};

export type ApiCrfItem = CrfCatalogItem | CrfShopifyItem;

export type CrfStatus =
	| "OPEN"
	| "APPROVED"
	| "STOCK_SHORTFALL"
	| "ORDER_FAILED"
	| "ORDERED"
	| "CLOSED";

export type CrfOrderLineRecord = {
	sku: string;
	title: string;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
};

/** GET /crf/:crfId → data.order, once an order has been placed. */
export type ApiCrfOrder = {
	id: string;
	crfId: string;
	shopifyOrderId: string;
	totalPrice: number;
	/** Plain amount, not a GST document — see crfOrder.service.ts. Null when
	 *  nothing was accepted as a shortfall. */
	debitNoteAmount: number | null;
	status: "ORDERED" | "CANCELLED";
	lines: CrfOrderLineRecord[];
};

/**
 * What the backend's computeCrfPermissions returns, so the frontend never
 * re-derives "can I act on this CRF" from status/ownership itself. Verified
 * directly against crfAccess.helper.ts's CrfPermissions — field names and
 * meaning match exactly, including which statuses gate each flag there.
 *
 * canMarkItemDelivered exists on the backend type but has no endpoint or UI
 * behind it yet (deferred — manual PM/ARTWORK delivery tracking); kept here
 * since the field is real and will start arriving on every CRF response,
 * just unused by the frontend for now.
 */
export type CrfPermissions = {
	canEditLines: boolean; // full line replace — OPEN only, owner
	canSwapSouvenirLines: boolean; // souvenir-only edit — STOCK_SHORTFALL, owner
	canEditDispatchDetails: boolean; // recipient + addresses — APPROVED/STOCK_SHORTFALL/ORDER_FAILED, owner
	canPlaceOrder: boolean; // APPROVED/STOCK_SHORTFALL, owner
	canRetryOrder: boolean; // ORDER_FAILED — owner or admin
	canCancelOrder: boolean; // ORDERED — owner or admin
	canMarkItemDelivered: boolean; // deferred — no endpoint/UI yet
	canView: boolean;
};

/** GET /crf/:crfId → data. */
export type CrfDetail = {
	id: string;
	epcId: string;
	status: CrfStatus;
	/** Souvenir line value at the moment of approval — the swap budget cap. */
	souvenirTotalAtApproval: number | null;
	items: ApiCrfItem[];
	order: ApiCrfOrder | null;
	permissions: CrfPermissions;
};

/* ========================================================================== */
/*                       Write model (POST/PUT /crf)                          */
/* ========================================================================== */

/** Printed material / artwork line — matches backend's CatalogCrfItemInput. */
export type CrfCatalogItemInput = {
	productId: string;
	quantity: number;
	width?: string;
	height?: string;
	unit?: string;
};

/** Souvenir line — matches backend's ShopifyCrfItemInput exactly. */
export type CrfShopifyItemInput = {
	sku: string;
	requestedQty: number;
};

export type CrfItemInput = CrfCatalogItemInput | CrfShopifyItemInput;

/** POST /crf, PUT /crf/:crfId body. */
export type CrfPayload = {
	epcId: string;
	items: CrfItemInput[];
};
