export const mapLineItems = (items: any[] = []) => {
	return items.map((item, index) => {
		const product = item.product;
		const rate = Number(item.rate || item.amount || 0);
		const qty = Number(item.qty || item.quantity || 0);

		return {
			id: item.id,
			sno: index + 1,
			particulars:
				item.particulars ||
				item.item_name ||
				item.name ||
				item.product?.name || // ✅ FIX HERE
				"--",
			description:
				item.description ||
				item.product?.description || // ✅ FIX HERE
				"--",
			// ✅ category mapping fixed
			category: item.category || product?.category || "--",
			rate,
			qty,
			total: Number(item.total || rate),
		};
	});
};
