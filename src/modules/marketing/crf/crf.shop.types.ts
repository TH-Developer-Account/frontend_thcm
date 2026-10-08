// crf/crf.shop.types.ts
// THCM store (Shopify) contract, exactly as MAP's proxy returns it.
// Source: THCM_Integration Document.docx → Get Stock / Get Product, plus the
// MAP proxy additions (isOrderable, stock-check) from thcm-shop-proxy-README.
//
// Keep these 1:1 with the contract. UI-friendly shapes live in
// crf.shop.mapper.ts so a contract change only touches this file + the mapper.

/* ========================================================================== */
/*                         Get Stock — one row per variant                    */
/* ========================================================================== */

export type ShopProductStatus = "active" | "draft" | "archived";

/** GET /crf-shop/catalog → data[] (proxy over THCM GET /api/map/stock). */
export type ShopStockRow = {
	/** Shopify product id — shared by all variants of a product. */
	id: string;
	variantId: string;
	/** null when the variant has no SKU (cannot be ordered). */
	sku: string | null;
	title: string;
	/** null for products without real options. */
	variantTitle: string | null;
	/** Free-form, e.g. { size: "M", color: "Orange" } or { design: "Design 1" }. */
	options: Record<string, string>;
	/** Decimal string, e.g. "699.00". */
	price: string;
	/** Decimal string or null. Higher than price → item is discounted. */
	compareAtPrice: string | null;
	availableQty: number;
	category: string;
	vendor: string | null;
	/** Free tags. GST is carried here as "GST 28%" / "GST 5%". */
	tags: string[];
	handle: string;
	/** First product image, or null. */
	imageUrl: string | null;
	status: ShopProductStatus;
	createdAt: string;
	/** Added by the MAP proxy: active + in stock + has a SKU. */
	isOrderable?: boolean;
};

export type ShopPageInfo = {
	limit: number;
	offset: number;
	total: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	nextCursor: string | null;
	previousCursor: string | null;
};

export type ShopCatalogResponse = {
	data: ShopStockRow[];
	pageInfo: ShopPageInfo;
};

/** Query params accepted by the catalog endpoint (subset the UI uses). */
export type ShopCatalogParams = {
	q?: string;
	category?: string;
	inStock?: boolean;
	sort?: "relevance" | "title" | "price" | "stock" | "newest";
	order?: "asc" | "desc";
	limit?: number;
	after?: string;
};

/* ========================================================================== */
/*                         Get Product — full product                         */
/* ========================================================================== */

export type ShopVariant = Pick<
	ShopStockRow,
	| "variantId"
	| "sku"
	| "variantTitle"
	| "options"
	| "price"
	| "compareAtPrice"
	| "availableQty"
> & { isOrderable?: boolean };

/** GET /crf-shop/catalog/:key → data. */
export type ShopProductDetail = {
	id: string;
	title: string;
	handle: string;
	description: string;
	category: string;
	vendor: string | null;
	tags: string[];
	status: ShopProductStatus;
	/** Up to 50 image URLs. */
	images: string[];
	variants: ShopVariant[];
	matchedBy: "productId" | "variantId" | "sku" | "handle";
	matchedVariantId?: string;
};

/* ========================================================================== */
/*                       Stock check (MAP proxy, pre-save)                    */
/* ========================================================================== */

export type ShopStockCheckStatus =
	| "AVAILABLE"
	| "PARTIAL"
	| "OUT_OF_STOCK"
	| "INACTIVE"
	| "UNKNOWN_SKU";

export type ShopStockCheckLine = {
	sku: string;
	requested: number;
	available: number;
	status: ShopStockCheckStatus;
	title: string | null;
	variantTitle: string | null;
	imageUrl: string | null;
	price: string | null;
};

/** POST /crf-shop/stock-check → data. Never a reservation. */
export type ShopStockCheckResult = {
	allAvailable: boolean;
	reserved: false;
	checkedAt: string;
	lines: ShopStockCheckLine[];
};
