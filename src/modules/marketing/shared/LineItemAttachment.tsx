// shared/LineItemAttachment.tsx
// Attachment control for one line-item row (draft row or saved row).
//
//   no file   → a single attach (paperclip) icon button that opens the picker
//   uploading → a spinner in the same spot
//   has file  → the paperclip opens a small menu: View · Download · Delete
//
// "View" opens the file in a preview modal (image or PDF). Viewers
// (`readOnly`) get View and Download only.
import { useRef, useState } from "react";
import {
	Download,
	Eye,
	FileText,
	Loader2,
	Paperclip,
	Trash2,
} from "lucide-react";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";
import Button from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import {
	isImageUpload,
	isPdfUpload,
} from "../../../components/ui/FileUpload/fileUpload.helpers";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";

/** Same set the backend accepts (LINE_ITEM_ATTACHMENT_MIME_TYPES). */
export const LINE_ITEM_ATTACHMENT_TYPES = ["application/pdf", "image/jpeg"];

/** What the upload endpoint returns; `s3Key` is what the EPF payload carries. */
export type LineItemAttachmentUpload = {
	s3Key: string;
	fileName?: string;
};

type LineItemAttachmentProps = {
	value: FileUploadValue | null;
	inputName: string;
	uploading?: boolean;
	/** View / Download only; no attach, no delete. */
	readOnly?: boolean;
	/** A file name is known but no URL could be resolved for it. */
	unavailableName?: string | null;
	onSelect?: (file: File) => void;
	onRemove?: () => void;
};

// The `download` attribute is ignored for cross-origin URLs (signed S3 links),
// so fetch the file as a blob first. If the fetch is blocked (CORS), fall back
// to opening the URL in a new tab so the user can still save it.
const triggerAnchorDownload = (
	href: string,
	fileName: string,
	openInNewTab = false,
) => {
	const link = document.createElement("a");

	link.href = href;
	link.download = fileName;
	link.rel = "noopener noreferrer";

	if (openInNewTab) {
		link.target = "_blank";
	}

	document.body.appendChild(link);
	link.click();
	link.remove();
};

const downloadFile = async (value: FileUploadValue): Promise<void> => {
	if (!value.url) return;

	const fileName = value.name?.trim() || "download";

	try {
		const response = await fetch(value.url);

		if (!response.ok) {
			throw new Error(`Download failed with status ${response.status}`);
		}

		const blobUrl = URL.createObjectURL(await response.blob());

		triggerAnchorDownload(blobUrl, fileName);
		window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
	} catch {
		triggerAnchorDownload(value.url, fileName, true);
	}
};

export default function LineItemAttachment({
	value,
	inputName,
	uploading = false,
	readOnly = false,
	unavailableName = null,
	onSelect,
	onRemove,
}: LineItemAttachmentProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [previewOpen, setPreviewOpen] = useState(false);

	if (uploading) {
		return (
			<span
				className="line-item-file-action"
				title="Uploading…"
				role="status"
				aria-label="Uploading file"
			>
				<Loader2 className="animate-spin" aria-hidden="true" />
			</span>
		);
	}

	/* ------------------------------- No file -------------------------------- */

	if (!value) {
		if (unavailableName) {
			return (
				<span
					className="line-item-file-action line-item-file-action-disabled"
					title={unavailableName}
				>
					<Paperclip aria-hidden="true" />
				</span>
			);
		}

		if (readOnly || !onSelect) {
			return <span className="line-item-empty-value">--</span>;
		}

		return (
			<>
				<input
					ref={inputRef}
					type="file"
					name={inputName}
					accept={LINE_ITEM_ATTACHMENT_TYPES.join(",")}
					hidden
					onChange={(event) => {
						const file = event.target.files?.[0];

						// Reset so picking the same file again still fires onChange.
						event.target.value = "";

						if (file) onSelect(file);
					}}
				/>

				<Button
					type="button"
					appearance="icon"
					variant="outline"
					size="sm"
					Icon={Paperclip}
					aria-label="Attach file"
					onClick={() => inputRef.current?.click()}
				/>
			</>
		);
	}

	/* ------------------------------- Has file ------------------------------- */

	const actions: ActionMenuItem<FileUploadValue>[] = [
		{
			id: "view",
			label: "View",
			Icon: Eye,
			disabled: !value.url,
			onClick: () => setPreviewOpen(true),
		},
		{
			id: "download",
			label: "Download",
			Icon: Download,
			disabled: !value.url,
			onClick: (file) => void downloadFile(file),
		},
		{
			id: "delete",
			label: "Delete",
			Icon: Trash2,
			variant: "danger",
			hidden: readOnly || !onRemove,
			onClick: () => onRemove?.(),
		},
	];

	const canPreviewImage = isImageUpload(value);
	const canPreviewPdf = isPdfUpload(value);

	return (
		<>
			<span title={value.name} className="inline-flex">
				<ActionMenu
					row={value}
					actions={actions}
					ariaLabel={`File options: ${value.name}`}
					size="sm"
					triggerIcon={Paperclip}
					triggerVariant="outline"
				/>
			</span>

			{previewOpen ? (
				<Modal
					open
					title={value.name}
					size="xl"
					className="file-upload-preview-modal"
					onClose={() => setPreviewOpen(false)}
					ariaLabel="Attachment preview"
				>
					<div className="file-upload-preview-modal-content">
						{canPreviewImage ? (
							<img
								src={value.url}
								alt={value.name}
								className="file-upload-preview-modal-image"
							/>
						) : canPreviewPdf ? (
							<iframe
								src={value.url}
								title={value.name}
								className="file-upload-preview-modal-frame"
							/>
						) : (
							<div className="file-upload-preview-modal-fallback">
								<FileText aria-hidden="true" />
								<p>This file type cannot be previewed in the browser.</p>
								<a
									href={value.url}
									target="_blank"
									rel="noopener noreferrer"
									className="file-upload-preview-modal-link"
								>
									Open file
								</a>
							</div>
						)}
					</div>
				</Modal>
			) : null}
		</>
	);
}
