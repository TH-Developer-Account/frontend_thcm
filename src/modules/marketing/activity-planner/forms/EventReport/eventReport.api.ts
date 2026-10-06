import { ServerAxios } from "../../../../../services/ServerAxios";
import type {
  EventReportDetail,
  EventReportFormConfig,
  ResubmitReportPayload,
  SubmitReportPayload,
  ReportListingParams,
  ReportListingResult,
  ReportListingRow,
  ReportListingPagination,
} from "./eventReport.types";

type ApiEnvelope<T> = { success: boolean; data: T };

const buildSubmitFormData = (payload: SubmitReportPayload): FormData => {
  const formData = new FormData();
  payload.images.forEach((file) => formData.append("images", file));
  formData.append("captions", JSON.stringify(payload.captions));
  if (payload.eventHighlights?.trim()) {
    formData.append("eventHighlights", payload.eventHighlights.trim());
  }
  return formData;
};

const buildResubmitFormData = (payload: ResubmitReportPayload): FormData => {
  const formData = new FormData();
  payload.images.forEach((file) => formData.append("images", file));
  if (payload.images.length > 0) {
    formData.append("positions", JSON.stringify(payload.positions));
    formData.append("captions", JSON.stringify(payload.captions));
  }
  if (payload.eventHighlights !== undefined) {
    formData.append("eventHighlights", payload.eventHighlights.trim());
  }
  return formData;
};

export const eventReportApi = {
  getFormConfig: async (epcId: string): Promise<EventReportFormConfig> => {
    const response = await ServerAxios.get<ApiEnvelope<EventReportFormConfig>>(
      `/report/form-config/${epcId}`,
    );
    return response.data.data;
  },

  getReport: async (epcId: string): Promise<EventReportDetail | null> => {
    try {
      const response = await ServerAxios.get<ApiEnvelope<EventReportDetail>>(
        `/report/${epcId}`,
      );
      return response.data.data;
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

      // No report created yet is a normal, expected state — not an error
      // the caller should have to catch.
      if (status === 404) return null;
      throw error;
    }
  },

  submit: async (payload: SubmitReportPayload) => {
    return ServerAxios.post(
      `/report/${payload.epcId}/submit`,
      buildSubmitFormData(payload),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  // Covers both the clarification-resubmit and the generation-retry cases —
  // for a plain retry, call with images: [] and positions: [] (no eventHighlights change).
  resubmit: async (payload: ResubmitReportPayload) => {
    return ServerAxios.patch(
      `/report/${payload.epcId}/resubmit`,
      buildResubmitFormData(payload),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  getListing: async (
    params: ReportListingParams,
  ): Promise<ReportListingResult> => {
    const response = await ServerAxios.get<
      ApiEnvelope<ReportListingRow[]> & {
        pagination: ReportListingPagination;
      }
    >("/report/listing", { params });

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },
};
