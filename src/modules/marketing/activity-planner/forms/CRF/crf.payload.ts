import type { CrfCreatePayload, CrfUpdatePayload } from "../../types/crf.types";
import type { LineItemOption } from "../../types/lineItem.types";

const toNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

export const buildCrfPayload = (
	items: LineItemOption[],
	epcId: string,
): CrfCreatePayload | CrfUpdatePayload => {
	return {
		epcId,
		lineItems: items.map((item) => {
			const quantity = toNumber(item.quantity);
			const amount = toNumber(item.rate);

			return {
				productId: item.value || "",
				category: item.category || "UNCATEGORIZED",
				quantity,
				amount,
				total: toNumber(item.total ?? quantity * amount),
				description: item.description ?? "",
				width: item.width,
				height: item.height,
				unit: item.unit,
			};
		}),
	};
};
