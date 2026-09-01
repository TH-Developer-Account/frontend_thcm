import type {
	FileModuleApiItem,
	FileModuleListingRow,
	FileModuleEventGroupRow,
	FileModuleTriggeredBy,
} from "../types/fileModule.types";

const asString = (value: unknown, fallback = ""): string => {
	if (typeof value !== "string") return fallback;

	const normalizedValue = value.trim();
	return normalizedValue || fallback;
};

const asNumber = (value: unknown, fallback = 0): number => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim()) {
		const parsedValue = Number(value);

		if (Number.isFinite(parsedValue)) {
			return parsedValue;
		}
	}

	return fallback;
};

const asBoolean = (value: unknown): boolean => {
	if (typeof value === "boolean") return value;
	if (value === 1 || value === "1" || value === "true") return true;

	return false;
};

export const unwrapFileModuleList = (response: unknown): unknown[] => {
	if (Array.isArray(response)) {
		return response;
	}

	if (!response || typeof response !== "object") {
		return [];
	}

	const responseRecord = response as Record<string, unknown>;
	const firstLevelData = responseRecord.data;

	if (Array.isArray(firstLevelData)) {
		return firstLevelData;
	}

	if (firstLevelData && typeof firstLevelData === "object") {
		const nestedData = (firstLevelData as Record<string, unknown>).data;

		if (Array.isArray(nestedData)) {
			return nestedData;
		}
	}

	return [];
};

const mapTriggeredBy = (
	triggeredBy: FileModuleApiItem["triggeredBy"],
): FileModuleListingRow["triggeredBy"] => {
	if (!triggeredBy) return null;

	const id = asString(triggeredBy.id);
	const firstName = asString(triggeredBy.first_name);
	const lastName = asString(triggeredBy.last_name);
	const email = asString(triggeredBy.email);
	const fullName = `${firstName} ${lastName}`.trim();

	if (!id && !firstName && !lastName && !email) {
		return null;
	}

	return {
		id,
		firstName,
		lastName,
		fullName: fullName || email || "Unknown user",
		email,
	};
};

const mapEpc = (epc: FileModuleApiItem["epc"]): FileModuleListingRow["epc"] => {
	if (!epc) return null;

	const id = asString(epc.id);
	const proposalNumber = asString(epc.proposal_number);

	if (!id && !proposalNumber) {
		return null;
	}

	return {
		id,
		proposalNumber,
	};
};

export const mapImportExportResponseToRows = (
	response: unknown,
): FileModuleListingRow[] => {
	const list = unwrapFileModuleList(response);

	return list.reduce<FileModuleListingRow[]>((rows, item) => {
		if (!item || typeof item !== "object") {
			return rows;
		}

		const data = item as FileModuleApiItem;
		const id = asString(data.id);

		if (!id) {
			return rows;
		}

		rows.push({
			id,
			type: asString(data.type, "UNKNOWN"),
			status: asString(data.status, "UNKNOWN"),

			totalRecords: asNumber(data.totalRecords),
			successRecords: asNumber(data.successRecords),
			failedRecords: asNumber(data.failedRecords),

			hasOutputFile: asBoolean(data.hasOutputFile),
			hasErrorFile: asBoolean(data.hasErrorFile),

			createdAt: asString(data.createdAt),

			triggeredBy: mapTriggeredBy(data.triggeredBy),
			epc: mapEpc(data.epc),
		});

		return rows;
	}, []);
};

const UNASSIGNED_EVENT_KEY = "unassigned-event";

const getTimestamp = (value: string): number => {
	const timestamp = Date.parse(value);

	return Number.isFinite(timestamp) ? timestamp : 0;
};

const getUniqueUsers = (
	rows: FileModuleListingRow[],
): FileModuleTriggeredBy[] => {
	const users = new Map<string, FileModuleTriggeredBy>();

	for (const row of rows) {
		const user = row.triggeredBy;

		if (!user) continue;

		const key = user.id || user.email || user.fullName;

		if (!users.has(key)) {
			users.set(key, user);
		}
	}

	return Array.from(users.values());
};

export const groupFileRowsByEvent = (
	rows: FileModuleListingRow[],
): FileModuleEventGroupRow[] => {
	const groups = new Map<string, FileModuleListingRow[]>();

	for (const row of rows) {
		const groupKey = row.epc?.id || UNASSIGNED_EVENT_KEY;
		const currentRows = groups.get(groupKey) ?? [];

		currentRows.push(row);
		groups.set(groupKey, currentRows);
	}

	return Array.from(groups.entries())
		.map(([groupKey, groupRows]) => {
			const sortedLogs = [...groupRows].sort(
				(first, second) =>
					getTimestamp(second.createdAt) - getTimestamp(first.createdAt),
			);

			const latestLog = sortedLogs[0];

			return {
				id: groupKey,
				epc: latestLog?.epc ?? null,

				operationCount: groupRows.length,
				operationTypes: Array.from(new Set(groupRows.map((row) => row.type))),

				totalRecords: groupRows.reduce(
					(total, row) => total + row.totalRecords,
					0,
				),

				successRecords: groupRows.reduce(
					(total, row) => total + row.successRecords,
					0,
				),

				failedRecords: groupRows.reduce(
					(total, row) => total + row.failedRecords,
					0,
				),

				outputFileCount: groupRows.filter((row) => row.hasOutputFile).length,

				errorFileCount: groupRows.filter((row) => row.hasErrorFile).length,

				latestStatus: latestLog?.status ?? "UNKNOWN",
				latestCreatedAt: latestLog?.createdAt ?? "",

				triggeredBy: getUniqueUsers(groupRows),
				logs: sortedLogs,
			};
		})
		.sort(
			(first, second) =>
				getTimestamp(second.latestCreatedAt) -
				getTimestamp(first.latestCreatedAt),
		);
};
