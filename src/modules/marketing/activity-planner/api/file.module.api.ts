import { ServerAxios } from "../../../../services/ServerAxios";
import {
	mapImportExportResponseToRows,
	unwrapLeadList,
} from "../helpers/fileModule.helper";
import type { FileModuleListingRow } from "../types/fileModule.types";

export const filesApi = {
	getAll: async (): Promise<FileModuleListingRow[]> => {
		const {
			data: { data },
		} = await ServerAxios.post("/import-export-logs/history", {
			type: "LEAD_IMPORT",
		});

		// LEAD_EXPORT
		// EPC_EXPORT
		return mapImportExportResponseToRows(unwrapLeadList(data));
	},
};
