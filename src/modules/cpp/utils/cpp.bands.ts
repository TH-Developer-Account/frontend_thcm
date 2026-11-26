// utils/cpp.bands.ts — the approval-matrix ranges, shown as dropdown options in
// Purchasing details ("Highest value per part", "Highest price variation",
// annualised value / impact, actual impact).
//
// Mirror of the band grids in the backend cpp.rules.ts (CPP_Apprval_Flow_Matrix.xlsx).
// An option's value is its band key `${gt}_${lte}` (e.g. "1000000_20000000",
// "_10000", "100000_"). The backend builds the same key from its own grid and
// routes on it, so when the workbook changes, change BOTH lists.
// The upper bound belongs to the lower band (Q6): "Up to 10 L" includes 10 L.
import { getCondition, isSpareRequest } from "./cpp.utils";

type Band = { gt?: number; lte?: number };
type Cell = { amount: Band; part?: Band };
type Grid = { main: Cell[]; spare?: Cell[] };

export type CppBandOption = { value: string; label: string };
export type CppBandUnit = "INR" | "PCT";

const LAC = 100_000;
const CR = 10_000_000;

const upTo = (n: number): Band => ({ lte: n });
const between = (a: number, b: number): Band => ({ gt: a, lte: b });
const above = (n: number): Band => ({ gt: n });
const cell = (amount: Band, part?: Band): Cell =>
	part ? { amount, part } : { amount };

// Highest value per part (₹) — sheets 1 and 5.
const P_LT_10K = upTo(10_000);
const P_10K_1L = between(10_000, LAC);
const P_GT_1L = above(LAC);
// Highest price variation (absolute %) — sheet 2.
const V_LT_5 = upTo(5);
const V_5_15 = between(5, 15);
const V_GT_15 = above(15);

const L10_L50: Cell[] = [
	cell(upTo(10 * LAC)),
	cell(between(10 * LAC, 50 * LAC)),
	cell(above(50 * LAC)),
];

/** Same order as the backend grids (the order is the rule number). */
const GRIDS: Record<string, Grid> = {
	FIRST_TIME_REGULAR: {
		main: [
			cell(upTo(10 * LAC), P_LT_10K),
			cell(between(10 * LAC, 2 * CR), P_LT_10K),
			cell(above(2 * CR), P_LT_10K),
			cell(between(0, 2 * CR), P_10K_1L),
			cell(above(2 * CR), P_10K_1L),
			cell(above(0), P_GT_1L),
		],
	},
	PRICE_CHANGE: {
		main: [
			cell(upTo(5 * LAC), V_LT_5),
			cell(between(5 * LAC, CR), V_LT_5),
			cell(above(CR), V_LT_5),
			cell(upTo(LAC), V_5_15),
			cell(between(LAC, CR), V_5_15),
			cell(above(CR), V_5_15),
			cell(upTo(LAC), V_GT_15),
			cell(above(LAC), V_GT_15),
		],
	},
	STEEL_COMMODITY: { main: L10_L50 },
	EMERGENCY_ONETIME: { main: L10_L50 },
	PROTOTYPE: {
		main: [
			cell(upTo(10 * LAC), P_LT_10K),
			cell(between(10 * LAC, CR), P_LT_10K),
			cell(above(CR), P_LT_10K),
			cell(between(0, CR), P_10K_1L),
			cell(above(CR), P_10K_1L),
			cell(above(0), P_GT_1L),
		],
	},
	FIRST_TIME_INDIRECT: {
		main: [
			cell(upTo(8 * LAC)),
			cell(between(8 * LAC, 75 * LAC)),
			cell(above(75 * LAC)),
		],
	},
	PRICE_VARIATION_INDIRECT: {
		main: [
			cell(upTo(5 * LAC)),
			cell(between(5 * LAC, 25 * LAC)),
			cell(above(25 * LAC)),
		],
	},
	ONETIME_INDIRECT: { main: L10_L50 },
	CRUDE_OIL: {
		main: [cell(upTo(25 * LAC)), cell(above(25 * LAC))],
		// Workbook Spares block as written: up to 10 L, above 25 L (gap = Q8).
		spare: [cell(upTo(10 * LAC)), cell(above(25 * LAC))],
	},
};

/** Same key the backend builds (cpp.rules.ts bandKey). */
export const bandKey = (band: Band): string =>
	`${band.gt ?? ""}_${band.lte ?? ""}`;

const parseKey = (key: string): Band | null => {
	const [gt, lte] = key.split("_");
	if (gt === undefined || lte === undefined) return null;
	return {
		...(gt === "" ? {} : { gt: Number(gt) }),
		...(lte === "" ? {} : { lte: Number(lte) }),
	};
};

const short = (n: number) => String(Number(n.toFixed(2)));

const rupees = (n: number): string => {
	if (n >= CR) return `₹${short(n / CR)} Cr`;
	if (n >= LAC) return `₹${short(n / LAC)} L`;
	return `₹${n.toLocaleString("en-IN")}`;
};

export const bandLabel = (band: Band, unit: CppBandUnit = "INR"): string => {
	const format = unit === "PCT" ? (n: number) => `${n}%` : rupees;
	const low = band.gt ?? 0;
	if (band.lte === undefined)
		return low > 0 ? `Above ${format(low)}` : "Any value";
	if (low > 0) return `${format(low)} – ${format(band.lte)}`;
	return `Up to ${format(band.lte)}`;
};

/** Label of a saved band key; "" when blank or malformed. */
export const bandLabelOf = (key: string, unit: CppBandUnit = "INR"): string => {
	if (!key) return "";
	const band = parseKey(key);
	return band ? bandLabel(band, unit) : key;
};

/** Unit of the condition's first band (% for Price Change, ₹ otherwise). */
export const partBandUnit = (condition: string): CppBandUnit =>
	getCondition(condition)?.partBasis === "VARIATION_PCT" ? "PCT" : "INR";

/** Crude oil Spares has its own grid; every other sheet uses its main grid. */
const cellsFor = (condition: string, category: string, plant: string) => {
	const grid = GRIDS[condition];
	if (!grid) return [];
	return isSpareRequest(category, plant) && grid.spare ? grid.spare : grid.main;
};

const unique = (options: CppBandOption[]) =>
	options.filter(
		(option, index) =>
			options.findIndex((other) => other.value === option.value) === index,
	);

/** First dropdown: highest value per part / price variation %. [] when the sheet has none. */
export const partBandOptions = (
	condition: string,
	category: string,
	plant: string,
): CppBandOption[] => {
	const unit = partBandUnit(condition);
	return unique(
		cellsFor(condition, category, plant)
			.filter((c): c is Cell & { part: Band } => Boolean(c.part))
			.map((c) => ({ value: bandKey(c.part), label: bandLabel(c.part, unit) })),
	);
};

/**
 * Second dropdown: annualised value / impact or actual impact. On sheets with a
 * part band the ranges depend on the part band picked first ([] until it is).
 */
export const amountBandOptions = (
	condition: string,
	category: string,
	plant: string,
	partBand: string,
): CppBandOption[] => {
	const cells = cellsFor(condition, category, plant);
	const hasPart = cells.some((c) => c.part);
	if (hasPart && !partBand) return [];
	return unique(
		cells
			.filter((c) => !c.part || bandKey(c.part) === partBand)
			.map((c) => ({ value: bandKey(c.amount), label: bandLabel(c.amount) })),
	);
};
