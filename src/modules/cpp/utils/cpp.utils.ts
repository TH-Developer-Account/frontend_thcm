// utils/cpp.utils.ts — constants, defaults and calculations for the CPP form.
import type {
	CppAmortRow,
	CppConditionGroup,
	CppConditionOption,
	CppCostTrackerRow,
	CppFinancialPlantRow,
	CppFormValues,
	CppLocationGroup,
	CppLocationRow,
	CppOtherPlantPriceRow,
	CppPartRow,
	CppPerMachineRow,
	CppPlant,
	CppStep,
	CppStepKey,
	CppSupplier,
	CppTabKey,
	CppVolumeRow,
} from "../types/cpp.types";
import { CPP_CONDITIONS } from "./cpp.constants";

/* ------------------------------ constants ------------------------------ */

export const CPP_REASONS = [
	"Commodity price change",
	"Supplier price revision",
	"Annual price increase",
	"Currency / exchange variation",
	"Design change",
	"Process change",
	"New part – first time purchase",
	"Alternate source development",
	"Volume change",
	"Tooling amortisation",
	"Logistics cost change",
	"Other (specify in justification)",
];
/** Effect (Q/C/D) is only for existing materials. */
export const NEW_PART_REASON = "New part – first time purchase";

export const CPP_EFFECTS = ["Quality", "Cost", "Delivery"] as const;
export const CPP_MODELS = [
	"ZX130",
	"ZX210",
	"ZX350",
	"ZW180",
	"ZW220",
	"EX200",
];
export const CPP_PLANTS: CppPlant[] = ["DWD", "KGP", "SPARE"];
export const CPP_PLANT_CODES: Record<CppPlant, string> = {
	DWD: "1006",
	KGP: "3006",
	SPARE: "Spares",
};
export const CPP_AUTHORITIES = ["SCM", "CPP", "MD", "Spare"];

/**
 * SAP plant codes from "Applicable Plant(s)" in the CPP format.
 * PLANT rows show for Plant = DWD / KGP, SPARE rows for Plant = Spares.
 */
export const CPP_LOCATIONS: ReadonlyArray<{
	code: string;
	name: string;
	group: CppLocationGroup;
}> = [
	{ code: "1006", name: "DWD", group: "PLANT" },
	{ code: "3006", name: "KGP", group: "PLANT" },
	{ code: "8445", name: "KGP WH", group: "SPARE" },
	{ code: "8580", name: "DWD WH", group: "SPARE" },
	{ code: "8400", name: "NGP", group: "SPARE" },
];

export const CPP_PRICING_CONDITIONS = [
	{
		value: "PB00",
		label: "Regular price (PB00)",
		description: "Applies to all future POs until revised",
	},
	{
		value: "PB25",
		label: "One-time price (PB25)",
		description: "Single purchase; not a basis for future POs",
	},
	{
		value: "PB50",
		label: "Amortised price (PB50)",
		description: "Tooling / development cost recovered over volume",
	},
	{
		value: "PB75",
		label: "Provisional price (PB75)",
		description: "Interim price until the final rate is agreed",
	},
];
export const AMORTISED_CONDITION = "PB50";

/**
 * Attachment slots. "annualisedImpact" and the first seven are the Mandatory
 * Check List (see CPP_CHECKLIST); the rest are supporting documents; "partSummary"
 * is the summary sheet (part info) uploaded from the Purchasing details tab.
 */
export const CPP_ATTACHMENTS = [
	{ key: "annualisedImpact", label: "Annualized impact calculation" },
	{ key: "modelImpact", label: "Model wise impact calculation" },
	{ key: "zbc", label: "ZBC calculation" },
	{ key: "commodityTrend", label: "Commodity price trend" },
	{ key: "ecn", label: "ECN note" },
	{ key: "nesting", label: "Nesting calculation" },
	{ key: "comparativeQuote", label: "Comparative quote / analysis" },
	{ key: "addDeleteList", label: "Add / delete list (change details)" },
	{ key: "oldCost", label: "Old cost details with workings" },
	{ key: "clpSpares", label: "CLP for spares" },
	{ key: "steelApproval", label: "Steel rate approvals" },
	{ key: "partSummary", label: "Summary sheet (part info)" },
] as const;

/**
 * Mandatory Check List (Attachments tab). Each row has a Yes / No / NA answer
 * and an upload button. Every row must be answered before submit.
 */
