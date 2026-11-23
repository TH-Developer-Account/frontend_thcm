// tabs/AttachmentsTab.tsx — wizard step 7 (Attachments), and the Attachments tab of the view page.
// Edit: the Mandatory Check List (Yes / No / NA and an upload per row), then the supporting documents.
// View: one table of every item with its answer and file, with View (modal) and Download.
// The summary sheet (part info) is uploaded from Purchasing details, not here.
// Plain content: the parent card provides the surface.
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Download, Eye } from "lucide-react";

import Button from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import SimpleViewTable from "../../../components/ui/tables/SimpleViewTable";
import CppSection from "../components/CppSection";
import { useCppReadOnly, useFieldError } from "../components/CppFields";
import type { CppChecklistValue, CppFormValues } from "../types/cpp.types";
import { CPP_CHECKLIST, CPP_SUPPORTING_DOCS } from "../utils/cpp.utils";

const CHECK_ANSWERS: Exclude<CppChecklistValue, "">[] = ["Yes", "No", "NA"];

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

/** Yes / No / NA toggles for one Mandatory Check List row. */
const ChecklistAnswer = ({
	itemKey,
	label,
}: {
	itemKey: string;
	label: string;
}) => {
	const { control } = useFormContext<CppFormValues>();
	const error = useFieldError(`other.checklist.${itemKey}`);

	return (
		<Controller
			name={`other.checklist.${itemKey}`}
			control={control}
			render={({ field }) => (
				<div className="flex flex-col gap-1">
					<div
						role="group"
						aria-label={`${label} answer`}
						className="flex flex-wrap gap-2 self-center"
					>
						{CHECK_ANSWERS.map((answer) => (
							<Button
								key={answer}
								type="button"
								text={answer}
								size="sm"
								appearance="toggle"
								active={field.value === answer}
								onClick={() => field.onChange(answer)}
							/>
						))}
					</div>
					{error ? (
						<p className="form-error-text" role="alert">
							{error}
						</p>
					) : null}
				</div>
			)}
		/>
	);
};

/** One file slot. The value is a FileUploadValue, or null when nothing is attached. */
const AttachmentSlot = ({
	itemKey,
	label,
}: {
	itemKey: string;
	label: string;
}) => {
	const { control } = useFormContext<CppFormValues>();

	return (
		<Controller
			name={`attachments.${itemKey}`}
			control={control}
			render={({ field, fieldState }) => (
				<FileUploadField
					value={field.value ?? null}
					onChange={(file) => field.onChange(file)}
					label={label}
					description="PDF, Excel, Word or image"
					error={fieldState.error?.message}
					// heightClassName="h-[100px]"
				/>
			)}
		/>
	);
};

type ViewRow = {
	key: string;
	label: string;
	answer: string;
	file: FileUploadValue | null;
};

const AttachmentsTab = () => {
	const { control } = useFormContext<CppFormValues>();
	const readOnly = useCppReadOnly();
	const attachments = useWatch({ control, name: "attachments" }) as
		| Record<string, FileUploadValue | null>
		| undefined;
	const checklist = useWatch({ control, name: "other.checklist" }) as
		| Record<string, string>
		| undefined;
	const [previewFile, setPreviewFile] = useState<FileUploadValue | null>(null);

	if (readOnly) {
		const rows: ViewRow[] = [
			...CPP_CHECKLIST.map((item) => ({
				key: item.key,
				label: item.label,
				answer: checklist?.[item.key] || "—",
				file: attachments?.[item.key] ?? null,
			})),
			...CPP_SUPPORTING_DOCS.map((item) => ({
				key: item.key,
				label: item.label,
				answer: "—",
				file: attachments?.[item.key] ?? null,
			})),
		];

		return (
			<>
				<SimpleViewTable<ViewRow>
					ariaLabel="CPP attachments"
					data={rows}
					getRowId={(row) => row.key}
					defaultColumnMinWidth={64}
					columns={[
						{
							key: "item",
							header: "Item",
							widthUnits: 3,
							minWidth: 160,
							render: (row) => row.label,
						},
						{
							key: "answer",
							header: "Answer",
							widthUnits: 1,
							minWidth: 72,
							render: (row) => row.answer,
						},
						{
							key: "fileName",
							header: "File name",
							widthUnits: 3,
							minWidth: 160,
							render: (row) =>
								row.file ? (
									<span className="break-all">{row.file.name}</span>
								) : (
									"—"
								),
						},
						{
							key: "uploadedAt",
							header: "Uploaded on",
							widthUnits: 2,
							minWidth: 110,
							render: (row) => formatDate(row.file?.uploadedAt),
						},
					]}
					actions={[
						{
							icon: Eye,
							label: "View",
							onClick: (row) => {
								if (row.file) setPreviewFile(row.file);
							},
							disabled: (row) => !row.file?.url,
						},
						{
							icon: Download,
							label: "Download",
							onClick: (row) => {
								if (row.file) void downloadFile(row.file);
							},
							disabled: (row) => !row.file?.url,
						},
					]}
					emptyTitle="No attachments"
					emptyDescription="No attachments were uploaded."
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
		<div className="flex flex-col gap-6">
			<CppSection
				title="Mandatory check list"
				subtitle="Answer every row with Yes, No or NA. Attach the document where it applies. This field is mandatory."
			>
				<div className="flex flex-col divide-y divide-slate-200 rounded-md border border-slate-200">
					<div className="hidden gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)]">
						<span>Item</span>
						<span>Answer</span>
						<span>Document</span>
					</div>
					{CPP_CHECKLIST.map((item, index) => (
						<div
							key={item.key}
							className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] lg:items-start"
						>
							<div className="text-sm font-medium text-slate-900">
								<span className="text-slate-500">{index + 1}. </span>
								{item.label}
								<span className="form-required"> *</span>
							</div>
							<ChecklistAnswer itemKey={item.key} label={item.label} />
							<AttachmentSlot itemKey={item.key} label="Upload document" />
						</div>
					))}
				</div>
			</CppSection>

			<CppSection
				title="Supporting documents"
				subtitle="Optional. Attach any of these that apply to the request."
			>
				<div className="grid gap-4 lg:grid-cols-2">
					{CPP_SUPPORTING_DOCS.map((item) => (
						<AttachmentSlot
							key={item.key}
							itemKey={item.key}
							label={item.label}
						/>
					))}
				</div>
			</CppSection>
		</div>
	);
};

export default AttachmentsTab;
