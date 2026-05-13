import {
	getLineItemQuantity,
	getLineItemRate,
	getLineItemsTotal,
	toNumber,
} from "../../helpers/lineItemHelper";
import type { GroupedOption, LineItemOption, Product } from "../../types";

export const mapProductToLineItemOption = (item: Product): LineItemOption => {
	return {
		value: item.id,
		label: item.name,
		particular: item.id,
		description: item.description,
		rate: toNumber(item.unitRate),
		quantity: 1,
		partNumber: item.partNumber,
		category: item.category,
	};
};

export const groupProductsByCategory = (
	products: Product[],
): GroupedOption[] => {
	return Object.values(
		products.reduce<Record<string, GroupedOption>>((acc, item) => {
			if (!acc[item.category]) {
				acc[item.category] = {
					label: item.category,
					options: [],
				};
			}

			acc[item.category].options.push(mapProductToLineItemOption(item));

			return acc;
		}, {}),
	);
};

export const mapCrfLineItemsToFormItems = (
	lineItems: any[] = [],
): LineItemOption[] => {
	return lineItems.map((item) => {
		const product = item.product;

		return {
			value: product?.id ?? item.productId ?? item.product_id ?? "",
			label: product?.name ?? item.productName ?? item.product_name ?? "",
			particular: product?.id ?? item.productId ?? item.product_id ?? "",
			description: product?.description ?? item.description ?? "",
			rate: getLineItemRate(item),
			quantity: getLineItemQuantity(item),
			partNumber: product?.partNumber ?? item.partNumber ?? "",
			category: product?.category ?? item.category ?? "",
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
