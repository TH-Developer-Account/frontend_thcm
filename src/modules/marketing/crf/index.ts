// crf/index.ts
// Public API of the CRF module. Other modules import ONLY from here.

export { default as CrfForm } from "./CrfForm";
export type { CrfFormProps } from "./useCrfForm";

export { default as CrfCatalog } from "./crf.catalog";
export type { CrfCatalogProps } from "./crf.catalog";

export {
	crfApi,
	crfKeys,
	useCreateCrfMutation,
	useCrfProductsQuery,
	useUpdateCrfMutation,
} from "./crf.api";

export {
	CRF_SHOP_USE_MOCK,
	crfShopApi,
	crfShopKeys,
	useSouvenirCatalogQuery,
	useSouvenirProductQuery,
	useStockCheckMutation,
} from "./crf.shop.api";

export {
	SHOP_PRICES_INCLUDE_GST,
	createSouvenirLine,
	findVariantBySelection,
	getLinePricing,
	getOptionAxes,
	groupStockRows,
	isOptionValueOrderable,
	mapProductDetail,
	parseGstRate,
	sumPricing,
	type LinePricing,
	type OptionAxis,
	type OptionSelection,
	type SouvenirProduct,
	type SouvenirProductDetail,
	type SouvenirVariant,
} from "./crf.shop.mapper";

export { default as SouvenirProductView } from "./crf.product-view";
export type { SouvenirProductViewProps } from "./crf.product-view";

export type {
	ShopCatalogResponse,
	ShopProductDetail,
	ShopStockCheckResult,
	ShopStockRow,
} from "./crf.shop.types";

export { CrfImage, getPlaceholderImage } from "./crf.media";

export { getCrfTotalFromData, mapCrfLineItemsToTableRows } from "./crf.mapper";

export {
	ARTWORK_UNIT,
	ARTWORK_UNITS,
	CRF_LIMITS,
	CRF_MESSAGES,
	crfFormSchema,
	crfLineItemSchema,
	formatArtworkSize,
	formatCrfAmount,
	formatCrfQuantity,
	getCrfCategoryTitle,
	validateCrfForm,
	type CrfFormErrors,
	type CrfFormValues,
	type CrfLineItemValues,
} from "./crf.schema";

export {
	ARTWORK_CUSTOM_PRESET,
	ARTWORK_RESOLUTION_PRESETS,
	CRF_CATEGORIES,
	findArtworkPreset,
	type ArtworkResolutionPreset,
	type CrfCategory,
	type CrfDetail,
	type CrfLineItem,
	type CrfLineItemPayload,
	type CrfPayload,
} from "./crf.types";

/* ---------------------------- Order (after approval) ---------------------------- */

export { default as CrfOrderSection } from "./CrfOrderSection";
export type { CrfOrderSectionProps } from "./CrfOrderSection";
export { crfOrderApi, crfOrderKeys, useCrfOrderQuery } from "./crf.order.api";
export {
	CRF_ORDER_OPEN_STATUSES,
	amountInWords,
	getCrfOrderPhase,
	isCrfOrderOpen,
	type CrfOrderPhase,
} from "./crf.order.logic";
export type {
	CrfOrderContext,
	CrfOrderPayload,
	CrfOrderRecord,
	DebitNote,
	DeliveryEstimate,
	ShopOrder,
} from "./crf.order.types";

/* TEMP: souvenir lines kept locally until the backend accepts store lines. */
export {
	CRF_BACKEND_SUPPORTS_STORE_LINES,
	withLocalStoreLines,
} from "./crf.store-lines";
