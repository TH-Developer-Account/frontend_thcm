// utils/lineItem.ts

import { toNumber } from "./common";

export { toNumber };

export const getLineItemQuantity = (item: any) =>
	toNumber(item.quantity ?? item.qty) || 1;

/** Backend `amount` is the final row total (not the unit rate). */
export const getLineItemAmount = (item: any) =>
	toNumber(item.amount ?? item.totalAmount ?? item.lineTotal);

export const getLineItemRate = (item: any) => {
	const amount = getLineItemAmount(item);
	const quantity = getLineItemQuantity(item);

	// Backend row: amount 6696, quantity 2 => rate 3348.
	if (amount > 0 && quantity > 0) return amount / quantity;

	return toNumber(
		item.rate ??
			item.unitRate ??
			item.unit_rate ??
			item.product?.unitRate ??
			item.product?.unit_rate,
	);
};

/** Backend row → amount; UI state → rate × quantity. */
export const getLineItemTotal = (item: any) => {
	const amount = getLineItemAmount(item);
	return amount > 0
		? amount
		: getLineItemRate(item) * getLineItemQuantity(item);
};

export const getLineItemsTotal = (items: any[] = []) =>
	items.reduce((sum, item) => sum + getLineItemTotal(item), 0);
