import { Save } from "lucide-react";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import type { BaseOption } from "../../../components/forms/SelectInput";
import { useMachineStudyForm } from "./useMachineStudyForm";
import type { MachineStudy } from "./machineStudy.types";

const FUEL_TYPE_OPTIONS: BaseOption[] = [
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Electric" },
];

type MachineStudyHeaderFormProps = {
  epcId: string;
  isCompetitorMachine: boolean;
  existingStudy: MachineStudy | undefined;
  onSaved?: () => void;
};

const MachineStudyHeaderForm = ({
  epcId,
  isCompetitorMachine,
  existingStudy,
  onSaved,
}: MachineStudyHeaderFormProps) => {
  const { form, handleChange, error, isSaving, handleSave, isExisting } =
    useMachineStudyForm({
      epcId,
      isCompetitorMachine,
      existingStudy,
    });

  const isDiesel = form.fuelType === "DIESEL";
  const isElectric = form.fuelType === "ELECTRIC";

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Machine Study Details
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {isCompetitorMachine ? "Competition machine" : "Tata Hitachi machine"}{" "}
          — study header
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
        <FormInput
          label="Machine Model"
          value={form.machineModel}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("machineModel", e.target.value)
          }
        />
        <FormInput
          label="Customer Name"
          value={form.customerName}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("customerName", e.target.value)
          }
        />
        <FormInput
          label="Start Date"
          type="date"
          value={form.startDate}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("startDate", e.target.value)
          }
        />
        <FormInput
          label="End Date"
          type="date"
          value={form.endDate}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("endDate", e.target.value)
          }
        />
        <FormInput
          label="Application"
          value={form.application}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("application", e.target.value)
          }
        />
        <SelectInput
          label="Fuel Type"
          required
          options={FUEL_TYPE_OPTIONS}
          value={
            FUEL_TYPE_OPTIONS.find((o) => o.value === form.fuelType) ?? null
          }
          onChange={(option) =>
            handleChange(
              "fuelType",
              ((option as BaseOption | null)?.value as any) ?? "",
            )
          }
        />
        <FormInput
          label="Start HMR"
          type="number"
          value={form.startHmr}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("startHmr", e.target.value)
          }
        />
        <FormInput
          label="End HMR"
          type="number"
          value={form.endHmr}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("endHmr", e.target.value)
          }
        />
        <FormInput
          label="Bucket (cu.m)"
          type="number"
          value={form.bucketVolumeCuM}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("bucketVolumeCuM", e.target.value)
          }
        />
        <FormInput
          label="AC Status"
          value={form.acStatus}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("acStatus", e.target.value)
          }
        />
        <FormInput
          label="Operation Mode"
          value={form.operationMode}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("operationMode", e.target.value)
          }
        />

        {isDiesel ? (
          <FormInput
            label="Diesel Filled (Top-up, Ltr)"
            type="number"
            value={form.dieselTopUpLtr}
            required
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange("dieselTopUpLtr", e.target.value)
            }
          />
        ) : null}

        {isElectric ? (
          <>
            <FormInput
              label="Start kWh Reading"
              type="number"
              value={form.startKwhReading}
              required
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("startKwhReading", e.target.value)
              }
            />
            <FormInput
              label="End kWh Reading"
              type="number"
              value={form.endKwhReading}
              required
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("endKwhReading", e.target.value)
              }
            />
          </>
        ) : null}

        <FormInput
          label="Operator Name"
          value={form.operatorName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("operatorName", e.target.value)
          }
        />
        <FormInput
          label="Operator Experience"
          value={form.operatorExperience}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("operatorExperience", e.target.value)
          }
        />
        <FormInput
          label="Prior Machines Operated"
          value={form.priorMachinesOperated}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange("priorMachinesOperated", e.target.value)
          }
        />
      </div>

      {error ? (
        <div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end border-t border-gray-100 px-5 py-4">
        <Button
          onClick={async () => {
            await handleSave();
            onSaved?.();
          }}
          appearance="standard"
          variant="brand"
          size="sm"
          disabled={isSaving}
          Icon={Save}
          text={isSaving ? "Saving..." : isExisting ? "Update" : "Save"}
        />
      </div>
    </div>
  );
};

export default MachineStudyHeaderForm;
