import React from "react";
import { FileUp, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { downloadMachineStudyCycleTemplate } from "./utils/generateMachineStudyCycleTemplate";
import Button from "../../../components/common/Button";
import { useUploadMachineStudyCyclesMutation } from "./useMachineStudyMutation";
import type { CycleImportResult } from "./machineStudy.types";

type MachineStudyCycleUploadProps = {
  studyId: string | undefined; // undefined until the header's been saved at least once
  existingCycleCount: number;
  onUploaded: () => void;
};

const MachineStudyCycleUpload = ({
  studyId,
  existingCycleCount,
  onUploaded,
}: MachineStudyCycleUploadProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadMachineStudyCyclesMutation();
  const [lastResult, setLastResult] = React.useState<CycleImportResult | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !studyId) return;

    try {
      setError(null);
      const result = await uploadMutation.mutateAsync({ id: studyId, file });
      setLastResult(result);
      onUploaded();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to upload cycle data.",
      );
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">Cycle Data</h3>
        <p className="mt-1 text-xs text-gray-500">
          Upload the truck-by-truck cycle table for this machine study
        </p>
      </div>

      <Button
        type="button"
        size="sm"
        appearance="standard"
        variant="outline"
        Icon={Download}
        onClick={downloadMachineStudyCycleTemplate}
        text="Download Template"
      />

      <div className="p-5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileSelected}
        />

        {!studyId ? (
          <p className="text-sm text-gray-500">
            Save the machine study details above before uploading cycle data.
          </p>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <FileUp className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {existingCycleCount > 0
                    ? `${existingCycleCount} cycle row(s) uploaded`
                    : "No cycle data uploaded yet"}
                </p>
                <p className="text-xs text-gray-500">
                  Re-uploading replaces the existing cycle set
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              appearance="standard"
              variant="outline"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
              text={uploadMutation.isPending ? "Uploading..." : "Upload File"}
            />
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {lastResult ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              {lastResult.processedRows} row(s) imported successfully
            </div>

            {lastResult.failedRows > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {lastResult.failedRows} row(s) failed
                </div>
                <ul className="mt-2 space-y-1 text-xs">
                  {lastResult.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      Row {err.row} — {err.field}: {err.message}
                    </li>
                  ))}
                </ul>
                {lastResult.errors.length > 10 ? (
                  <p className="mt-1 text-xs italic">
                    +{lastResult.errors.length - 10} more error(s)
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MachineStudyCycleUpload;
