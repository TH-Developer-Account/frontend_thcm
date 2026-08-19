import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { eventReportApi } from "./eventReport.api";

const REPORT_STALE_TIME = 30 * 1000;
const FORM_CONFIG_STALE_TIME = 10 * 60 * 1000; // derived from event type, effectively static

export const eventReportKeys = {
  all: ["event-report"] as const,
  byEpc: (epcId?: string | null) =>
    [...eventReportKeys.all, "epc", epcId ?? ""] as const,
  formConfig: (epcId?: string | null) =>
    [...eventReportKeys.all, "form-config", epcId ?? ""] as const,
};

export const useEventReportFormConfigQuery = (epcId?: string | null) => {
  return useQuery({
    queryKey: eventReportKeys.formConfig(epcId),
    queryFn: () => eventReportApi.getFormConfig(epcId ?? ""),
    enabled: Boolean(epcId),
    staleTime: FORM_CONFIG_STALE_TIME,
    refetchOnWindowFocus: false,
  });
};

export const useEventReportQuery = (epcId?: string | null) => {
  return useQuery({
    queryKey: eventReportKeys.byEpc(epcId),
    queryFn: () => eventReportApi.getReport(epcId ?? ""),
    enabled: Boolean(epcId),
    staleTime: REPORT_STALE_TIME,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
};
