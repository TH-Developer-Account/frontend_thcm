import type { CrfCreatePayload, CrfUpdatePayload } from "../../types/crf.types";
import type { LineItemOption } from "../../../types";

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
			const amount = toNumber(item.rate ?? item.amount);
			const total = toNumber(item.total) || quantity * amount;

			return {
				productId: String(item.value || item.productId || ""),
				category: item.category || "",
				quantity,
				amount,
				total,
				description: item.description ?? "",
			};
		}),
	};
};
