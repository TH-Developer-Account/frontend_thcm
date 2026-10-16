import { AlertTriangle, CheckCircle2 } from "lucide-react";

import type { ParsedInitiationFile } from "../types/medicalClaimInitiation.types";
import { COLUMN_LABELS, INITIATION_IMPORT_COLUMNS } from "../helpers/initiationImport.parser";

type Props = {
	parsedFile: ParsedInitiationFile | null;
	isParsing?: boolean;
};

const MAX_PREVIEW_ROWS = 200;

/** Browser-side validation result for the selected import file. */
export function InitiationImportPreviewTable({ parsedFile, isParsing }: Props) {
	if (isParsing) {
		return (
			<p className="text-sm text-zinc-600" role="status">
				Checking the file…
			</p>
		);
	}
	if (!parsedFile || parsedFile.fileErrors.length) return null;

	// Invalid rows first — that's what the user needs to act on.
	const rows = [...parsedFile.rows]
		.sort((a, b) => Number(a.isValid) - Number(b.isValid) || a.row - b.row)
		.slice(0, MAX_PREVIEW_ROWS);

	return (
		<section className="flex flex-col gap-2" aria-live="polite">
			<div className="flex flex-wrap items-center gap-3 text-sm">
				<span className="inline-flex items-center gap-1 text-green-700">
					<CheckCircle2 aria-hidden="true" size={16} />
					{parsedFile.validCount} valid row{parsedFile.validCount === 1 ? "" : "s"}
				</span>
				{parsedFile.invalidCount ? (
					<span className="inline-flex items-center gap-1 text-red-700">
						<AlertTriangle aria-hidden="true" size={16} />
						{parsedFile.invalidCount} row{parsedFile.invalidCount === 1 ? "" : "s"} with errors
						{parsedFile.validCount ? " — they will be skipped" : ""}
					</span>
				) : null}
			</div>

			<div className="max-h-72 overflow-auto rounded-md border border-zinc-200">
				<table className="w-full min-w-[640px] border-collapse text-xs">
					<thead className="sticky top-0 bg-zinc-100 text-left text-zinc-600">
						<tr>
							<th className="px-2 py-1.5 font-medium">Row</th>
							{INITIATION_IMPORT_COLUMNS.map((field) => (
								<th key={field} className="px-2 py-1.5 font-medium">
									{COLUMN_LABELS[field]}
								</th>
							))}
							<th className="px-2 py-1.5 font-medium">Status</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr
								key={row.row}
								className={row.isValid ? "border-t border-zinc-100" : "border-t border-red-100 bg-red-50"}
							>
								<td className="px-2 py-1.5 text-zinc-500">{row.row}</td>
								{INITIATION_IMPORT_COLUMNS.map((field) => (
									<td key={field} className="px-2 py-1.5 align-top">
										<span className="block">{row.values[field] || "—"}</span>
										{row.errors[field] ? (
											<span className="block text-[11px] text-red-700">{row.errors[field]}</span>
										) : null}
									</td>
								))}
								<td className="px-2 py-1.5">
									{row.isValid ? (
										<span className="text-green-700">Ready</span>
									) : (
										<span className="text-red-700">Will be skipped</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{parsedFile.rows.length > MAX_PREVIEW_ROWS ? (
				<p className="text-xs text-zinc-500">
					Showing the first {MAX_PREVIEW_ROWS} of {parsedFile.rows.length} rows.
				</p>
			) : null}
		</section>
	);
}

export default InitiationImportPreviewTable;
