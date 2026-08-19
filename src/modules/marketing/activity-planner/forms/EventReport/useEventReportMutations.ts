import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventReportApi } from "./eventReport.api";
import { eventReportKeys } from "./useEventReportQueries";
import type {
  ResubmitReportPayload,
  SubmitReportPayload,
} from "./eventReport.types";

export const useSubmitReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitReportPayload) =>
      eventReportApi.submit(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: eventReportKeys.byEpc(variables.epcId),
      });
    },
  });
};

export const useResubmitReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ResubmitReportPayload) =>
      eventReportApi.resubmit(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: eventReportKeys.byEpc(variables.epcId),
      });
    },
  });
};
