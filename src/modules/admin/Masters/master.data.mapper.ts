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
		case "Regions":
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
