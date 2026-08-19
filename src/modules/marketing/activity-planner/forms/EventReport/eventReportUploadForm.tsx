import { Plus, Send, Upload, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import TextareaInput from "../../../../../components/forms/TextareaInput";
import FormInput from "../../../../../components/forms/FormInput";

import { useEventReportSubmitForm } from "./useEventReportSubmitForm";
import type {
  EventReportDetail,
  EventReportFormConfig,
} from "./eventReport.types";

type EventReportUploadFormProps = {
  epcId: string;
  formConfig: EventReportFormConfig | undefined;
  existingReport: EventReportDetail | null | undefined;
  mode: "create" | "resubmit" | "retry";
  onBack: () => void;
  onSuccess?: () => void | Promise<void>;
};

const EventReportUploadForm = ({
  epcId,
  formConfig,
  existingReport,
  mode,
  onBack,
  onSuccess,
}: EventReportUploadFormProps) => {
  const {
    slots,
    eventHighlights,
    setEventHighlights,
    error,
    fileInputRef,
    minImages,
    maxImages,
    canAddMore,
    canSubmit,
    isSubmitting,
    openFilePicker,
    handleFilesPicked,
    removeSlot,
    updateCaption,
    handleSubmit,
  } = useEventReportSubmitForm({
    epcId,
    formConfig,
    existingReport,
    mode,
    onSuccess,
  });

  return (
    <div>
      <div>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Photo Evidence
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Upload{" "}
              {minImages === maxImages
                ? minImages
                : `${minImages}–${maxImages}`}{" "}
              event photos with captions
            </p>
          </div>

          <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
            {slots.length}/{maxImages} Uploaded
          </div>
        </div>

        <div className="p-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFilesPicked}
          />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {slots.map((slot, index) => (
              <div
                key={slot.id ?? `new-${index}`}
                className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2"
              >
                <div className="group relative h-[140px] overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={slot.previewUrl}
                    alt={slot.caption || `Event photo ${slot.position}`}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition hover:bg-white"
                    title="Remove photo"
                    disabled={isSubmitting}
                  >
                    <X className="h-3.5 w-3.5 text-gray-700" />
                  </button>

                  <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                    Photo {slot.position}
                  </div>
                </div>

                <FormInput
                  placeholder="Add a caption"
                  value={slot.caption}
                  disabled={isSubmitting}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateCaption(index, event.target.value)
                  }
                />
              </div>
            ))}

            {canAddMore ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openFilePicker();
                }}
                disabled={isSubmitting}
                className="group relative h-[188px] overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/40"
              >
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-105">
                    {slots.length === 0 ? (
                      <Upload className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Plus className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <span className="mt-3 text-sm font-medium text-gray-600">
                    Add Photo
                  </span>
                </div>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Event Highlights
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Add a short summary of how the event went
          </p>
        </div>

        <div className="p-5">
          <TextareaInput
            label="Event Highlights"
            name="eventHighlights"
            rows={4}
            placeholder="Enter overall event outcome, customer response, dealer feedback, conversions, challenges, etc."
            value={eventHighlights}
            disabled={isSubmitting}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setEventHighlights(event.target.value)
            }
          />
        </div>
      </div>

      {error ? (
        <div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-1 pt-4">
        <Button
          appearance="standard"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          size="sm"
          Icon={X}
          text="Cancel"
        />

        <Button
          onClick={handleSubmit}
          appearance="standard"
          variant="brand"
          size="sm"
          disabled={!canSubmit}
          Icon={Send}
          text={
            isSubmitting
              ? "Submitting..."
              : mode === "retry"
                ? "Retry Generation"
                : "Submit Report"
          }
        />
      </div>
    </div>
  );
};

export default EventReportUploadForm;
