// forms/EPC/zoneBranchMap.ts
// Zone → Branch mapping for the EPC form, keyed by master-data CODES
// (region_code / branch_code) so it survives id changes between environments.
//
// Source: "Geography" sheet in 20200911-NewMAPDesign.xlsx. Zones match the
// sheet exactly (North 1/2, East 1/2, West 1/2, South 1/2/3, Central) plus the
// two zones that exist only in the app (Exports, Corporate).
//
// Region codes (must match the Region master data exactly):
//   NOR1 NOR2 EAS1 EAS2 WES1 WES2 SO1 SO2 SO3 CEN EXP COR
//
// ASSUMPTIONS — branches that exist in the app but NOT in the sheet
// (each is a one-line change here; confirm with the business):
//   - Durgapur → East 1, Goa → West 1, Salem → South 3, Jabalpur → Central
//   - Plants (JPL, DPL, KPL) and "Others" (OTH) → Corporate
//
// The sheet's Jammu, Dehradun, Varanasi, Kolhapur and Bhopal are "areas" with
// no matching branch in the app, so they are not listed.
//
// A branch whose zone isn't in the master data yet is hidden once any zone is
// selected, and picking it won't set a zone. Add the zone and it works.
//
// Long term the proper fix is a region_id on the Branch table so this lookup
// comes from the API (resolveBranchRegionId in EpcFormFields already prefers a
// backend-supplied region id when present).

export const ZONE_BRANCH_CODES: Readonly<Record<string, readonly string[]>> = {
	// North 1: Delhi, Jammu, Chandigarh, Dehradun, Varanasi, Lucknow
	NOR1: ["DEL", "CHA", "LUC"],
	// North 2: Jaipur, Udaipur
	NOR2: ["JAI", "UDA"],

	// East 1: Kolkata, Bhubaneshwar, Patna, Jamshedpur (+ Durgapur)
	EAS1: ["KOL", "BHU", "PAT", "JAM", "DUR"],
	// East 2: Guwahati
	EAS2: ["GUW"],

	// West 1: Mumbai, Aurangabad, Pune, Kolhapur (+ Goa)
	WES1: ["MUM", "AUR", "PUN", "GOA"],
	// West 2: Ahmedabad, Rajkot
	WES2: ["AHM", "RAJ"],

	// South 1: Bangalore, Hubli, Kochi
	SO1: ["BAN", "HUB", "COC"],
	// South 2: Hyderabad, Nellore, Vijaywada
	SO2: ["HYD", "NEL", "VIJ"],
	// South 3: Chennai, Madurai (+ Salem)
	SO3: ["CHE", "MAD", "SAL"],

	// Central: Nagpur, Raipur, Bhopal, Indore (+ Jabalpur)
	CEN: ["NAG", "RAI", "IND", "JAB"],

	EXP: ["NEP", "BHT", "BDH", "SRL", "AFR"],

	COR: ["COR", "JPL", "DPL", "KPL", "OTH"],
};

// ── Budget ⇄ Zone ───────────────────────────────────────────────────────────
// Zone budgets are identified by their DESCRIPTION (BudgetMaster.id_desc), which
// is unique, rather than their code (the seed data reuses U33406380105 for two
// different budgets). Budgets not listed here (KA/Mining Customer Engagement,
// Retainers, Digital Marketing, …) are head-office budgets: selectable for any
// zone and they do not change the zone.
//
//   Budget description              → Zone code
//   North 1 … West 2                → NOR1 … WES2   (P1SM?….380105 codes)
//   Export Market Promotion         → EXP   (assumption — confirm)
//   Corporate Communications        → COR   (assumption — confirm)
export const ZONE_BUDGET_DESCRIPTIONS: Readonly<Record<string, string>> = {
	"North 1": "NOR1",
	"North 2": "NOR2",
	"East 1": "EAS1",
	"East 2": "EAS2",
	"West 1": "WES1",
	"West 2": "WES2",
	"South 1": "SO1",
	"South 2": "SO2",
	"South 3": "SO3",
	Central: "CEN",
	"Export Market Promotion": "EXP",
	"Corporate Communications": "COR",
};

const normaliseText = (text?: string | null) =>
	String(text ?? "")
		.trim()
		.replace(/\s+/g, " ")
		.toLowerCase();

const BUDGET_TO_ZONE: Readonly<Record<string, string>> = Object.entries(
	ZONE_BUDGET_DESCRIPTIONS,
).reduce<Record<string, string>>((acc, [description, zoneCode]) => {
	acc[normaliseText(description)] = zoneCode;
	return acc;
}, {});

/** Zone code a budget belongs to, or null for a head-office / general budget. */
export const getZoneCodeForBudget = (description?: string | null) =>
	BUDGET_TO_ZONE[normaliseText(description)] ?? null;

const normalise = (code?: string | null) =>
	String(code ?? "")
		.trim()
		.toUpperCase();

const BRANCH_TO_ZONE: Readonly<Record<string, string>> = Object.entries(
	ZONE_BRANCH_CODES,
).reduce<Record<string, string>>((acc, [zoneCode, branchCodes]) => {
	branchCodes.forEach((branchCode) => {
		acc[normalise(branchCode)] = zoneCode;
	});
	return acc;
}, {});

/** Zone code a branch belongs to, or null if the branch isn't mapped. */
export const getZoneCodeForBranch = (branchCode?: string | null) =>
	BRANCH_TO_ZONE[normalise(branchCode)] ?? null;

/** Branch codes that belong to a zone (empty if the zone isn't mapped). */
export const getBranchCodesForZone = (zoneCode?: string | null) =>
	ZONE_BRANCH_CODES[normalise(zoneCode)] ?? [];
