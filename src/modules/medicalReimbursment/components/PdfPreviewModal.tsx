import { ExternalLink } from "lucide-react";

import { Modal } from "../../../components/common/Modal";

type PdfPreviewModalProps = {
	/** Signed PDF URL; null/undefined keeps the modal closed. */
	url: string | null;
	title?: string;
	onClose?: () => void;
};

/** In-app preview of the generated claim PDF (View PDF action). */
export default function PdfPreviewModal({ url, title = "Claim PDF", onClose }: PdfPreviewModalProps) {
	return (
		<Modal
			open={Boolean(url) && Boolean(onClose)}
			title={title}
			size="xl"
			className="file-upload-preview-modal"
			onClose={() => onClose?.()}
			ariaLabel="Medical claim PDF preview"
		>
			{url ? (
				<div className="flex flex-col gap-2 p-3">
					<iframe
						src={url}
						title={title}
						className="h-[75vh] w-full rounded-md border border-border"
					/>
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 self-end text-xs font-medium text-brand hover:underline"
					>
						Open in a new tab <ExternalLink aria-hidden="true" size={14} />
					</a>
				</div>
			) : null}
		</Modal>
	);
}
