export type FuelType = "DIESEL" | "ELECTRIC";

export type MachineStudyHeaderPayload = {
  epcId: string;
  isCompetitorMachine?: boolean;
  machineModel: string;
  customerName: string;
  startDate: string;
  endDate: string;
  application: string;
  fuelType: FuelType;
  startHmr: number;
  endHmr: number;
  bucketVolumeCuM: number;
  acStatus: string;
  operationMode: string;
  dieselTopUpLtr?: number;
  startKwhReading?: number;
  endKwhReading?: number;
  operatorName?: string;
  operatorExperience?: string;
  priorMachinesOperated?: string;
};

export type MachineStudy = MachineStudyHeaderPayload & {
  id: string;
  created_at: string;
  updated_at: string;
  _count?: { cycles: number };
};

export type MachineStudyCycle = {
  id: string;
  studyId: string;
  sequenceNo: number;
  truckNumber: string | null;
  startSeconds: number;
  finishSeconds: number;
  timeTakenSeconds: number;
  bucketPasses: number | null;
  swingAngleDegrees: string | null;
  unladenWeightKg: number | null;
  ladenWeightKg: number | null;
  payloadKg: number | null;
  remarks: string | null;
};

export type MachineStudyWithCycles = MachineStudy & {
  cycles: MachineStudyCycle[];
};

export type CycleImportRowError = {
  row: number;
  field: string;
  message: string;
};

export type CycleImportResult = {
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errors: CycleImportRowError[];
};
