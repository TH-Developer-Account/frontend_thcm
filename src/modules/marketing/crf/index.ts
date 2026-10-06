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

export { getCrfTotalFromData, mapCrfLineItemsToTableRows } from "./crf.mapper";

export {
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
	CRF_CATEGORIES,
	type CrfCategory,
	type CrfDetail,
	type CrfLineItemPayload,
	type CrfPayload,
} from "./crf.types";
