import { ServerAxios } from "../../../../services/ServerAxios";
import { mapImportExportResponseToRows } from "../helpers/fileModule.helper";
import type { FileModuleListingRow } from "../types/fileModule.types";

type DownloadResponseRecord = {
  success?: unknown;
  url?: unknown;
  downloadUrl?: unknown;
  fileUrl?: unknown;
  data?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getStringValue = (
  record: Record<string, unknown>,
  keys: string[],
): string | null => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

/**
 * Supports common backend response shapes:
 *
 * { success: true, url: "..." }
 * { url: "..." }
 * { downloadUrl: "..." }
 * { fileUrl: "..." }
 * { data: { success: true, url: "..." } }
 * { data: { data: { url: "..." } } }
 */
const resolveDownloadUrl = (payload: unknown): string => {
  let current: unknown = payload;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!isRecord(current)) break;

    const record = current as DownloadResponseRecord & Record<string, unknown>;

    const url = getStringValue(record, [
      "url",
      "downloadUrl",
      "fileUrl",
      "signedUrl",
      "presignedUrl",
    ]);

    if (url) {
      return url;
    }

    current = record.data;
  }

  throw new Error("The server did not return a valid download URL.");
};

export const filesApi = {
  getAll: async (): Promise<FileModuleListingRow[]> => {
    const response = await ServerAxios.post("/import-export-logs/history", {
      type: "LEAD_IMPORT",
    });

    return mapImportExportResponseToRows(response.data);
  },

  getOutputFileUrl: async (logId: string): Promise<string> => {
    if (!logId.trim()) {
      throw new Error("A valid import/export log ID is required.");
    }

    const response = await ServerAxios.post(
      `/import-export-logs/${encodeURIComponent(logId)}/file`,
    );

    return resolveDownloadUrl(response.data);
  },

  getErrorFileUrl: async (logId: string): Promise<string> => {
    if (!logId.trim()) {
      throw new Error("A valid import/export log ID is required.");
    }

    const response = await ServerAxios.post(
      `/import-export-logs/${encodeURIComponent(logId)}/errors`,
    );

    return resolveDownloadUrl(response.data);
  },
};
/*
      LEAD_EXPORT
		  EPC_EXPORT
		 */
