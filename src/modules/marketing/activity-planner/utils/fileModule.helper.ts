// utils/fileModule.ts

import type {
	FileModuleApiItem,
	FileModuleEventGroupRow,
	FileModuleListingRow,
	FileModuleTriggeredBy,
} from "../types/epc.types";
import { asBoolean, asString, toNumber, toTimestamp } from "./common";

const UNASSIGNED_EVENT_KEY = "unassigned-event";

type RecordCountKey = "totalRecords" | "successRecords" | "failedRecords";
type FileFlagKey = "hasOutputFile" | "hasErrorFile";

const sumBy = (rows: FileModuleListingRow[], key: RecordCountKey) =>
	rows.reduce((total, row) => total + row[key], 0);

const countBy = (rows: FileModuleListingRow[], key: FileFlagKey) =>
	rows.filter((row) => row[key]).length;

const byNewest =
	<T>(getDate: (item: T) => string) =>
	(a: T, b: T) =>
		toTimestamp(getDate(b)) - toTimestamp(getDate(a));

// ─── API → rows ───────────────────────────────────────────────────────────────

/** Accepts `[]`, `{ data: [] }` or `{ data: { data: [] } }`. */
export const unwrapFileModuleList = (response: unknown): unknown[] => {
	if (Array.isArray(response)) return response;

	const data = (response as { data?: unknown } | null | undefined)?.data;
	if (Array.isArray(data)) return data;

	const nested = (data as { data?: unknown } | null | undefined)?.data;
	return Array.isArray(nested) ? nested : [];
};

const mapTriggeredBy = (
	triggeredBy: FileModuleApiItem["triggeredBy"],
): FileModuleListingRow["triggeredBy"] => {
	if (!triggeredBy) return null;

	const id = asString(triggeredBy.id);
	const firstName = asString(triggeredBy.first_name);
	const lastName = asString(triggeredBy.last_name);
	const email = asString(triggeredBy.email);

	if (!id && !firstName && !lastName && !email) return null;

	return {
		id,
		firstName,
		lastName,
		fullName: `${firstName} ${lastName}`.trim() || email || "Unknown user",
		email,
	};
};

const mapEpc = (epc: FileModuleApiItem["epc"]): FileModuleListingRow["epc"] => {
	if (!epc) return null;

	const id = asString(epc.id);
	const proposalNumber = asString(epc.proposal_number);

	return id || proposalNumber ? { id, proposalNumber } : null;
};

export const mapImportExportResponseToRows = (
	response: unknown,
): FileModuleListingRow[] =>
	unwrapFileModuleList(response).flatMap((item): FileModuleListingRow[] => {
		if (!item || typeof item !== "object") return [];

		const data = item as FileModuleApiItem;
		const id = asString(data.id);
		if (!id) return [];

		return [
			{
				id,
				type: asString(data.type, "UNKNOWN"),
				status: asString(data.status, "UNKNOWN"),
				totalRecords: toNumber(data.totalRecords),
				successRecords: toNumber(data.successRecords),
				failedRecords: toNumber(data.failedRecords),
				hasOutputFile: asBoolean(data.hasOutputFile),
				hasErrorFile: asBoolean(data.hasErrorFile),
				createdAt: asString(data.createdAt),
				triggeredBy: mapTriggeredBy(data.triggeredBy),
				epc: mapEpc(data.epc),
			},
		];
	});

// ─── Grouping ─────────────────────────────────────────────────────────────────

const getUniqueUsers = (
	rows: FileModuleListingRow[],
): FileModuleTriggeredBy[] => {
	const users = new Map<string, FileModuleTriggeredBy>();

	for (const { triggeredBy: user } of rows) {
		if (!user) continue;
		const key = user.id || user.email || user.fullName;
		if (!users.has(key)) users.set(key, user);
	}

	return Array.from(users.values());
};

export const groupFileRowsByEvent = (
	rows: FileModuleListingRow[],
): FileModuleEventGroupRow[] => {
	const groups = new Map<string, FileModuleListingRow[]>();

	for (const row of rows) {
		const key = row.epc?.id || UNASSIGNED_EVENT_KEY;
		groups.set(key, [...(groups.get(key) ?? []), row]);
	}

	return Array.from(groups, ([id, groupRows]) => {
		const logs = [...groupRows].sort(
			byNewest<FileModuleListingRow>((row) => row.createdAt),
		);
		const latestLog = logs[0];

		return {
			id,
			epc: latestLog?.epc ?? null,
			operationCount: groupRows.length,
			operationTypes: Array.from(new Set(groupRows.map((row) => row.type))),
			totalRecords: sumBy(groupRows, "totalRecords"),
			successRecords: sumBy(groupRows, "successRecords"),
			failedRecords: sumBy(groupRows, "failedRecords"),
			outputFileCount: countBy(groupRows, "hasOutputFile"),
			errorFileCount: countBy(groupRows, "hasErrorFile"),
			latestStatus: latestLog?.status ?? "UNKNOWN",
			latestCreatedAt: latestLog?.createdAt ?? "",
			triggeredBy: getUniqueUsers(groupRows),
			logs,
		};
	}).sort(byNewest<FileModuleEventGroupRow>((group) => group.latestCreatedAt));
};
