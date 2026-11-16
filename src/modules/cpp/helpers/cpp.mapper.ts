import type {
	CppListItem,
	CppListingRow,
	DecimalValue,
} from "../types/cpp.types";

export const toNumber = (value: DecimalValue | undefined): number | null => {
	if (value === null || value === undefined || value === "") return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

export const toCppListingRow = (item: CppListItem): CppListingRow => ({
	id: item.id,
	referenceNumber: item.referenceNumber || "—",
	title: item.title?.trim() || "Untitled request",
	status: item.status || "--",
	materialCategory: item.materialCategory?.trim() || "—",
	requestType: item.requestType?.trim() || "—",
	supplier:
		[item.supplierCode, item.supplierName].filter(Boolean).join(" · ") || "—",
	plants: item.plantCodes?.length ? item.plantCodes.join(", ") : "—",
	itemCount: item.itemCount ?? 0,
	actualImpact: toNumber(item.actualImpact),
	annualisedImpact: toNumber(item.annualisedImpact),
	updatedAt: item.updated_at,
});
