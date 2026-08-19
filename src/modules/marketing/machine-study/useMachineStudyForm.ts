import React from "react";
import {
  useCreateMachineStudyMutation,
  useUpdateMachineStudyMutation,
} from "./useMachineStudyMutation";
import type {
  FuelType,
  MachineStudy,
  MachineStudyHeaderPayload,
} from "./machineStudy.types";

export type MachineStudyFormState = {
  machineModel: string;
  customerName: string;
  startDate: string;
  endDate: string;
  application: string;
  fuelType: FuelType | "";
  startHmr: string;
  endHmr: string;
  bucketVolumeCuM: string;
  acStatus: string;
  operationMode: string;
  dieselTopUpLtr: string;
  startKwhReading: string;
  endKwhReading: string;
  operatorName: string;
  operatorExperience: string;
  priorMachinesOperated: string;
};

const emptyFormState: MachineStudyFormState = {
  machineModel: "",
  customerName: "",
  startDate: "",
  endDate: "",
  application: "",
  fuelType: "",
  startHmr: "",
  endHmr: "",
  bucketVolumeCuM: "",
  acStatus: "",
  operationMode: "",
  dieselTopUpLtr: "",
  startKwhReading: "",
  endKwhReading: "",
  operatorName: "",
  operatorExperience: "",
  priorMachinesOperated: "",
};

const buildFormStateFromStudy = (
  study: MachineStudy | undefined,
): MachineStudyFormState => {
  if (!study) return emptyFormState;
  return {
    machineModel: study.machineModel,
    customerName: study.customerName,
    startDate: study.startDate.slice(0, 10),
    endDate: study.endDate.slice(0, 10),
    application: study.application,
    fuelType: study.fuelType,
    startHmr: String(study.startHmr),
    endHmr: String(study.endHmr),
    bucketVolumeCuM: String(study.bucketVolumeCuM),
    acStatus: study.acStatus,
    operationMode: study.operationMode,
    dieselTopUpLtr:
      study.dieselTopUpLtr != null ? String(study.dieselTopUpLtr) : "",
    startKwhReading:
      study.startKwhReading != null ? String(study.startKwhReading) : "",
    endKwhReading:
      study.endKwhReading != null ? String(study.endKwhReading) : "",
    operatorName: study.operatorName ?? "",
    operatorExperience: study.operatorExperience ?? "",
    priorMachinesOperated: study.priorMachinesOperated ?? "",
  };
};

type UseMachineStudyFormArgs = {
  epcId: string;
  isCompetitorMachine: boolean;
  existingStudy: MachineStudy | undefined;
};

export function useMachineStudyForm({
  epcId,
  isCompetitorMachine,
  existingStudy,
}: UseMachineStudyFormArgs) {
  const [form, setForm] = React.useState<MachineStudyFormState>(() =>
    buildFormStateFromStudy(existingStudy),
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setForm(buildFormStateFromStudy(existingStudy));
  }, [existingStudy]);

  const createMutation = useCreateMachineStudyMutation();
  const updateMutation = useUpdateMachineStudyMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleChange = React.useCallback(
    <K extends keyof MachineStudyFormState>(
      field: K,
      value: MachineStudyFormState[K],
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setError(null);
    },
    [],
  );

  const validate = React.useCallback((): string | null => {
    const required: (keyof MachineStudyFormState)[] = [
      "machineModel",
      "customerName",
      "startDate",
      "endDate",
      "application",
      "fuelType",
      "startHmr",
      "endHmr",
      "bucketVolumeCuM",
      "acStatus",
      "operationMode",
    ];
    const missing = required.filter((field) => !form[field]);
    if (missing.length > 0) return "Please fill in all required fields.";

    if (form.fuelType === "DIESEL" && !form.dieselTopUpLtr) {
      return "Diesel Filled (Top-up) is required for diesel-powered machines.";
    }
    if (
      form.fuelType === "ELECTRIC" &&
      (!form.startKwhReading || !form.endKwhReading)
    ) {
      return "Start and End kWh readings are required for electric machines.";
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      return "End date cannot be before start date.";
    }
    return null;
  }, [form]);

  const buildPayload = React.useCallback(
    (): MachineStudyHeaderPayload => ({
      epcId,
      isCompetitorMachine,
      machineModel: form.machineModel.trim(),
      customerName: form.customerName.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      application: form.application.trim(),
      fuelType: form.fuelType as FuelType,
      startHmr: Number(form.startHmr),
      endHmr: Number(form.endHmr),
      bucketVolumeCuM: Number(form.bucketVolumeCuM),
      acStatus: form.acStatus.trim(),
      operationMode: form.operationMode.trim(),
      dieselTopUpLtr: form.dieselTopUpLtr
        ? Number(form.dieselTopUpLtr)
        : undefined,
      startKwhReading: form.startKwhReading
        ? Number(form.startKwhReading)
        : undefined,
      endKwhReading: form.endKwhReading
        ? Number(form.endKwhReading)
        : undefined,
      operatorName: form.operatorName.trim() || undefined,
      operatorExperience: form.operatorExperience.trim() || undefined,
      priorMachinesOperated: form.priorMachinesOperated.trim() || undefined,
    }),
    [epcId, isCompetitorMachine, form],
  );

  const handleSave = React.useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const payload = buildPayload();
      if (existingStudy) {
        await updateMutation.mutateAsync({ id: existingStudy.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setError(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save machine study.",
      );
    }
  }, [buildPayload, createMutation, existingStudy, updateMutation, validate]);

  return {
    form,
    handleChange,
    error,
    isSaving,
    handleSave,
    isExisting: Boolean(existingStudy),
  };
}
