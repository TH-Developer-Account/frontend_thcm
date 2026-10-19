// crf/index.ts
// Public API of the CRF module. Other modules import ONLY from here.

export { default as CrfForm } from "./core/CrfForm";
export type { CrfFormProps } from "./core/useCrfForm";

export { default as CrfCatalog } from "./core/CrfCatalog";
export type { CrfCatalogProps } from "./core/CrfCatalog";

export { default as CrfSection } from "./core/CrfSection";
export type { CrfSectionProps } from "./core/CrfSection";

export {
	crfApi,
	crfKeys,
	useCreateCrfMutation,
	useCrfProductsQuery,
	useUpdateCrfMutation,
} from "./core/api";

export {
	crfShopApi,
	crfShopKeys,
	useSouvenirCatalogQuery,
	useSouvenirProductQuery,
	useSouvenirStockBySkusQuery,
	useStockCheckMutation,
} from "./shop/api";

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
} from "./shop/mapper";

export { default as SouvenirProductView } from "./shop/SouvenirProductView";
export type { SouvenirProductViewProps } from "./shop/SouvenirProductView";

export type {
	ShopCatalogParams,
	ShopCatalogResponse,
	ShopProductDetail,
	ShopStockCheckResult,
	ShopStockRow,
} from "./shop/types";

export { CrfImage, getPlaceholderImage } from "./core/Media";

export {
	backfillSouvenirDisplayFields,
	buildCrfItemInput,
	buildCrfPayload,
	getCrfTotalFromData,
	mapCrfLineItemsToTableRows,
} from "./core/mapper";

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
} from "./core/schema";

export {
	ARTWORK_CUSTOM_PRESET,
	ARTWORK_RESOLUTION_PRESETS,
	CRF_CATEGORIES,
	findArtworkPreset,
	type ApiCrfItem,
	type ApiCrfOrder,
	type ArtworkResolutionPreset,
	type CrfCategory,
	type CrfCatalogItem,
	type CrfCatalogItemInput,
	type CrfDetail,
	type CrfItemInput,
	type CrfLineItem,
	type CrfOrderLineRecord,
	type CrfPayload,
	type CrfPermissions,
	type CrfProductRef,
	type CrfShopifyItem,
	type CrfShopifyItemInput,
	type CrfStatus,
} from "./core/types";

/* ---------------------------- Order (after approval) ---------------------------- */
//
// Reconciled with the real backend contract: updateDispatchDetails /
// swapSouvenirLines / placeOrder / retryOrder / cancelOrder
// (crfDispatchDetails.service.ts / crfOrder.service.ts). No delivery-
// estimate endpoint, no billing address, no formal debit-note document, no
// order polling — see order/types.ts's header comment for what changed.

export { default as CrfOrderSection } from "./order/CrfOrderSection";
export type { CrfOrderSectionProps } from "./order/CrfOrderSection";

export {
	crfOrderApi,
	useCancelCrfOrderMutation,
	usePlaceCrfOrderMutation,
	useRetryCrfOrderMutation,
	useSwapSouvenirLinesMutation,
	useUpdateDispatchDetailsMutation,
} from "./order/api";

export {
	CRF_ORDER_ACTIVE_STATUSES,
	CRF_STATUS_LABEL,
	isCrfOrderActive,
} from "./order/logic";

export {
	RECIPIENT_TYPES,
	RECIPIENT_TYPE_LABEL,
	type CrfDispatchFormErrors,
	type CrfDispatchFormField,
	type CrfDispatchFormValues,
	type DispatchDetailsInput,
	type RecipientType,
} from "./order/types";
