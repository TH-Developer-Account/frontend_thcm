import { ServerAxios } from "../../../services/ServerAxios";
import type {
  MachineStudy,
  MachineStudyHeaderPayload,
  MachineStudyWithCycles,
  CycleImportResult,
} from "./machineStudy.types";

type ApiEnvelope<T> = { success: boolean; data: T };

export const machineStudyApi = {
  create: async (payload: MachineStudyHeaderPayload): Promise<MachineStudy> => {
    const response = await ServerAxios.post<ApiEnvelope<MachineStudy>>(
      "/machine-studies",
      payload,
    );
    return response.data.data;
  },

  update: async (
    id: string,
    payload: Partial<MachineStudyHeaderPayload>,
  ): Promise<MachineStudy> => {
    const response = await ServerAxios.patch<ApiEnvelope<MachineStudy>>(
      `/machine-studies/${id}`,
      payload,
    );
    return response.data.data;
  },

  getByEpc: async (epcId: string): Promise<MachineStudy[]> => {
    const response = await ServerAxios.get<ApiEnvelope<MachineStudy[]>>(
      `/machine-studies/epc/${epcId}`,
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<MachineStudyWithCycles> => {
    const response = await ServerAxios.get<ApiEnvelope<MachineStudyWithCycles>>(
      `/machine-studies/${id}`,
    );
    return response.data.data;
  },

  uploadCycles: async (id: string, file: File): Promise<CycleImportResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await ServerAxios.post<ApiEnvelope<CycleImportResult>>(
      `/machine-studies/${id}/cycles`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },
};
