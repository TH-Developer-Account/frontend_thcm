import {
	getLineItemQuantity,
	getLineItemRate,
	getLineItemsTotal,
} from "../../../helpers/lineItemHelper";
import type { EpfFormValues, LineItemOption, Product } from "../../../types";

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

export const mapProductToEpfOption = (item: Product): LineItemOption => {
	return {
		partNumber: item.partNumber,
		value: item.id,
		label: item.name,
		particular: item.name,
		description: item.description,
		rate: parseFloat(String(item.unitRate || 0)),
		quantity: 1,
		category: item.category,
	};
};

export const mapEpfLineItemsToFormItems = (
	lineItems: any[] = [],
): LineItemOption[] => {
	return lineItems.map((item) => {
		const product = item.product;

		return {
			value: product?.id ?? item.productId ?? item.product_id ?? "",
			label: product?.name ?? item.productName ?? item.product_name ?? "",
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

export const mapEpfResponseToFormValues = (
	epfData: any,
	crfTotal = 0,
): EpfFormValues => {
	const external = Number(epfData?.externalParticipants || 0);
	const internal = Number(epfData?.internalParticipants || 0);

	return {
		...initialEpfValues,
		crfTotal,
		externalParticipants: external,
		internalParticipants: internal,
		totalParticipants: external + internal,
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

export const getCrfTotalFromData = (crfData: any) => {
	const crf =
		crfData?.crf ??
		crfData?.data?.crf ??
		crfData?.data?.data?.crf ??
		crfData?.data ??
		crfData;

	return getLineItemsTotal(crf?.lineItems ?? []);
};
