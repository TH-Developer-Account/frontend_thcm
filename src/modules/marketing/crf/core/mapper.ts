// crf/core/mapper.ts
// API ⇄ form/view mapping for CRF line items.
//
// Category rules applied here:
//   • PRINTED_MATERIAL — no width / height / unit, ever.
//   • ARTWORK          — pixel resolution (width × height px + preset).
//   • SOUVENIR         — store line: the API gives back { sku, requestedQty,
//                        amount, status }. There is no title/image/live-stock
//                        snapshot — that lives in Shopify, not MAP. `amount`
//                        is the one exception: a client-supplied audit
//                        snapshot of what the line was worth at request
//                        time (see buildShopifyItemInput below) — never a
//                        live Shopify price. mapCrfLineItemsToFormItems
//                        alone produces a line with identity + that stored
//                        amount but no display fields; call
//                        backfillSouvenirDisplayFields with a live catalog
//                        lookup (by sku) to fill in title/image/price/GST
//                        before rendering/editing. See crf.types.ts's
//                        CrfLineItem doc comment.

import type {
  GroupedOption,
  LineItemOption,
  Product,
} from "../../shared/lineItem.types";
import { toNumber } from "../../shared/lineItem.utils";
import {
  createSouvenirLine,
  getLinePricing,
  groupStockRows,
  type SouvenirProduct,
  type SouvenirVariant,
} from "../shop/mapper";
import type { ShopStockRow } from "../shop/types";
import {
  findArtworkPreset,
  type ApiCrfItem,
  type CrfCatalogItemInput,
  type CrfItemInput,
  type CrfLineItem,
  type CrfPayload,
  type CrfShopifyItemInput,
} from "./types";

const UNCATEGORIZED = "UNCATEGORIZED";
const ARTWORK = "ARTWORK";
const SOUVENIR = "SOUVENIR";

/* ========================================================================== */
/*                            Products → options                              */
/* ========================================================================== */

/** MAP product master → catalog option. Size fields only for artworks. */
export const mapProductToLineItemOption = (item: Product): LineItemOption => {
  const category = item.category || UNCATEGORIZED;

  return {
    value: item.id,
    label: item.name,
    particular: item.id,
    description: item.description,

    rate: toNumber(item.unitRate),
    quantity: 1,

    partNumber: item.partNumber,
    category,

    // Artworks are digital: the size is chosen per line (px resolution),
    // so the master's physical size is not carried over. Printed
    // materials never have a size.
    ...(category === ARTWORK ? { unit: "px" } : {}),
  };
};

export const groupProductsByCategory = (
  products: Product[] = [],
): GroupedOption[] =>
  Object.values(
    products.reduce<Record<string, GroupedOption>>((acc, item) => {
      const category = item.category || UNCATEGORIZED;

      acc[category] ??= { label: category, options: [] };
      acc[category].options.push(mapProductToLineItemOption(item));

      return acc;
    }, {}),
  );

/* ========================================================================== */
/*                               Line amount                                  */
/* ========================================================================== */

/**
 * A line's resolved money amount: its own `total` when already computed
 * (e.g. by schema.ts's normalizeLineItem), falling back to rate × quantity
 * when it isn't. Shared by every place that needs "what is this line worth"
 * — the CRF grand total, a readonly table row, and the souvenir line's
 * `amount` audit snapshot sent to the backend — so the fallback rule lives
 * in exactly one place instead of being re-typed at each call site.
 */
const getLineAmount = (
  item: Pick<CrfLineItem, "total" | "rate" | "quantity">,
) => toNumber(item.total ?? toNumber(item.rate) * toNumber(item.quantity));

/* ========================================================================== */
/*                         API items → form (edit mode)                       */
/* ========================================================================== */

/**
 * Editable lines for the CRF form. Souvenir lines come back with identity +
 * the stored `amount` snapshot but no display fields — pass the result
 * through backfillSouvenirDisplayFields once a live catalog lookup for
 * their SKUs is available, before showing them to the user.
 */
export const mapCrfLineItemsToFormItems = (
  items: ApiCrfItem[] = [],
): CrfLineItem[] =>
  items.map((item): CrfLineItem => {
    if (item.source === "SHOPIFY") {
      return {
        id: item.id,
        value: item.sku,
        label: item.sku,
        particular: item.sku,
        description: "",
        partNumber: item.sku,
        category: SOUVENIR,

        rate: 0,
        quantity: item.requestedQty,
        total: toNumber(item.amount),

        sku: item.sku,
        // Not known until backfillSouvenirDisplayFields runs — see
        // CrfLineItem's doc comment on variantId in crf.types.ts.
        variantId: null,
        shopifyProductId: null,
        variantTitle: null,
        options: {},
        imageUrl: null,
        compareAtPrice: null,
        gstRate: null,
        availableQty: null,
        // Only OUT_OF_STOCK has a matching ShopStockCheckStatus value;
        // REQUESTED/ORDERED/DEBITED aren't a stock-check outcome.
        stockStatus: item.status === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : null,
      };
    }

    const width = item.width !== null ? Number(item.width) : undefined;
    const height = item.height !== null ? Number(item.height) : undefined;

    const base: CrfLineItem = {
      id: item.id,
      value: item.productId,
      label: item.product?.name ?? "--",
      particular: item.productId,
      description: item.product?.description ?? "--",

      rate: toNumber(item.rate),
      quantity: item.quantity,
      total: toNumber(item.amount),

      partNumber: item.product?.partNumber ?? "",
      category: item.category,
    };

    if (item.category === ARTWORK) {
      return {
        ...base,
        width,
        height,
        unit: item.unit ?? "px",
        resolutionPreset: findArtworkPreset(width, height),
      };
    }

    return base;
  });

