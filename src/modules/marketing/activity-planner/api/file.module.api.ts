import { ServerAxios } from "../../../../services/ServerAxios";
import type { FileModuleListingRow } from "../components/fileModule/fileModule.types";

export const filesApi = {
  getAll: async (): Promise<FileModuleListingRow[]> => {
    const {
      data: { data },
    } = await ServerAxios.post("/import-export-logs/history", {
      type: "LEAD_IMPORT",
    });

    // LEAD_EXPORT
    // EPC_EXPORT
    return data;
  },
};
