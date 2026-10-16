// forms/EPF/EpfItemSection.tsx
// Event Cost Overheads table. The host (EpfForm) wraps it in a Card section.
//
// Attachments are uploaded as soon as they are picked (POST
// /epf/line-item/attachment); the returned S3 key travels with the line item
// in the EPF create/update payload.
import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { LineItemOption } from "../../types/epc.types";
import { epfApi } from "../../api/epf.api";
import { OVERHEAD_COLUMNS } from "../../utils/constant";
import LineItemTable from "../../../shared/LineItemTable";

type EpfItemsSectionProps = {
	items: LineItemOption[];
	onChange: Dispatch<SetStateAction<LineItemOption[]>>;
	options: LineItemOption[];
	isViewer?: boolean;
	/** The upload endpoint files attachments under this EPC. */
	epcId?: string | null;
	/** True while an attachment is uploading. */
	onAttachmentBusyChange?: (busy: boolean) => void;
};

export default function EpfItemsSection({
	items,
	onChange,
	options,
	isViewer = false,
	epcId,
	onAttachmentBusyChange,
}: EpfItemsSectionProps) {
	const handleUpload = useCallback(
		(file: File) => {
			if (!epcId) {
				return Promise.reject(new Error("EPC ID not found."));
			}

			return epfApi.uploadLineItemAttachment({ epcId, file });
		},
		[epcId],
	);

	return (
		<LineItemTable
			title="Event Cost Overheads"
			// The Card section above already shows the title and the item count.
			hideHeader
			items={items}
			onChange={onChange}
			particularOptions={options}
			isViewer={isViewer}
			category="EVENT_OVERHEAD"
			columns={OVERHEAD_COLUMNS}
			onUploadAttachment={epcId ? handleUpload : undefined}
			onBusyChange={onAttachmentBusyChange}
		/>
	);
}
