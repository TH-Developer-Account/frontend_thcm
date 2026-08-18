import {
	getLineItemQuantity,
	getLineItemRate,
	getLineItemsTotal,
} from "../../helpers/lineItemHelper";

import type { LineItemOption, TableRow } from "../../types/lineItem.types";
import type { EpfFormValues, EpfProduct } from "../../types/epf.types";

const EPF_OVERHEAD_CATEGORY = "EVENT_OVERHEAD";

const toNumber = (value: unknown, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const getProduct = (item: any) => item?.product ?? {};

const getProductId = (item: any) => {
	const product = getProduct(item);

	return product?.id ?? item?.productId ?? item?.product_id ?? "";
};

const getProductName = (item: any) => {
	const product = getProduct(item);

	return (
		product?.name ??
		item?.productName ??
		item?.product_name ??
		item?.particulars ??
		item?.particular ??
		item?.item_name ??
		item?.name ??
		"--"
	);
};

const getDescription = (item: any) => {
	const product = getProduct(item);

	return product?.description ?? item?.description ?? "--";
};

const getCategory = (item: any) => {
	const product = getProduct(item);

	return (
		product?.category ??
		item?.category ??
		item?.productCategory ??
		item?.product_category ??
		EPF_OVERHEAD_CATEGORY
	);
};

const getPartNumber = (item: any) => {
	const product = getProduct(item);

	return product?.partNumber ?? item?.partNumber ?? "";
};

export const initialEpfValues: EpfFormValues = {
	externalParticipants: 0,
	internalParticipants: 0,
	totalParticipants: 0,

	crfTotal: 0,
	eventBudget: 0,
	annualBudget: 0,
	availableBudget: 0,
	allotedBudget: 0,

	dealerName: "",
	dealerPercent: 50,
	dealerShare: 0,

	tataHitachiPercent: 50,
	tataHitachiShare: 0,
	tataHitachiPoAmount: 0,
};

export const mapProductToEpfOption = (item: EpfProduct): LineItemOption => {
	return {
		partNumber: item.partNumber,

		value: item.id,

		label: item.name,

		particular: item?.partNumber ?? item.name,

		description: item.description ?? "",

		rate: Number(item.unitRate || 0),

		quantity: 1,

		category: item.category ?? EPF_OVERHEAD_CATEGORY,
	};
};

export const mapEpfProductsToOptions = (
	products: EpfProduct[] = [],
): LineItemOption[] => {
	return products.map(mapProductToEpfOption);
};

/**
 * Form mapper.
 * Use this only for editable LineItemTable values.
 */
export const mapEpfLineItemsToFormItems = (
	lineItems: any[] = [],
): LineItemOption[] => {
	return lineItems.map((item) => {
		return {
			id: item?.id,
			value: getProductId(item),
			label: getProductName(item),
			particular: getProductName(item),
			description: getDescription(item),
			rate: getLineItemRate(item),
			quantity: getLineItemQuantity(item),
			partNumber: getPartNumber(item),
			category: getCategory(item),
			total: toNumber(item?.total),

			quotationFileUrl: getQuotationUrl(item),
			quotationFileName: getQuotationFileName(item),
		};
	});
};
/**
 * View mapper.
 * Use this only for readonly LineTableView.
 */

export const mapEpfLineItemsToTableRows = (
	lineItems: unknown[] = [],
): TableRow[] => {
	return lineItems.map((rawItem, index) => {
		const item = rawItem as Record<string, unknown>;

		const rate = getLineItemRate(item);
		const qty = getLineItemQuantity(item);

		const hasProvidedTotal =
			item.total !== undefined && item.total !== null && item.total !== "";

		const total = hasProvidedTotal ? toNumber(item.total) : rate * qty;

		return {
			id: typeof item.id === "string" ? item.id : undefined,
			sno: index + 1,
			partNumber: getPartNumber(item),
			particulars: getProductName(item),
			description: getDescription(item),
			rate,
			qty,
			total,
			category: getCategory(item),
			height:
				typeof item.height === "string" || typeof item.height === "number"
					? item.height
					: undefined,
			width:
				typeof item.width === "string" || typeof item.width === "number"
					? item.width
					: undefined,
			quotationUrl: getQuotationUrl(item),
			quotationFileName: getQuotationFileName(item),
		};
	});
};

export const getCrfTotalFromData = (crfData: any) => {
	const crf =
		crfData?.crf ??
		crfData?.data?.crf ??
		crfData?.data?.data?.crf ??
		crfData?.data ??
		crfData;

	return getLineItemsTotal(crf?.lineItems ?? []);
};

export const mapEpfResponseToFormValues = (
	epfData?: any,
	crfTotal = 0,
): EpfFormValues => {
	const external = Number(epfData?.externalParticipants || 0);
	const internal = Number(epfData?.internalParticipants || 0);

	return {
		...initialEpfValues,

		externalParticipants: external,
		internalParticipants: internal,
		totalParticipants: epfData?.totalParticipants ?? external + internal,

		crfTotal,
		eventBudget: Number(epfData?.eventBudget || 0),
		annualBudget: Number(epfData?.annualBudget || 0),
		availableBudget: Number(epfData?.availableBudget || 0),
		allotedBudget: Number(epfData?.allotedBudget || 0),

		dealerName: epfData?.dealerName || "",
		dealerPercent: Number(epfData?.dealerPercent ?? 50),
		dealerShare: Number(epfData?.dealerShare || 0),

		tataHitachiPercent: Number(epfData?.tataHitachiPercent ?? 50),
		tataHitachiShare: Number(epfData?.tataHitachiShare || 0),
		tataHitachiPoAmount: Number(epfData?.tataHitachiPoAmount || 0),
	};
};

export const mapBudgetInfoToFormValues = (budgetInfo?: any) => {
	return {
		availableBudget: Number(
			budgetInfo?.Available ??
				budgetInfo?.availableBudget ??
				budgetInfo?.available_budget ??
				0,
		),
		annualBudget: Number(
			budgetInfo?.Budget ??
				budgetInfo?.annualBudget ??
				budgetInfo?.annual_budget ??
				0,
		),
		allotedBudget: Number(
			budgetInfo?.Allocated ??
				budgetInfo?.allotedBudget ??
				budgetInfo?.allottedBudget ??
				budgetInfo?.allocated_budget ??
				0,
		),
	};
};

const getQuotationUrl = (item: any) => {
	return (
		item?.quotationUrl ??
		item?.quotation_url ??
		item?.quotation?.url ??
		item?.quotationFile?.url ??
		item?.fileUrl ??
		item?.file_url ??
		null
	);
};

const getQuotationFileName = (item: any) => {
	return (
		item?.quotationFileName ??
		item?.quotation_file_name ??
		item?.quotation?.fileName ??
		item?.quotation?.filename ??
		item?.quotationFile?.fileName ??
		item?.fileName ??
		item?.filename ??
		null
	);
};
