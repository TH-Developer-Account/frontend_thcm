import { ServerAxios } from "../../../../services/ServerAxios";
import { mapLeadResponseToRows } from "../helpers/lead.mapper";
import type {
  CreateLeadsPayload,
  LeadRow,
  UpdateLeadPayload,
  leadsImportPayload,
  LeadPagination,
  LeadListParams,
  LeadListResult,
  LeadFormConfig,
} from "../types/leads.types";

type LeadListApiResponse = {
  success: boolean;
  data: unknown[];
  pagination: LeadPagination;
};

type LeadFormConfigApiResponse = {
  success: boolean;
  data: LeadFormConfig;
};

const DEFAULT_PAGINATION: LeadPagination = {
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
};

export const leadsApi = {
  getAll: async ({
    page,
    pageSize,
  }: LeadListParams): Promise<LeadListResult> => {
    const response = await ServerAxios.get<LeadListApiResponse>(
      "/leads/get-all-leads",
      { params: { page, pageSize } },
    );

    const responseData = response.data;

    return {
      data: mapLeadResponseToRows(responseData.data ?? []),
      pagination: responseData.pagination ?? {
        ...DEFAULT_PAGINATION,
        page,
        pageSize,
      },
    };
  },

  createMany: async (payload: CreateLeadsPayload) => {
    return ServerAxios.post("/leads/create-leads", payload);
  },

  getByEpcId: async (epcId: string): Promise<LeadRow[]> => {
    if (!epcId) return [];

    try {
      const response = await ServerAxios.get(`/leads/epc/${epcId}`);
      const responseData = response.data as { data?: unknown[] };
      return mapLeadResponseToRows(responseData.data ?? []);
    } catch (error: unknown) {
      const status =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "status" in error.response
          ? error.response.status
          : undefined;

      if (status !== 404) throw error;

      const allLeadsResult = await leadsApi.getAll({ page: 1, pageSize: 1000 });
      return allLeadsResult.data.filter((lead) => lead.epcId === epcId);
    }
  },

  getFormConfig: async (epcId: string): Promise<LeadFormConfig> => {
    const response = await ServerAxios.get<LeadFormConfigApiResponse>(
      `/leads/form-config/${epcId}`,
    );
    return response.data.data;
  },

  updateOne: async (leadId: string, payload: UpdateLeadPayload) => {
    return ServerAxios.put(`/leads/${leadId}`, payload);
  },

  deleteOne: async (leadId: string) => {
    return ServerAxios.delete(`/leads/${leadId}`);
  },

  importLeads: async (payload: leadsImportPayload) => {
    return ServerAxios.post("/import/leads", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
