// utils/cpp.parts.ts — the summary sheet rows (part info) the server read at upload.
// Used by the part pickers in Purchasing details and the part table of the CPP document.
import type {
	CppAmountBasis,
	CppDetail,
	CppSummaryPart,
} from "../types/cpp.types";
import { amountToNumber } from "./cpp.amount";

export const emptySummaryPart = (): CppSummaryPart => ({
	slNo: "",
	plant: "",
	model: "",
	partNo: "",
	description: "",
	uom: "",
	existingPrice: "",
	newPrice: "",
	difference: "",
	currentPo: "",
	effectiveDate: "",
	receivedQty: "",
	actualImpact: "",
	abpVolume: "",
	qtyPerMachine: "",
	annualisedImpact: "",
	changePct: "",
});

/** API rows (numbers may arrive as numbers or null) -> string rows. */
export const toSummaryParts = (rows: CppDetail["parts"]): CppSummaryPart[] =>
	(Array.isArray(rows) ? rows : [])
		.map((row) => {
			const part = emptySummaryPart();
			for (const key of Object.keys(part) as (keyof CppSummaryPart)[]) {
				const value = row?.[key];
				part[key] = value === null || value === undefined ? "" : String(value);
			}
			return part;
		})
		.filter((part) => part.partNo.trim() !== "");

/** One row per part and plant in the sheet, so both make the key. */
export const partKey = (part: Pick<CppSummaryPart, "plant" | "partNo">) =>
	`${part.plant.trim().toUpperCase()}::${part.partNo.trim().toUpperCase()}`;

export const partLabel = (part: CppSummaryPart) =>
	[part.partNo, part.plant, part.description].filter(Boolean).join(" · ");

/** "Highest value per part" reads the new (finalised) unit price. */
export const partPriceOf = (part: CppSummaryPart): number | null =>
	amountToNumber(part.newPrice);

/**
 * The amount band value of ONE part, from the sheet columns:
 *   ANNUALISED_IMPACT -> "Annualised Impact"
 *   ACTUAL_IMPACT     -> "Actual Impact"
 *   ANNUALISED_VALUE  -> new price × ABP vol × qty per m/c (falls back to
 *                        "Annualised Impact" when a quantity is missing)
 * ASSUMPTION — confirm the ANNUALISED_VALUE rule with the business.
 */
export const partAmountOf =
	(basis: CppAmountBasis) =>
	(part: CppSummaryPart): number | null => {
		if (basis === "ANNUALISED_IMPACT")
			return amountToNumber(part.annualisedImpact);
		if (basis === "ACTUAL_IMPACT") return amountToNumber(part.actualImpact);
		const price = amountToNumber(part.newPrice);
		const volume = amountToNumber(part.abpVolume);
		const perMachine = amountToNumber(part.qtyPerMachine);
		if (price !== null && volume !== null && perMachine !== null)
			return Math.round(price * volume * perMachine * 100) / 100;
		return amountToNumber(part.annualisedImpact);
	};

export type PartOption = { key: string; part: CppSummaryPart; value: number };

/** Parts that have a value for `valueOf`, highest first. */
export const partOptions = (
	parts: CppSummaryPart[],
	valueOf: (part: CppSummaryPart) => number | null,
): PartOption[] =>
	parts
		.map((part) => ({ key: partKey(part), part, value: valueOf(part) }))
		.filter((option): option is PartOption => option.value !== null)
		.sort((a, b) => b.value - a.value);
