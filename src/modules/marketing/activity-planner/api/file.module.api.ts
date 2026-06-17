import { ServerAxios } from "../../../../services/ServerAxios";
import type { FileModuleListingRow } from "../components/fileModule/fileModule.types";

export const filesApi = {
	getAll: async (): Promise<FileModuleListingRow[]> => {
		const {
			data: { data },
		} = await ServerAxios.post("/leads/import/history");
		return data;
	},
};