export const CPP_CHECKLIST = [
	{ key: "annualisedImpact", label: "Annualized Impact Cal." },
	{ key: "modelImpact", label: "Model wise Impact Cal." },
	{ key: "zbc", label: "ZBC Calculation" },
	{ key: "commodityTrend", label: "Commodity Price Trend" },
	{ key: "ecn", label: "ECN attached" },
	{ key: "nesting", label: "Nesting Calculation" },
	{ key: "comparativeQuote", label: "Comparative Quote./Ana." },
] as const;

/** The checklist rows' attachment keys. */
const CHECKLIST_KEYS: ReadonlyArray<string> = CPP_CHECKLIST.map(
	(item) => item.key,
);

/** Supporting documents: the attachments that are not checklist rows or the summary. */
export const CPP_SUPPORTING_DOCS = CPP_ATTACHMENTS.filter(
	(item) => !CHECKLIST_KEYS.includes(item.key) && item.key !== "partSummary",
);

// Sample master-data lists — replace with master APIs when available.
export const MATERIAL_GROUPS = [
	"Forgings",
	"Castings",
	"Hydraulics",
	"Fasteners",
	"Rubber / Hoses",
];
export const MATERIAL_TYPES = ["ROH", "HALB", "ERSA"];
export const PRICE_TYPES = ["Standard", "Moving average"];
export const INCO_TERMS = ["EXW", "FOR", "CIF", "DAP"];
export const TAX_CODES = ["BA", "BB", "VA", "N/A"];
export const YES_NO = ["Yes", "No"];
export const UOM_OPTIONS = ["NOS", "KG", "MTR", "SET", "LTR"];

export const MIN_JUSTIFICATION = 50;

/** Row cap for the amortisation / per-machine / tracker tables (backend allows the same). */
export const CPP_MAX_TABLE_ROWS = 20;

// Older tab list — still exported for anything that imports it.
export const CPP_TABS: { value: CppTabKey; label: string }[] = [
	{ value: "master", label: "Master Data" },
	{ value: "purchasing", label: "Purchasing Details" },
	{ value: "financial", label: "Financial Impact" },
	{ value: "amortisation", label: "Amortisation" },
	{ value: "tracker", label: "Material Cost Tracker" },
	{ value: "other", label: "Other Data" },
	{ value: "workflow", label: "Workflow" },
];

/* ------------------------------ wizard steps ----------------------------- */

const CPP_STEP_DEFS: { key: CppStepKey; label: string }[] = [
	{ key: "basic", label: "Basic details" },
	{ key: "master", label: "Master data" },
	{ key: "purchasing", label: "Purchasing details" },
	{ key: "amortisation", label: "Amortisation" },
	{ key: "volumes", label: "Volumes & impact" },
	{ key: "other", label: "Other data" },
	{ key: "attachments", label: "Attachments" },
	{ key: "workflow", label: "Review & workflow" },
];

/**
 * Steps for the current form. Amortisation is only a step when the pricing
 * condition is PB50. Ids are renumbered so the stepper always reads 1…n.
 */
export const getCppSteps = (pricingCondition: string): CppStep[] =>
	CPP_STEP_DEFS.filter(
		(step) =>
			step.key !== "amortisation" || pricingCondition === AMORTISED_CONDITION,
	).map((step, index) => ({ ...step, id: index + 1 }));

/** Steps without amortisation — kept for anything that imports the old constant. */
export const CPP_STEPS: CppStep[] = getCppSteps("");

// Material Cost Tracker is now part of the "Volumes & impact" step.
export const MATERIAL_COST_TRACKER_ENABLED = true;

/* ----------------------- category / condition rules ---------------------- */

export const getCondition = (code: string): CppConditionOption | undefined =>
	CPP_CONDITIONS.find((condition) => condition.value === code);

/** Indirect category → indirect sheets; every other category → direct sheets. */
export const getConditionGroup = (category: string): CppConditionGroup =>
	category === "Indirect" ? "INDIRECT" : "DIRECT";

export const getConditionOptions = (
	category: string,
): { label: string; value: string }[] => {
	if (!category) return [];
	// Steel category has exactly one scenario, and that scenario is Steel-only.
	if (category === "STEEL")
		return CPP_CONDITIONS.filter((c) => c.value === "STEEL_COMMODITY").map(
			({ value, label }) => ({ value, label }),
		);
	return CPP_CONDITIONS.filter(
		(condition) =>
			condition.group === getConditionGroup(category) &&
			condition.value !== "STEEL_COMMODITY",
	).map(({ value, label }) => ({ value, label }));
};

export const isConditionAllowed = (
	condition: string,
	category: string,
): boolean =>
	getConditionOptions(category).some((option) => option.value === condition);

/** Spares flow. Assumption (open question Q3): category = Spares OR plant = Spares. */
export const isSpareRequest = (category: string, plant: string): boolean =>
	category === "SPARES" || plant === "Spares";

