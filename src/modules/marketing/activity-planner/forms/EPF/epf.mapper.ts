import {
	getLineItemQuantity,
	getLineItemRate,
	getLineItemsTotal,
} from "../../../helpers/lineItemHelper";

import type { LineItemOption } from "../../../types";
import type { EpfFormValues, EpfProduct } from "../../types/epf.types";

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
		particular: item.name,
		description: item.description ?? "",
		rate: Number(item.unitRate || 0),
		quantity: 1,
		category: item.category ?? "EVENT_OVERHEAD",
	};
};

export const mapEpfProductsToOptions = (
	products: EpfProduct[] = [],
): LineItemOption[] => {
	return products.map(mapProductToEpfOption);
};

export const mapEpfLineItemsToFormItems = (
	lineItems: any[] = [],
): LineItemOption[] => {
	return lineItems.map((item) => {
		const product = item.product;

		return {
			value: product?.id ?? item.productId ?? item.product_id ?? "",
			label:
				product?.name ??
				item.productName ??
				item.product_name ??
				item.particular ??
				item.particulars ??
				item.item_name ??
				"",
			particular:
				product?.name ??
				item.productName ??
				item.product_name ??
				item.particular ??
				item.particulars ??
				item.item_name ??
				"",
			description: product?.description ?? item.description ?? "",
			rate: getLineItemRate(item),
			quantity: getLineItemQuantity(item),
			partNumber: product?.partNumber ?? item.partNumber ?? "",
			category: product?.category ?? item.category ?? "EVENT_OVERHEAD",
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
