import { useMutation, useQueryClient } from "@tanstack/react-query";
import { machineStudyApi } from "./machineStudy.api";
import { machineStudyKeys } from "./useMachineStudyQueries";
import type { MachineStudyHeaderPayload } from "./machineStudy.types";

export const useCreateMachineStudyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MachineStudyHeaderPayload) =>
      machineStudyApi.create(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: machineStudyKeys.byEpc(variables.epcId),
      });
    },
  });
};

export const useUpdateMachineStudyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<MachineStudyHeaderPayload>;
    }) => machineStudyApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: machineStudyKeys.byId(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: machineStudyKeys.byEpc(data.epcId),
      });
    },
  });
};

export const useUploadMachineStudyCyclesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      machineStudyApi.uploadCycles(id, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: machineStudyKeys.byId(variables.id),
      });
    },
  });
};