/* --------------------------- plant / spare codes -------------------------- */

/** Plant dropdown → which table shows in Master data. */
export const getLocationGroup = (plant: string): CppLocationGroup | null => {
	if (!plant) return null;
	return plant === "Spares" ? "SPARE" : "PLANT";
};

/** The request's own plant code is always applicable (DWD → 1006, KGP → 3006). */
export const getOwnLocationCode = (plant: string): string | null =>
	CPP_LOCATIONS.find(
		(location) => location.group === "PLANT" && location.name === plant,
	)?.code ?? null;

export const isLocationApplicable = (
	row: CppLocationRow,
	plant: string,
): boolean => row.applicable || row.code === getOwnLocationCode(plant);

/** Rows of the plant's group that apply — what is saved and sent to TCS. */
export const getApplicableLocations = (
	rows: CppLocationRow[],
	plant: string,
): CppLocationRow[] => {
	const group = getLocationGroup(plant);
	if (!group) return [];
	return rows.filter(
		(row) => row.group === group && isLocationApplicable(row, plant),
	);
};

/* ------------------------------ defaults ------------------------------- */

export const emptySupplier = (): CppSupplier => ({
	partnerId: "",
	name: "",
	code: "",
	manual: false,
});
export const emptyPart = (): CppPartRow => ({
	partNo: "",
	description: "",
	uom: "",
	existingRate: "",
	existingWef: "",
	quotedRate: "",
	quotedWef: "",
	finalRate: "",
	finalWef: "",
	qtyReceived: "",
	qtyRemaining: "",
	qtyAnnual: "",
});
export const emptyAmort = (): CppAmortRow => ({
	partNo: "",
	priceInclAmort: "",
	cutoffDate: "",
	amortQty: "",
	priceAfterAmort: "",
});
export const emptyVolume = (): CppVolumeRow => ({
	received: "",
	remaining: "",
	annual: "",
});
export const emptyPerMachine = (): CppPerMachineRow => ({
	plant: "",
	model: "",
	withAmort: "",
	withoutAmort: "",
});
export const emptyCostTracker = (): CppCostTrackerRow => ({
	model: "",
	perMachineImpact: "",
	budgetedIncrease: "",
	statusYtd: "",
	budgetedMaterialCost: "",
	materialCostYtd: "",
});
export const emptyFinancialPlant = (): CppFinancialPlantRow => ({
	actualInr: "",
	actualPct: "",
	annualisedInr: "",
	annualisedPct: "",
});
export const emptyPlantPrice = (): CppOtherPlantPriceRow => ({
	plant: "",
	partNumber: "",
	price: "",
});
export const emptyLocations = (): CppLocationRow[] =>
	CPP_LOCATIONS.map((location) => ({
		...location,
		applicable: false,
		incoTerms: "",
		purchasingGroup: "",
		taxCode: "",
		storeLocation: "",
		pfPct: "",
	}));

/** True when every text cell of a table row is empty (such rows are not saved). */
export const isBlankRow = (row: object): boolean =>
	Object.values(row).every(
		(value) => typeof value !== "string" || value.trim() === "",
	);

const todayISO = () => new Date().toISOString().slice(0, 10);

export const getDefaultValues = (): CppFormValues => ({
	category: "",
	plant: "",
	condition: "",
	materialType: "",
	effects: [],
	reason: "",
	priceType: "STANDARD",
	justification: "",
	initiationDate: todayISO(),
	suppliers: {
		existing: emptySupplier(),
		other: emptySupplier(),
		recommended: emptySupplier(),
	},
	purchasingFile: null,
	approvalValues: {
		partValue: "",
		variationPct: "",
		amount: "",
		partValuePart: "",
		amountPart: "",
		partBand: "",
		amountBand: "",
	},
	amortisation: [emptyAmort()],
	volumes: { DWD: emptyVolume(), KGP: emptyVolume(), SPARE: emptyVolume() },
	perMachineImpact: [emptyPerMachine()],
	costTracker: [emptyCostTracker()],
	other: {
		remarks: "",
		checklist: Object.fromEntries(CHECKLIST_KEYS.map((key) => [key, ""])),
		plantPrices: [],
	},
	attachments: Object.fromEntries(CPP_ATTACHMENTS.map((a) => [a.key, null])),
	masterData: {
		materialGroup: "",
		materialType: "",
		purchasingGroup: "",
		priceType: "Standard",
		incoTerms: "",
		taxCode: "",
		storeLocation: "",
		validFrom: "",
		updateSourceList: "",
		plants: [],
		note: "",
		plantDetails: emptyLocations(),
	},
	// No typed line items any more — the Excel carries them.
	parts: [],
	// Summary-sheet rows read by the server; filled when a saved request loads.
	summaryParts: [],
	financial: {
		noChange: false,
		plantSplit: { DWD: "", KGP: "", SPARE: "" },
		plants: {
			DWD: emptyFinancialPlant(),
			KGP: emptyFinancialPlant(),
			SPARE: emptyFinancialPlant(),
		},
		totalActualPct: "",
		totalAnnualisedPct: "",
	},
	workflow: {
		models: [],
		plants: [],
		pricingCondition: "",
		spares: false,
		authority: "",
	},
});

