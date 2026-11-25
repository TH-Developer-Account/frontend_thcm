// components/PartSummaryModal.tsx — "Summary / part info" for the purchasing step.
// Shows the expected format of the summary sheet, the blank template to fill in, and
// (in edit mode) the upload. After a save the modal shows how many part rows the server
// read from the sheet, and the saved sheet can be downloaded (edit and view mode).
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { useToast } from "../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../services/ServerAxios";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import type { CppFormValues } from "../types/cpp.types";
import { canDownload, downloadCppFile } from "../utils/cpp.files";
import { useCppReadOnly, useFieldError } from "./CppFields";
import { Download } from "lucide-react";

const TEMPLATE_FILE_NAME = "CPP-summary-sheet-template.xlsx";

/** Column groups of the summary sheet (Price Revision Data layout). Order matters. */
const FORMAT_GROUPS: { group: string; columns: string[] }[] = [
	{
		group: "Price Revision Data",
		columns: [
			"Sl. No.",
			"Plant",
			"Model",
			"Part No.",
			"Description",
			"UOM",
			"Existing Price w.e.f.01.01.26 (INR)",
			"New Price (INR)",
			"Difference (INR)",
			"Current PO applicable for PO/SA updation",
			"Effective Date",
		],
	},
	{
		group: "For Retro. Price Impact",
		columns: ["Rcvd Qty", "Actual Impact"],
	},
	{
		group: "For Annualised Impact",
		columns: ["ABP Vol.", "Qty per m/c", "Annualised Impact", "% Change"],
	},
];

/** The saved attachment carries the rows the server read from the sheet. */
type SummaryFileValue = FileUploadValue & { partRowCount?: number };

const saveBlob = (blob: Blob, fileName: string) => {
	const blobUrl = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = blobUrl;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
};

/** Error bodies of blob requests arrive as a Blob — read the server message out of it. */
const blobErrorMessage = async (
	error: unknown,
	fallback: string,
): Promise<string> => {
	const data = (error as { response?: { data?: unknown } })?.response?.data;
	if (data instanceof Blob) {
		try {
			const parsed = JSON.parse(await data.text()) as { message?: string };
			if (parsed.message) return parsed.message;
		} catch {
			/* not JSON — use the generic message */
		}
	}
	return getApiErrorMessage(error, fallback);
};

const PartSummaryModal = ({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const { showToast } = useToast();
	const [downloading, setDownloading] = useState(false);
	const current = useWatch({ control, name: "attachments.partSummary" }) as
		| SummaryFileValue
		| null
		| undefined;
	const error = useFieldError("attachments.partSummary");
	const columnCount = FORMAT_GROUPS.reduce(
		(total, group) => total + group.columns.length,
		0,
	);

	// Only a saved sheet has a row count; a file picked but not yet saved does not.
	const rowCount =
		current && !current.isLocal ? current.partRowCount : undefined;
	const savedFile = current && !current.isLocal && canDownload(current) ? current : null;
	const downloadSaved = savedFile ? (
		<Button
			type="button"
			text="Download uploaded sheet"
			size="sm"
			appearance="standard"
			variant="outline"
			Icon={Download}
			onClick={() =>
				void downloadCppFile({ name: savedFile.name, url: savedFile.url })
			}
		/>
	) : null;
	const rowCountText =
		current && current.isLocal
			? "The rows are read when you save the request."
			: typeof rowCount === "number"
				? `${rowCount} part ${rowCount === 1 ? "row" : "rows"} read from this sheet.`
				: null;

	const downloadTemplate = async () => {
		if (downloading) return;
		setDownloading(true);
		try {
			const { data } = await ServerAxios.get<Blob>(
				"/cpp/part-summary-template",
				{
					responseType: "blob",
				},
			);
			saveBlob(data, TEMPLATE_FILE_NAME);
		} catch (err) {
			showToast({
				type: "error",
				title: "Could not download the template",
				description: await blobErrorMessage(
					err,
					"Failed to download the summary sheet template.",
				),
			});
		} finally {
			setDownloading(false);
		}
	};

	return (
		<Modal
			open={open}
			title="Summary sheet (part info)"
			size="xl"
			onClose={onClose}
			ariaLabel="Summary sheet format and upload"
		>
			<div className="flex flex-col gap-4">
				<div
					role="note"
					className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900"
				>
					<p className="font-semibold">
						Fill the summary sheet in the expected format.
					</p>
					<p>
						The file is formatted: do not add or remove columns. Keep the header
						and sub-header rows, and fill only the data rows below them.
					</p>
					<div className="mt-2">
						<Button
							type="button"
							text={downloading ? "Downloading..." : "Download blank template"}
							size="sm"
							onClick={downloadTemplate}
							appearance="standard"
							variant="brand"
							Icon={Download}
						/>
					</div>
				</div>

				{readOnly ? null : (
					<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
						<strong>This field is mandatory.</strong> Upload the summary sheet
						before you submit the request.
					</div>
				)}

				{error && !readOnly ? (
					<Alert variant="error" title="Summary sheet" description={error} />
				) : null}

				<div className="overflow-x-auto rounded-md border border-slate-200 scrollbar-sleek">
					<table className="w-full min-w-[1100px] text-xs">
						<thead className="bg-slate-50 font-semibold text-slate-700">
							<tr className="border-b border-slate-200">
								{FORMAT_GROUPS.map((group) => (
									<th
										key={group.group}
										colSpan={group.columns.length}
										className="px-2 py-1.5 text-center"
									>
										{group.group}
									</th>
								))}
							</tr>
							<tr>
								{FORMAT_GROUPS.flatMap((group) =>
									group.columns.map((column) => (
										<th
											key={`${group.group}-${column}`}
											className="px-2 py-1.5 text-left font-medium"
										>
											{column}
										</th>
									)),
								)}
							</tr>
						</thead>
						<tbody>
							<tr>
								<td colSpan={columnCount} className="px-3 py-2 text-fg-muted">
									Data rows go below the sub-header, one row per part and plant.
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{readOnly ? (
					<div className="text-sm">
						{current ? (
							<p>
								Uploaded: <span className="font-medium">{current.name}</span>
							</p>
						) : (
							<p>No summary sheet was uploaded.</p>
						)}
						{rowCountText ? (
							<p className="text-slate-600">{rowCountText}</p>
						) : null}
						{downloadSaved ? <div className="mt-2">{downloadSaved}</div> : null}
					</div>
				) : (
					<div className="flex flex-col gap-1">
						<Controller
							name="attachments.partSummary"
							control={control}
							render={({ field, fieldState }) => (
								<FileUploadField
									value={field.value ?? null}
									onChange={(file) => field.onChange(file)}
									kind="spreadsheet"
									label="Summary sheet (part info)"
									description="Excel in the expected format. Supported formats: XLSX, XLS and CSV"
									required
									error={fieldState.error?.message}
								/>
							)}
						/>
						{rowCountText ? (
							<p className="text-sm text-slate-600">{rowCountText}</p>
						) : null}
						{downloadSaved ? <div>{downloadSaved}</div> : null}
					</div>
				)}

				<div className="flex justify-end">
					<Button type="button" text="Close" size="sm" onClick={onClose} />
				</div>
			</div>
		</Modal>
	);
};

export default PartSummaryModal;
