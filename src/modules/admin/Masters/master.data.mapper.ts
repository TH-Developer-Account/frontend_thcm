import type {
	MasterDataResponse,
	MasterItem,
	MasterName,
	ManageMasterPayload,
	MasterOption,
	MasterStatus,
} from "./masterData.types";
import { MASTER_KEYS, MASTER_TYPES } from "./master.data.constant";

export const buildCreateMasterPayload = (
	masterName: MasterName,
	item: MasterItem,
): ManageMasterPayload => {
	const type = MASTER_TYPES[masterName];

	return {
		type,
		action: "create",
		data: {
			id_desc: item.description.trim(),
			status: item.status,
		},
	};
};

export const buildUpdateMasterPayload = (
	masterName: MasterName,
	item: MasterItem,
): ManageMasterPayload => {
	const type = MASTER_TYPES[masterName];

	return {
		type,
		action: "update",
		data: {
			id: item.id,
			id_desc: item.description.trim(),
			status: item.status,
		},
	};
};

const normalizeStatus = (status?: string): MasterStatus =>
	status?.toLowerCase() === "inactive" ? "inactive" : "active";

const getDescription = (item: MasterOption): string =>
	item.description?.trim() ||
	item.id_desc?.trim() ||
	item.label?.trim() ||
	item.name?.trim() ||
	"";

export const mapMasterItem = (item: MasterOption): MasterItem => ({
	id: String(item.value ?? ""),
	description: getDescription(item),
	status: normalizeStatus(item.status),
});

export const getMasterItems = (
	data: MasterDataResponse | undefined,
	masterName: MasterName,
): MasterItem[] => {
	if (!data) return [];

	const key = MASTER_KEYS[masterName];

	const collection = data[key];

	if (!Array.isArray(collection)) {
		return [];
	}

	return collection.map((item) => mapMasterItem(item));
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
