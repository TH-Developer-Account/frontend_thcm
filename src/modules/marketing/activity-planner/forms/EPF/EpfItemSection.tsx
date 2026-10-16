import type { Dispatch, SetStateAction } from "react";

import type { LineItemOption } from "../../types/epc.types";
import {
  LINE_ITEM_ATTACHMENT_ACCEPT,
  LINE_ITEM_ATTACHMENT_MAX_SIZE_BYTES,
  OVERHEAD_COLUMNS,
} from "../../utils/constant";
import LineItemTable from "../../../shared/LineItemTable";
import { useUploadLineItemAttachmentMutation } from "../../queries/epf.queries";
import { useToast } from "../../../../../context/Auth/AuthContext";

type EpfItemsSectionProps = {
  items: LineItemOption[];
  onChange: Dispatch<SetStateAction<LineItemOption[]>>;
  options: LineItemOption[];
  isViewer?: boolean;
  /** Needed to scope the uploaded file's S3 key — omitted (new EPC not yet
   * saved) means the upload strategy is withheld and the picker falls
   * back to LineItemTable's plain blob-preview behaviour. */
  epcId?: string | null;
};

export default function EpfItemsSection({
  items,
  onChange,
  options,
  isViewer = false,
  epcId,
}: EpfItemsSectionProps) {
  const { showToast } = useToast();
  const uploadAttachmentMutation = useUploadLineItemAttachmentMutation();

  const attachmentUpload = epcId
    ? {
        accept: LINE_ITEM_ATTACHMENT_ACCEPT,
        maxSizeBytes: LINE_ITEM_ATTACHMENT_MAX_SIZE_BYTES,
        maxSizeLabel: "5MB",
        upload: (file: File) =>
          uploadAttachmentMutation.mutateAsync({ epcId, file }),
        onError: (message: string) =>
          showToast({
            type: "error",
            title: "Upload failed",
            description: message,
          }),
      }
    : undefined;

  return (
    <LineItemTable
      title="Event Cost Overheads"
      items={items}
      onChange={onChange}
      particularOptions={options}
      isViewer={isViewer}
      category="EVENT_OVERHEAD"
      columns={OVERHEAD_COLUMNS}
      attachmentUpload={attachmentUpload}
    />
  );
}