/**
 * Fills in the display fields a saved souvenir line can't carry on its own
 * (title, image, price, GST, options) from a live catalog lookup, by sku.
 * `stockRows` is expected to already be scoped to exactly the SKUs on
 * `items` (e.g. crfShopApi.getCatalog({ sku: skus.join(",") })) — a sku with
 * no matching row (discontinued, renamed) is left as the bare line rather
 * than dropped, so the user still sees it's there and can remove it.
 */
export const backfillSouvenirDisplayFields = (
  items: CrfLineItem[],
  stockRows: ShopStockRow[],
): CrfLineItem[] => {
  if (stockRows.length === 0) return items;

  const variantBySku = new Map<
    string,
    { product: SouvenirProduct; variant: SouvenirVariant }
  >();
  for (const product of groupStockRows(stockRows)) {
    for (const variant of product.variants) {
      if (variant.sku) variantBySku.set(variant.sku, { product, variant });
    }
  }

  return items.map((item) => {
    if (item.category !== SOUVENIR || !item.sku) return item;

    const match = variantBySku.get(item.sku);
    if (!match) return item;

    return {
      ...createSouvenirLine(match.product, match.variant, item.quantity),
      // Keep the saved CrfItem's own id so a save replaces this line
      // rather than creating a new one.
      id: item.id,
      stockStatus: item.stockStatus ?? null,
    };
  });
};

/** Readonly rows for <LineTableView />, from the already-mapped (and, for
 *  souvenirs, backfilled) form items — not raw API items, since those don't
 *  carry enough to display a souvenir row on their own. */
export const mapCrfLineItemsToTableRows = (items: CrfLineItem[] = []) =>
  items.map((item, index) => ({
    id: item.id,
    sno: index + 1,

    particulars: item.variantTitle
      ? `${item.label} · ${item.variantTitle}`
      : item.label,
    description: item.description ?? "--",
    partNumber: item.partNumber ?? "",

    rate: toNumber(item.rate),
    qty: toNumber(item.quantity),
    total: getLineAmount(item),

    category: item.category,

    ...(item.category === ARTWORK
      ? {
          width: toNumber(item.width),
          height: toNumber(item.height),
          unit: item.unit ?? "px",
        }
      : {}),
  }));

/**
 * Grand total of a CRF. Catalog lines carry their own amount; souvenir
 * lines only have a usable total once backfilled (bare API items have no
 * display price, though they do carry the stored `amount` snapshot as
 * `total` — see mapCrfLineItemsToFormItems), so this sums whatever
 * `total`/`rate × quantity` each line already resolves to — call it after
 * backfillSouvenirDisplayFields, not on raw API items, for an accurate
 * live-priced total.
 */
export const getCrfTotalFromData = (items: CrfLineItem[] = []) =>
  items.reduce((sum, item) => sum + getLineAmount(item), 0);

/* ========================================================================== */
/*                               Form → payload                               */
/* ========================================================================== */

const buildCatalogItemInput = (item: CrfLineItem): CrfCatalogItemInput => {
  const quantity = toNumber(item.quantity);

  if (item.category === ARTWORK) {
    return {
      productId: item.value || "",
      quantity,
      width: item.width !== undefined ? String(item.width) : undefined,
      height: item.height !== undefined ? String(item.height) : undefined,
      unit: item.unit || "px",
    };
  }

  // Printed material: no size fields.
  return { productId: item.value || "", quantity };
};

const buildShopifyItemInput = (item: CrfLineItem): CrfShopifyItemInput => ({
  sku: item.sku ?? "",
  requestedQty: toNumber(item.quantity),
  // Audit snapshot only (see CrfShopifyItemInput's doc comment) — the
  // backend trusts this as given rather than re-checking Shopify, so it
  // must reflect the same price × quantity the user was shown, not be
  // independently recomputed here.
  amount: getLineAmount(item),
});

/**
 * Form line → wire item. Deliberately sends ONLY identity + quantity (+ size
 * for artworks) for a catalog line — the backend computes rate/amount from
 * ProductMaster.unitRate and rejects anything else — and, for a souvenir
 * line, identity + quantity + the `amount` audit snapshot above (still no
 * title/image/GST/stock — those stay display-only). Pricing shown to the
 * user (getLinePricing/sumPricing in crf.shop.mapper.ts) otherwise plays no
 * part in what gets sent.
 */
export const buildCrfItemInput = (item: CrfLineItem): CrfItemInput =>
  item.category === SOUVENIR
    ? buildShopifyItemInput(item)
    : buildCatalogItemInput(item);

export const buildCrfPayload = (
  items: CrfLineItem[],
  epcId: string,
): CrfPayload => ({
  epcId,
  items: items.map(buildCrfItemInput),
});

/* ========================================================================== */
/*                           Re-exported pricing                              */
/* ========================================================================== */

// CrfForm / summary callers want pricing without reaching into
// crf.shop.mapper.ts directly for a CRF-level concern.
export { getLinePricing };
