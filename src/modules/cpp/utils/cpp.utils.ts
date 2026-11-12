// utils/cpp.utils.ts — constants, defaults and calculations for the CPP form.
import type {
	CppAmortRow,
	CppFormValues,
	CppPartRow,
	CppPlant,
	CppSupplier,
	CppTabKey,
} from "../types/cpp.types";

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

// From "Attachments Required" in the CPP format (THX11-D07-F02).
export const CPP_ATTACHMENTS = [
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
] as const;

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
export const TAX_CODES = ["GST 5%", "GST 12%", "GST 18%", "GST 28%"];
export const YES_NO = ["Yes", "No"];
export const UOM_OPTIONS = ["NOS", "KG", "MTR", "SET", "LTR"];

export const MIN_JUSTIFICATION = 50;

export const CPP_TABS: { value: CppTabKey; label: string }[] = [
	{ value: "purchasing", label: "Purchasing Details" },
	{ value: "financial", label: "Financial Impact" },
	{ value: "amortisation", label: "Amortisation" },
	{ value: "tracker", label: "Material Cost Tracker" },
	{ value: "master", label: "Master Data" },
	{ value: "other", label: "Other Data" },
	{ value: "workflow", label: "Workflow" },
];

// Material Cost Tracker is built disabled behind this flag.
export const MATERIAL_COST_TRACKER_ENABLED = false;

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
	amount: "",
	qty: "",
	perMachineQty: "",
});

const todayISO = () => new Date().toISOString().slice(0, 10);

export const getDefaultValues = (): CppFormValues => ({
	materialType: "",
	reason: "",
	effects: [],
	aribaRef: "",
	initiationDate: todayISO(),
	suppliers: {
		existing: emptySupplier(),
		other: emptySupplier(),
		recommended: emptySupplier(),
	},
	parts: [emptyPart()],
	amortisation: [emptyAmort()],
	other: {
		remarks: "",
		attachments: Object.fromEntries(CPP_ATTACHMENTS.map((a) => [a.key, false])),
	},
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
	},
	financial: { noChange: false, plantSplit: { DWD: "", KGP: "", SPARE: "" } },
	workflow: {
		models: [],
		plants: [],
		pricingCondition: "",
		spares: false,
		authority: "",
	},
	justification: "",
});

/* ---------------------------- calculations ----------------------------- */

export const toNum = (value: string | undefined | null): number | null => {
	const parsed = parseFloat(String(value ?? "").replace(/,/g, ""));
	return Number.isNaN(parsed) ? null : parsed;
};

export const formatINR = (value: number | null): string =>
	value === null
		? "—"
		: `₹ ${value.toLocaleString("en-IN", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}`;

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

export const calcAmort = (row: CppAmortRow) => {
	const amount = toNum(row.amount);
	const qty = toNum(row.qty);
	const perMachine = toNum(row.perMachineQty);
	const perUnit = amount !== null && qty ? amount / qty : null;
	return {
		perUnit,
		perMachine:
			perUnit !== null && perMachine !== null ? perUnit * perMachine : null,
	};
};

/** Sum of the typed plant-split percentages (blank counts as 0). */
export const sumPlantSplit = (split: Record<CppPlant, string>): number =>
	CPP_PLANTS.reduce((sum, plant) => sum + (toNum(split[plant]) ?? 0), 0);
