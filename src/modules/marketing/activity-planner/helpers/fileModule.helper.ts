import type { FileModuleListingRow } from "../types/fileModule.types";

const asString = (value: unknown, fallback = "") =>
	typeof value === "string" && value.trim() ? value.trim() : fallback;

export const unwrapLeadList = (response: any): unknown[] => {
	const list = response?.data?.data ?? response?.data ?? [];

	return Array.isArray(list) ? list : [];
};

export const mapImportExportResponseToRows = (
	list: unknown,
): FileModuleListingRow[] => {
	if (!Array.isArray(list)) return [];

	return list
		.map((data: FileModuleListingRow): FileModuleListingRow | null => {
			const id = asString(data?.id);
			if (!id) return null;
			return {
				id,
				epcID: data?.epcID,
				status: asString(data?.status),
				created_at: asString(data?.created_at),
				updated_at: asString(data?.updated_at),
				proposal_number: asString(
					data?.proposal_number ?? data?.proposal_number,
				),
				errorFile: Boolean(data?.errorFileS3Key),
				errorFileS3Key: data?.errorFileS3Key,
			};
		})
		.filter(Boolean) as FileModuleListingRow[];
};
