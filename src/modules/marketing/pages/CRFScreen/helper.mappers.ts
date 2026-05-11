import type { GroupedOption, LineItemOption, Product } from "../../types";

export const mapProductToLineItemOption = (item: Product): LineItemOption => {
	return {
		value: item.id,
		label: item.name,
		particular: item.id,
		description: item.description,
		rate: parseFloat(item.unitRate),
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

		const rate = Number(
			item.rate ?? item.amount ?? item.unitRate ?? product?.unitRate ?? 0,
		);

		const quantity = Number(item.quantity ?? item.qty ?? 1);

		return {
			value: product?.id ?? item.productId ?? item.product_id ?? "",
			label: product?.name ?? item.productName ?? item.product_name ?? "",
			particular: product?.id ?? item.productId ?? item.product_id ?? "",
			description: product?.description ?? item.description ?? "",
			rate,
			quantity,
			partNumber: product?.partNumber ?? item.partNumber ?? "",
			category: product?.category ?? item.category ?? "",
		};
	});
};
export const getLineItemsTotal = (items: any[] = []) => {
	return items.reduce((sum, item) => {
		const rate = Number(
			item.rate ?? item.amount ?? item.unitRate ?? item.product?.unitRate ?? 0,
		);

		const quantity = Number(item.quantity ?? item.qty ?? 0);

		return sum + rate * quantity;
	}, 0);
};

export const getCrfTotalFromData = (crfData: any) => {
	return getLineItemsTotal(crfData?.lineItems ?? []);
};
