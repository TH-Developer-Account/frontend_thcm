// crf/crf.shop.mock.ts
// Contract-shaped stand-in for the MAP store proxy while the backend is not
// ready. Same rows, same filters, same cursor paging, same stock-check
// statuses as THCM_Integration Document.docx / thcm-shop-proxy-README.
//
// Used only when CRF_SHOP_USE_MOCK is true (crf.shop.api.ts). Safe to delete
// once the proxy is live.

import type {
	ShopCatalogParams,
	ShopCatalogResponse,
	ShopProductDetail,
	ShopStockCheckLine,
	ShopStockCheckResult,
	ShopStockRow,
} from "./crf.shop.types";

/* ========================================================================== */
/*                                Mock images                                 */
/* ========================================================================== */

/** Small SVG "product photo" so image slots render without a CDN. */
const mockImage = (label: string, hue: number) =>
	`data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
			<rect width="240" height="240" fill="hsl(${hue} 70% 94%)"/>
			<circle cx="120" cy="104" r="54" fill="hsl(${hue} 65% 58%)"/>
			<text x="120" y="204" text-anchor="middle" font-family="system-ui,sans-serif"
				font-size="20" font-weight="600" fill="hsl(${hue} 40% 28%)">${label}</text>
		</svg>`,
	)}`;

/* ========================================================================== */
/*                                 Seed rows                                  */
/* ========================================================================== */

type SeedVariant = Pick<
	ShopStockRow,
	"variantId" | "sku" | "variantTitle" | "options" | "price" | "compareAtPrice" | "availableQty"
>;

type SeedProduct = Omit<ShopStockRow, keyof SeedVariant | "isOrderable"> & {
	variants: SeedVariant[];
	/** Get Product only. */
	description?: string;
	/** Get Product only — extra gallery images after imageUrl. */
	gallery?: string[];
};

const EVENT_TAG = "bauma CONEXPO INDIA 2026";

const SEED: SeedProduct[] = [
	{
		id: "10323521732848", title: "Bottle", handle: "bottle", category: "Mugs & Bottles",
		vendor: "Tata Hitachi", tags: [EVENT_TAG, "GST 28%", "Orange"], status: "active",
		imageUrl: mockImage("Bottle", 24), createdAt: "2026-09-24T13:09:11Z",
		description: "Insulated stainless-steel bottle, 750 ml. Keeps drinks cold for 24 h and hot for 12 h. Tata Hitachi logo laser-engraved.",
		gallery: [mockImage("Bottle · back", 36), mockImage("Bottle · lid", 18)],
		variants: [{ variantId: "50530235384048", sku: "THCM-0124", variantTitle: null, options: {}, price: "699.00", compareAtPrice: "999.00", availableQty: 43 }],
	},
	{
		id: "10323521798384", title: "Cap - Black CDB", handle: "cap-black-cdb", category: "Caps",
		vendor: "Tata Hitachi", tags: [EVENT_TAG, "Black", "Caps", "Fabric", "GST 5%"], status: "active",
		imageUrl: mockImage("Cap", 220), createdAt: "2026-09-24T13:09:12Z",
		description: "Black cotton cap with embroidered CDB logo and adjustable strap. One size fits most.",
		gallery: [mockImage("Cap · side", 230)],
		variants: [{ variantId: "50530235449584", sku: "THCM-0103", variantTitle: null, options: {}, price: "299.00", compareAtPrice: "499.00", availableQty: 6 }],
	},
	{
		id: "10323526942960", title: "Mousepad", handle: "mousepad", category: "Desk",
		vendor: "Tata Hitachi", tags: ["GST 18%"], status: "active",
		imageUrl: mockImage("Mousepad", 200), createdAt: "2026-09-24T13:10:00Z",
		description: "Printed mousepad with anti-slip rubber base. 22 × 18 cm. Two designs.",
		gallery: [mockImage("Design 2", 190)],
		variants: [
			{ variantId: "50530241151216", sku: "THCM-0109", variantTitle: "Design 1", options: { design: "Design 1" }, price: "199.00", compareAtPrice: "399.00", availableQty: 18 },
			{ variantId: "50530241183984", sku: "THCM-0110", variantTitle: "Design 2", options: { design: "Design 2" }, price: "199.00", compareAtPrice: "399.00", availableQty: 19 },
		],
	},
	{
		id: "10323527000001", title: "Polo T-Shirt", handle: "polo-t-shirt", category: "Apparel",
		vendor: "Tata Hitachi", tags: [EVENT_TAG, "Orange", "GST 5%"], status: "active",
		imageUrl: mockImage("Polo", 28), createdAt: "2026-09-24T13:11:00Z",
		description: "Orange cotton-blend polo with embroidered Tata Hitachi logo on the chest. Regular fit.",
		gallery: [mockImage("Polo · back", 32), mockImage("Polo · detail", 20)],
		variants: [
			{ variantId: "50530250000001", sku: "THCM-0201", variantTitle: "M / Orange", options: { size: "M", color: "Orange" }, price: "549.00", compareAtPrice: null, availableQty: 25 },
			{ variantId: "50530250000002", sku: "THCM-0202", variantTitle: "L / Orange", options: { size: "L", color: "Orange" }, price: "549.00", compareAtPrice: null, availableQty: 0 },
			{ variantId: "50530250000003", sku: "THCM-0203", variantTitle: "XL / Orange", options: { size: "XL", color: "Orange" }, price: "549.00", compareAtPrice: null, availableQty: 12 },
		],
	},
	{
		id: "10323527000005", title: "Executive T-Shirt", handle: "executive-t-shirt", category: "Apparel",
		vendor: "Tata Hitachi", tags: ["GST 5%"], status: "active",
		imageUrl: mockImage("Tee", 210), createdAt: "2026-09-24T13:11:30Z",
		description: "Premium crew-neck T-shirt for executives. 180 GSM combed cotton.",
		gallery: [mockImage("Tee · white", 0)],
		variants: [
			{ variantId: "50530250000041", sku: "THCM-0211", variantTitle: "M / Navy", options: { size: "M", color: "Navy" }, price: "280.00", compareAtPrice: "350.00", availableQty: 40 },
			{ variantId: "50530250000042", sku: "THCM-0212", variantTitle: "L / Navy", options: { size: "L", color: "Navy" }, price: "280.00", compareAtPrice: "350.00", availableQty: 9 },
			{ variantId: "50530250000043", sku: "THCM-0213", variantTitle: "M / White", options: { size: "M", color: "White" }, price: "280.00", compareAtPrice: "350.00", availableQty: 31 },
		],
	},
	{
		id: "10323527000002", title: "Safety Hat Keychain", handle: "safety-hat-keychain", category: "Accessories",
		vendor: "Tata Hitachi", tags: ["GST 18%"], status: "active",
		imageUrl: mockImage("Keychain", 48), createdAt: "2026-09-24T13:12:00Z",
		description: "Mini safety-helmet keychain in Tata Hitachi yellow.",
		variants: [{ variantId: "50530250000010", sku: "THCM-0156", variantTitle: null, options: {}, price: "29.00", compareAtPrice: null, availableQty: 200 }],
	},
	{
		id: "10323527000006", title: "Coffee Mug", handle: "coffee-mug", category: "Mugs & Bottles",
		vendor: "Tata Hitachi", tags: ["GST 12%"], status: "active",
		imageUrl: mockImage("Mug", 12), createdAt: "2026-09-24T13:12:30Z",
		description: "Ceramic mug, 330 ml, dishwasher safe.",
		gallery: [mockImage("Mug · side", 16)],
		variants: [{ variantId: "50530250000050", sku: "THCM-0130", variantTitle: null, options: {}, price: "180.00", compareAtPrice: "220.00", availableQty: 64 }],
	},
	{
		id: "10323527000007", title: "SHINRAI Umbrella", handle: "shinrai-umbrella", category: "Accessories",
		vendor: "Tata Hitachi", tags: ["GST 12%"], status: "active",
		imageUrl: mockImage("Umbrella", 160), createdAt: "2026-09-24T13:13:00Z",
		description: "Auto-open umbrella with SHINRAI branding. Currently out of stock.",
		variants: [{ variantId: "50530250000060", sku: "THCM-0161", variantTitle: null, options: {}, price: "240.00", compareAtPrice: null, availableQty: 0 }],
	},
	{
		id: "10323527000008", title: "Pierre Cardin Pen", handle: "pierre-cardin-pen", category: "Stationery",
		vendor: "Pierre Cardin", tags: ["GST 18%"], status: "active",
		imageUrl: null, createdAt: "2026-09-24T13:13:30Z",
		description: "Metal ball pen in a gift box. No store image yet.",
		variants: [{ variantId: "50530250000070", sku: "THCM-0170", variantTitle: null, options: {}, price: "110.00", compareAtPrice: "150.00", availableQty: 85 }],
	},
	{
		id: "10323527000009", title: "Wall Clock", handle: "wall-clock", category: "Desk",
		vendor: "Tata Hitachi", tags: ["GST 18%"], status: "active",
		imageUrl: mockImage("Clock", 260), createdAt: "2026-09-24T13:14:00Z",
		description: "Silent-sweep wall clock, 30 cm.",
		gallery: [mockImage("Clock · side", 250)],
		variants: [{ variantId: "50530250000080", sku: "THCM-0180", variantTitle: null, options: {}, price: "725.00", compareAtPrice: null, availableQty: 7 }],
	},
	{
		id: "10323527000004", title: "Sticker Sheet", handle: "sticker-sheet", category: "Stationery",
		vendor: null, tags: [], status: "active",
		imageUrl: null, createdAt: "2026-09-24T13:13:00Z",
		description: "Sticker sheet. No SKU in the store, so it cannot be ordered.",
		// No SKU → listed but not orderable (contract: isOrderable needs a SKU).
		variants: [{ variantId: "50530250000030", sku: null, variantTitle: null, options: {}, price: "10.00", compareAtPrice: null, availableQty: 100 }],
	},
];

const ROWS: ShopStockRow[] = SEED.flatMap(({ variants, description: _d, gallery: _g, ...product }) =>
	variants.map((variant) => ({
		...product,
		...variant,
		isOrderable:
			product.status === "active" && variant.availableQty > 0 && Boolean(variant.sku),
	})),
);

/* ========================================================================== */
/*                           Catalog (filters + paging)                       */
/* ========================================================================== */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const encodeCursor = (offset: number) => btoa(JSON.stringify({ o: offset }));
const decodeCursor = (cursor?: string) => {
	if (!cursor) return 0;
	try {
		const value = JSON.parse(atob(cursor));
		return Number.isInteger(value?.o) && value.o >= 0 ? value.o : 0;
	} catch {
		return 0;
	}
};

export const mockGetCatalog = async (
	params: ShopCatalogParams = {},
): Promise<ShopCatalogResponse> => {
	await delay(250);

	const words = (params.q ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
	const category = params.category?.trim().toLowerCase();

	let rows = ROWS.filter((row) => row.status === "active");

	if (words.length) {
		rows = rows.filter((row) => {
			const haystack = [
				row.title, row.sku, row.variantTitle, row.category, row.vendor, row.handle,
				...Object.values(row.options), ...row.tags,
			].filter(Boolean).join(" ").toLowerCase();
			return words.every((word) => haystack.includes(word));
		});
	}
	if (category) rows = rows.filter((row) => row.category.toLowerCase() === category);
	if (params.inStock === true) rows = rows.filter((row) => row.availableQty > 0);
	if (params.inStock === false) rows = rows.filter((row) => row.availableQty <= 0);

	const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
	const offset = decodeCursor(params.after);
	const page = rows.slice(offset, offset + limit);
	const hasNextPage = offset + limit < rows.length;

	return {
		data: page,
		pageInfo: {
			limit,
			offset,
			total: rows.length,
			hasNextPage,
			hasPreviousPage: offset > 0,
			nextCursor: hasNextPage ? encodeCursor(offset + limit) : null,
			previousCursor: offset > 0 ? encodeCursor(Math.max(0, offset - limit)) : null,
		},
	};
};

/* ========================================================================== */
/*                                Get Product                                 */
/* ========================================================================== */

/** GET /crf-shop/catalog/:key — key = product id, variant id, SKU or handle. */
export const mockGetProduct = async (key: string): Promise<ShopProductDetail> => {
	await delay(200);
	const k = key.trim().toLowerCase();

	for (const seed of SEED) {
		const byVariant = seed.variants.find(
			(v) => v.variantId === key || v.sku?.toLowerCase() === k,
		);
		const matchedBy =
			seed.id === key ? "productId"
			: byVariant?.variantId === key ? "variantId"
			: byVariant ? "sku"
			: seed.handle === k ? "handle"
			: null;
		if (!matchedBy) continue;

		const { variants, description = "", gallery = [], imageUrl, ...product } = seed;
		return {
			id: product.id,
			title: product.title,
			handle: product.handle,
			description,
			category: product.category,
			vendor: product.vendor,
			tags: product.tags,
			status: product.status,
			images: [imageUrl, ...gallery].filter((url): url is string => Boolean(url)),
			variants: variants.map((v) => ({
				...v,
				isOrderable: product.status === "active" && v.availableQty > 0 && Boolean(v.sku),
			})),
			matchedBy,
			...(byVariant && matchedBy !== "productId" ? { matchedVariantId: byVariant.variantId } : {}),
		};
	}

	throw Object.assign(new Error("Product not found"), { status: 404 });
};

/* ========================================================================== */
/*                                Stock check                                 */
/* ========================================================================== */

export const mockStockCheck = async (
	items: { sku: string; quantity: number }[],
): Promise<ShopStockCheckResult> => {
	await delay(300);

	// Duplicate SKUs are merged, like the proxy.
	const merged = new Map<string, number>();
	for (const item of items) {
		merged.set(item.sku, (merged.get(item.sku) ?? 0) + item.quantity);
	}

	const lines: ShopStockCheckLine[] = [...merged].map(([sku, requested]) => {
		const row = ROWS.find((r) => r.sku?.toLowerCase() === sku.toLowerCase());

		if (!row) {
			return { sku, requested, available: 0, status: "UNKNOWN_SKU", title: null, variantTitle: null, imageUrl: null, price: null };
		}

		const status =
			row.status !== "active"
				? "INACTIVE"
				: row.availableQty <= 0
					? "OUT_OF_STOCK"
					: row.availableQty < requested
						? "PARTIAL"
						: "AVAILABLE";

		return {
			sku: row.sku!,
			requested,
			available: row.availableQty,
			status,
			title: row.title,
			variantTitle: row.variantTitle,
			imageUrl: row.imageUrl,
			price: row.price,
		};
	});

	return {
		allAvailable: lines.every((line) => line.status === "AVAILABLE"),
		reserved: false,
		checkedAt: new Date().toISOString(),
		lines,
	};
};
