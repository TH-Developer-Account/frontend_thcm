export const toNumber = (value: any) => {
	const num = Number(value);
	return Number.isFinite(num) ? num : 0;
};

export const getLineItemQuantity = (item: any) => {
	return toNumber(item.quantity ?? item.qty) || 1;
};

export const getLineItemAmount = (item: any) => {
	return toNumber(item.amount ?? item.totalAmount ?? item.lineTotal);
};

export const getLineItemRate = (item: any) => {
	const amount = getLineItemAmount(item);
	const quantity = getLineItemQuantity(item);

	// Backend item has amount as final row total.
	// Example: amount 6696, quantity 2 => rate 3348.
	if (amount > 0 && quantity > 0) {
		return amount / quantity;
	}

	return toNumber(
		item.rate ??
			item.unitRate ??
			item.unit_rate ??
			item.product?.unitRate ??
			item.product?.unit_rate ??
			0,
	);
};

export const getLineItemTotal = (item: any) => {
	const amount = getLineItemAmount(item);

	// Backend response: amount is already final row total.
	if (amount > 0) {
		return amount;
	}

	// UI state: rate and quantity are separate.
	return getLineItemRate(item) * getLineItemQuantity(item);
};

export const getLineItemsTotal = (items: any[] = []) => {
	return items.reduce((sum, item) => {
		return sum + getLineItemTotal(item);
	}, 0);
};
