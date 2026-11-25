import type {
	BudgetMasterOption,
	ManageMasterPayload,
	MasterDataResponse,
	MasterItem,
	MasterName,
	MasterOption,
} from "./masterData.types";
import { MASTER_KEYS, MASTER_TYPES } from "./master.data.constant";

const clean = (value?: string) => value?.trim() || undefined;

// "" / null / undefined / non-numeric -> undefined, otherwise the number.
const toNumber = (value: unknown): number | undefined => {
	if (value === undefined || value === null) return undefined;
	if (String(value).trim() === "") return undefined;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

// Annual cap must be a non-negative number.
export const isValidAnnualCap = (value: unknown): boolean => {
	const parsed = toNumber(value);
	return parsed !== undefined && parsed >= 0;
};

const buildMasterData = (
	masterName: MasterName,
	item: MasterItem,
): ManageMasterPayload["data"] => {
	const name = clean(item.name);
	const code = clean(item.code);
	const description = clean(item.description);
	const fiscalYear = clean(item.fiscalYear);

	switch (masterName) {
		case "Branches":
		case "Departments":
			return {
				...(name && { name }),
				...(code && { code }),
			};

		case "Event Names":
			return {
				...(name && { name }),
			};

		case "Budget": {
			const amount =
				item.budgetAmount !== undefined &&
				item.budgetAmount !== null &&
				String(item.budgetAmount).trim() !== ""
					? Number(item.budgetAmount)
					: undefined;

			return {
				...(code && { code }),
				...(fiscalYear && { fiscal_year: fiscalYear }),
				...(description && { id_desc: description }),
				...(amount !== undefined &&
					Number.isFinite(amount) && { value: amount }),
			};
		}

		// Division/Designation: free-text name only.
		case "Divisions":
		case "Designations":
			return {
				...(name && { name }),
			};

		// Cost Center/Zone: both have a real required code alongside the
		// name (Cost Center: EOR's numeric code; Zone: region_code, unique
		// and required on the Zone model) — same shape as Branches/
		// Departments above.
		case "Cost Centers":
		case "Zones":
			return {
				...(code && { code }),
				...(name && { name }),
			};

		// Grade Eligibility: only the annual cap is editable. The grade itself
		// is never sent, so it can't be changed by accident.
		case "Grade Eligibility": {
			const annualCap = toNumber(item.annualCap);

			return {
				...(annualCap !== undefined && annualCap >= 0 && { annualCap }),
			};
		}
	}
};

export const buildCreateMasterPayload = (
	masterName: MasterName,
	item: MasterItem,
): ManageMasterPayload => ({
	type: MASTER_TYPES[masterName],
	action: "create",
	data: buildMasterData(masterName, item),
});

export const buildUpdateMasterPayload = (
	masterName: MasterName,
	item: MasterItem,
): ManageMasterPayload => ({
	type: MASTER_TYPES[masterName],
	action: "update",
	data: {
		id: item.id,
		...buildMasterData(masterName, item),
	},
});

const isBudgetMasterOption = (item: MasterOption): item is BudgetMasterOption =>
	"budgetAmount" in item || "fiscalYear" in item;

export const mapMasterItem = (item: MasterOption): MasterItem => ({
	id: String(item.value),
	name: clean(item.label),
	code: clean(item.code),
	description: clean(item.description) ?? clean(item.id_desc),
	budgetAmount: isBudgetMasterOption(item) ? item.budgetAmount : undefined,
	fiscalYear: isBudgetMasterOption(item) ? clean(item.fiscalYear) : undefined,
	annualCap: item.annualCap,
});

export const getMasterItems = (
	data: MasterDataResponse | undefined,
	masterName: MasterName,
): MasterItem[] => {
	if (!data) return [];

	const collection = data[MASTER_KEYS[masterName]];
	return Array.isArray(collection)
		? collection.map((item) => mapMasterItem(item))
		: [];
};

export const getMasterCounts = (
	data: MasterDataResponse | undefined,
): Partial<Record<MasterName, number>> => {
	if (!data) return {};

	return Object.fromEntries(
		(Object.keys(MASTER_KEYS) as MasterName[]).map((masterName) => [
			masterName,
			data[MASTER_KEYS[masterName]]?.length ?? 0,
		]),
	) as Record<MasterName, number>;
};
