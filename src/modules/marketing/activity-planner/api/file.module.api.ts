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
		} = await ServerAxios.post("/import-export-logs/leads/import/history");
		return mapImportExportResponseToRows(unwrapLeadList(data));
	},
};
