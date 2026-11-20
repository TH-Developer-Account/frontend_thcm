// tabs/AttachmentsTab.tsx — wizard step 5, and the Attachments tab of the view page.
// Edit: one upload per item of the "Attachments Required" list in the CPP format.
// View: a table of the files that were uploaded, with View (modal) and Download.
// Files are handed to TCS with the approved request, together with the Excel.
// Plain content: the parent card provides the surface.
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Download, Eye } from "lucide-react";

import { Modal } from "../../../components/common/Modal";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import SimpleViewTable from "../../../components/ui/tables/SimpleViewTable";
import { useCppReadOnly } from "../components/CppFields";
import type { CppFormValues } from "../types/cpp.types";
import { CPP_ATTACHMENTS } from "../utils/cpp.utils";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

const formatDate = (value?: string): string => {
	if (!value) return "--";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "--" : dateFormatter.format(date);
};

const extensionOf = (name: string): string =>
	name.split(".").pop()?.toLowerCase() ?? "";

const isImage = (file: FileUploadValue): boolean =>
	file.type.startsWith("image/") ||
	["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extensionOf(file.name));

const isPdf = (file: FileUploadValue): boolean =>
	file.type === "application/pdf" || extensionOf(file.name) === "pdf";

/** Saves the file under its own name; opens it in a new tab if the fetch is blocked. */
const downloadFile = async (file: FileUploadValue): Promise<void> => {
	if (!file.url) return;
	try {
		const response = await fetch(file.url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const objectUrl = URL.createObjectURL(await response.blob());
		const link = document.createElement("a");
		link.href = objectUrl;
		link.download = file.name || "download";
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
	} catch {
		window.open(file.url, "_blank", "noopener,noreferrer");
	}
};

type ViewRow = { key: string; label: string; file: FileUploadValue };

const AttachmentsTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const values = useWatch({ control, name: "attachments" }) as
		| Record<string, FileUploadValue | null>
		| undefined;
	const [previewFile, setPreviewFile] = useState<FileUploadValue | null>(null);

	if (readOnly) {
		const rows: ViewRow[] = CPP_ATTACHMENTS.flatMap((item) => {
			const file = values?.[item.key];
			return file ? [{ key: item.key, label: item.label, file }] : [];
		});

		return (
			<>
				<SimpleViewTable<ViewRow>
					ariaLabel="CPP attachments"
					data={rows}
					getRowId={(row) => row.key}
					defaultColumnMinWidth={64}
					columns={[
						{
							key: "type",
							header: "Type",
							widthUnits: 2,
							minWidth: 120,
							render: (row) => row.label,
						},
						{
							key: "fileName",
							header: "File name",
							widthUnits: 4,
							minWidth: 160,
							render: (row) => (
								<span className="break-all">{row.file.name}</span>
							),
						},
						{
							key: "uploadedAt",
							header: "Uploaded on",
							widthUnits: 2,
							minWidth: 110,
							render: (row) => formatDate(row.file.uploadedAt),
						},
					]}
					actions={[
						{
							icon: Eye,
							label: "View",
							onClick: (row) => setPreviewFile(row.file),
							disabled: (row) => !row.file.url,
						},
						{
							icon: Download,
							label: "Download",
							onClick: (row) => void downloadFile(row.file),
							disabled: (row) => !row.file.url,
						},
					]}
					emptyTitle="No attachments"
					emptyDescription="No supporting documents were uploaded."
				/>

				<Modal
					open={previewFile !== null}
					title={previewFile?.name ?? "File preview"}
					size="xl"
					onClose={() => setPreviewFile(null)}
					ariaLabel="File preview"
				>
					{previewFile?.url ? (
						<div className="flex max-h-[70vh] flex-col items-center justify-center overflow-auto">
							{isImage(previewFile) ? (
								<img
									src={previewFile.url}
									alt={previewFile.name}
									className="max-h-full max-w-full object-contain"
								/>
							) : isPdf(previewFile) ? (
								<iframe
									src={previewFile.url}
									title={previewFile.name}
									className="h-[70vh] w-full"
								/>
							) : (
								<p className="py-10 text-center">
									This file type cannot be previewed in the browser.
								</p>
							)}
							<a
								href={previewFile.url}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-3 text-brand underline-offset-2 hover:underline"
							>
								Open file in new tab
							</a>
						</div>
					) : null}
				</Modal>
			</>
		);
	}

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{CPP_ATTACHMENTS.map((item) => (
				<Controller
					key={item.key}
					name={`attachments.${item.key}`}
					control={control}
					render={({ field, fieldState }) => (
						<FileUploadField
							value={field.value ?? null}
							onChange={(file) => field.onChange(file)}
							label={item.label}
							description="PDF, Excel, Word or image"
							error={fieldState.error?.message}
							heightClassName="h-[100px]"
						/>
					)}
				/>
			))}
		</div>
	);
};

export default AttachmentsTab;
