import { Trash2 } from "lucide-react";

import Button from "../../../components/common/Button";
import type { MedicalClaimImportProgress } from "../types/medicalClaimInitiation.types";

type Props = {
	progress?: MedicalClaimImportProgress;
	isImporting: boolean;
	onClear: () => void;
};

export function ImportedMedicalClaimInitiationTable({
	progress,
	isImporting,
	onClear,
}: Props) {
	if (!progress) return null;
	const successfulRows = Math.max(
		0,
		progress.processedRows - progress.failedRows,
	);
	const percent = progress.totalRows
		? Math.min(
				100,
				Math.round((progress.processedRows / progress.totalRows) * 100),
			)
		: 0;

	return (
		<section className="mt-6 border-t border-zinc-200 pt-5" aria-live="polite">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h3 className="text-sm font-semibold text-zinc-900">Import status</h3>
					<p className="mt-1 text-sm text-zinc-600">
						{progress.status === "completed"
							? "Import completed"
							: progress.status === "failed"
								? "Import failed"
								: "Initiating medical claims…"}
					</p>
				</div>
				<Button
					type="button"
					text="Clear"
					Icon={Trash2}
					size="sm"
					appearance="standard"
					variant="outline"
					disabled={isImporting}
					onClick={onClear}
				/>
			</div>
			<div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200">
				<div
					className="h-full bg-green-600 transition-[width]"
					style={{ width: `${percent}%` }}
				/>
			</div>
			<p className="mt-2 text-xs text-zinc-600">
				Processed {progress.processedRows} of {progress.totalRows || "—"} ·
				Successful {successfulRows} · Failed {progress.failedRows}
			</p>
			{progress.failedReason ? (
				<p role="alert" className="mt-3 text-sm text-red-600">
					{progress.failedReason}
				</p>
			) : null}
			{progress.errors.length ? (
				<ul className="mt-3 max-h-48 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{progress.errors.map((item, index) => (
						<li key={`${item.row ?? "row"}-${index}`}>
							{item.row ? `Row ${item.row}: ` : ""}
							{item.message ?? item.error ?? "Import failed"}
						</li>
					))}
				</ul>
			) : null}
		</section>
	);
}