/* ---------------------------- calculations ----------------------------- */

export const toNum = (value: string | undefined | null): number | null => {
	const parsed = parseFloat(String(value ?? "").replace(/,/g, ""));
	return Number.isNaN(parsed) ? null : parsed;
};

/** Same rule as the backend decimal check: optional minus, digits, optional decimals. */
export const isNumberText = (value: string): boolean =>
	/^-?\d+(\.\d+)?$/.test(value.replace(/[,\s₹]/g, ""));

export const formatINR = (value: number | null): string =>
	value === null
		? "—"
		: `₹ ${value.toLocaleString("en-IN", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}`;

/** ₹ in the units the approval circular uses (Lacs / Cr). */
export const formatLacs = (value: number | null): string => {
	if (value === null) return "—";
	const abs = Math.abs(value);
	return abs >= 1e7
		? `₹ ${(value / 1e7).toFixed(2)} Cr`
		: `₹ ${(value / 1e5).toFixed(2)} Lacs`;
};

export const formatQty = (value: number | null): string =>
	value === null
		? "—"
		: value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const formatPct = (value: number | null): string =>
	value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

export const pctChange = (
	existing: string,
	finalised: string,
): number | null => {
	const a = toNum(existing);
	const b = toNum(finalised);
	return a && b !== null ? ((b - a) / a) * 100 : null;
};

export type PartImpact = {
	delta: number | null;
	pct: number | null;
	/** (a + b) × Δ */
	actual: number | null;
	/** c × Δ */
	annual: number | null;
};

export const calcPartImpact = (
	row: CppPartRow,
	noChange: boolean,
): PartImpact => {
	const existing = toNum(row.existingRate);
	const finalised = toNum(row.finalRate);
	const delta =
		existing !== null && finalised !== null ? finalised - existing : null;
	if (delta === null) return { delta, pct: null, actual: null, annual: null };
	const actualQty =
		(toNum(row.qtyReceived) ?? 0) + (toNum(row.qtyRemaining) ?? 0);
	const annualQty = toNum(row.qtyAnnual) ?? 0;
	return {
		delta,
		pct: pctChange(row.existingRate, row.finalRate),
		actual: noChange ? 0 : delta * actualQty,
		annual: noChange ? 0 : delta * annualQty,
	};
};

export const calcTotals = (parts: CppPartRow[], noChange: boolean) =>
	parts.reduce(
		(sum, row) => {
			const impact = calcPartImpact(row, noChange);
			const existing = toNum(row.existingRate);
			const qty =
				(toNum(row.qtyReceived) ?? 0) + (toNum(row.qtyRemaining) ?? 0);
			return {
				existingValue:
					sum.existingValue + (existing !== null ? existing * qty : 0),
				actual: sum.actual + (impact.actual ?? 0),
				annual: sum.annual + (impact.annual ?? 0),
			};
		},
		{ existingValue: 0, actual: 0, annual: 0 },
	);

/**
 * Amortisation per unit = price incl. amort − price after amort.
 * Total recovered = per unit × amortised qty.
 */
export const calcAmort = (row: CppAmortRow) => {
	const incl = toNum(row.priceInclAmort);
	const after = toNum(row.priceAfterAmort);
	const qty = toNum(row.amortQty);
	const perUnit = incl !== null && after !== null ? incl - after : null;
	return {
		perUnit,
		total: perUnit !== null && qty !== null ? perUnit * qty : null,
	};
};

/** a + b, or null when both are blank. */
export const actualQty = (row: CppVolumeRow): number | null => {
	const a = toNum(row.received);
	const b = toNum(row.remaining);
	return a === null && b === null ? null : (a ?? 0) + (b ?? 0);
};

/** Sum of the typed plant-split percentages (blank counts as 0). */
export const sumPlantSplit = (split: Record<CppPlant, string>): number =>
	CPP_PLANTS.reduce((sum, plant) => sum + (toNum(split[plant]) ?? 0), 0);
