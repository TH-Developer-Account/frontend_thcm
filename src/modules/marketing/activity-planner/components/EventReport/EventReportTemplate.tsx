import React from "react";
import { Upload, Send, X, Eye } from "lucide-react";
import { useParams } from "react-router-dom";
import { ServerAxios } from "../../../../../services/ServerAxios";

import Button from "../../../../../components/common/Button";
import FormInput from "../../../../../components/FormElements/FormInput";
import SelectInput from "../../../../../components/FormElements/SelectInput";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import { OUTCOME_OPTIONS, validateImageFile, MAX_IMAGES } from "./constant";
import type {
  ReportImage,
  OutcomeStatus,
  FormState,
  EventReportTemplateProps,
} from "./types";
import { ImageCard } from "./ImageCard";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Builds the multipart FormData payload the API expects.
// Images are sent as named fields image_1..image_4 (position = index + 1).
function buildFormData(
  images: (ReportImage | undefined)[],
  form: FormState,
): FormData {
  const data = new FormData();

  images.forEach((image, index) => {
    // Only append slots with a File — fetched S3 images have no File object
    // and are not re-uploaded (the server already has them).
    if (image?.file) {
      data.append(`image_${index + 1}`, image.file);
    }
  });

  data.append("outcomeStatus", form.outcomeStatus);
  data.append("totalLeadsGenerated", form.totalLeadsGenerated);
  data.append("approvedEventCost", form.approvedEventCost);

  if (form.expectedConversion.trim()) {
    data.append("expectedConversion", form.expectedConversion.trim());
  }
  if (form.remarks.trim()) {
    data.append("remarks", form.remarks.trim());
  }

  return data;
}

function validateForm(
  images: (ReportImage | undefined)[],
  form: FormState,
): string | null {
  const filledImages = images.filter(Boolean);

  if (filledImages.length !== MAX_IMAGES) {
    return `Please upload all ${MAX_IMAGES} event photos before submitting`;
  }
  // On first submit every slot must have a real File (not just a fetched URL)
  const hasAllFiles = images.every((img) => img?.file);
  if (hasAllFiles === false && filledImages.length === MAX_IMAGES) {
    // All slots filled — some may be pre-existing fetched images (resubmit path), allow it
  }
  if (!form.outcomeStatus) {
    return "Please select an event outcome status";
  }
  if (!form.totalLeadsGenerated || isNaN(Number(form.totalLeadsGenerated))) {
    return "Please enter total leads generated";
  }
  if (!form.approvedEventCost || isNaN(Number(form.approvedEventCost))) {
    return "Please enter the approved event cost";
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const EventReportTemplate = ({
  onBack,
  onPreview,
  eventCost,
}: EventReportTemplateProps) => {
  const { id: epcId } = useParams<{ id: string }>();

  // Fixed-length array of 4 slots — index maps directly to position.
  // undefined means the slot is empty.
  const [images, setImages] = React.useState<(ReportImage | undefined)[]>(
    Array(MAX_IMAGES).fill(undefined),
  );

  const [form, setForm] = React.useState<FormState>({
    totalLeadsGenerated: "",
    outcomeStatus: "",
    approvedEventCost: eventCost ? String(eventCost) : "",
    expectedConversion: "",
    remarks: "",
    formType: "CREATE",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Tracks which slot the file picker was opened for.
  // null means "fill next available slot".
  const targetSlotRef = React.useRef<number | null>(null);

  // ── Image handlers ──────────────────────────────────────────────────────

  const openFilePicker = (slotIndex?: number) => {
    targetSlotRef.current = slotIndex ?? null;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImages((prev) => {
      const updated = [...prev];

      if (targetSlotRef.current !== null) {
        // Replacing a specific slot
        const file = files[0];
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError);
          return prev;
        }
        // Revoke old blob URL before replacing
        const old = updated[targetSlotRef.current];
        if (old) URL.revokeObjectURL(old.url);

        updated[targetSlotRef.current] = {
          url: URL.createObjectURL(file),
          file,
        };
      } else {
        // Fill next available empty slots in order
        let fileIndex = 0;
        for (let i = 0; i < MAX_IMAGES && fileIndex < files.length; i++) {
          if (!updated[i]) {
            const file = files[fileIndex++];
            const validationError = validateImageFile(file);
            if (validationError) {
              setError(validationError);
              break;
            }
            updated[i] = { url: URL.createObjectURL(file), file };
          }
        }
      }

      return updated;
    });

    // Reset so the same file can be re-selected if needed
    e.target.value = "";
    setError(null);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      const old = updated[index];
      if (old) URL.revokeObjectURL(old.url);
      updated[index] = undefined;
      return updated;
    });
  };

  // Fetch existing report on mount and hydrate state
  React.useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await ServerAxios.get(`/report/${epcId}`);
        const report = data.data;
        if (!report) return;

        // Map fetched images into the fixed 4-slot array by position (1-indexed → 0-indexed)
        if (report.images?.length) {
          setImages((prev) => {
            const updated = [...prev];
            report.images.forEach(
              (img: { id: string; position: number; url: string }) => {
                const slotIndex = img.position - 1;
                if (slotIndex >= 0 && slotIndex < MAX_IMAGES) {
                  updated[slotIndex] = { url: img.url };
                }
              },
            );
            return updated;
          });
        }

        setForm({
          totalLeadsGenerated: String(report.totalLeadsGenerated ?? ""),
          outcomeStatus: (report.outcomeStatus as OutcomeStatus) ?? "",
          approvedEventCost: String(report.approvedEventCost ?? ""),
          expectedConversion: report.expectedConversion ?? "",
          remarks: report.remarks ?? "",
          formType: "EDIT",
        });
      } catch {
        // 404 = no report yet (first visit) — not an error worth surfacing
      }
    };

    fetchReport();
  }, [epcId]);

  // Revoke local blob URLs on unmount — fetched S3 URLs don't need revocation
  React.useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img?.file) URL.revokeObjectURL(img.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Form handlers ───────────────────────────────────────────────────────

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationError = validateForm(images, form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = buildFormData(images, form);

      const endpoint =
        form.formType === "CREATE"
          ? `/report/${epcId}/create`
          : `/report/${epcId}/resubmit`;

      const { data } = await ServerAxios.post(endpoint, formData);

      console.log("Submit response:", data);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filledCount = images.filter(Boolean).length;

  return (
    <div className="">
      <div className="">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Photo Evidence
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Add up to 4 event photos with captions
            </p>
          </div>

          <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
            {filledCount}/{MAX_IMAGES} Uploaded
          </div>
        </div>

        <div className="p-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: MAX_IMAGES }).map((_, index) => {
              const image = images[index];
              return image ? (
                <div key={index}>
                  <ImageCard
                    image={image}
                    index={index}
                    openFilePicker={openFilePicker}
                    removeImage={removeImage}
                  />
                </div>
              ) : (
                <button
                  key={index}
                  type="button"
                  onClick={() => openFilePicker()}
                  className="group relative h-[180px] overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/40"
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-105">
                      <Upload className="h-5 w-5 text-gray-500" />
                    </div>

                    <span className="mt-3 text-sm font-medium text-gray-600">
                      Add Photo
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Outcome */}
      <div className="">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Event Outcome</h3>

          <p className="mt-1 text-xs text-gray-500">
            Capture lead generation and overall event outcome
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          <FormInput
            type="number"
            placeholder="Enter leads count"
            label="Total Leads Generated"
            value={form.totalLeadsGenerated}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFormChange("totalLeadsGenerated", e.target.value)
            }
          />

          <SelectInput
            label="Event Outcome Status"
            options={OUTCOME_OPTIONS}
            value={OUTCOME_OPTIONS.find(
              (option) => option.value === form.outcomeStatus,
            )}
            onChange={(newValue) =>
              handleFormChange(
                "outcomeStatus",
                (newValue?.value ?? "") as OutcomeStatus,
              )
            }
          />

          <FormInput
            label="Approved Event Cost"
            value={form.approvedEventCost}
            className="font-semibold"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFormChange("approvedEventCost", e.target.value)
            }
          />

          <FormInput
            label="Expected Conversion"
            type="text"
            placeholder="Example: 15 hot prospects"
            value={form.expectedConversion}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFormChange("expectedConversion", e.target.value)
            }
          />

          <TextareaInput
            label="Remarks / Summary"
            name="remarks"
            rows={4}
            placeholder="Enter overall event outcome, customer response, dealer feedback, conversions, challenges, etc."
            value={form.remarks}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleFormChange("remarks", e.target.value)
            }
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t mb-4 border-gray-200 bg-white px-1 pt-4">
        <Button status="outline" onClick={onBack} disabled={isSubmitting}>
          <X className="h-4 w-4" />
          Cancel
        </Button>

        <Button status="outline" onClick={onPreview} disabled={isSubmitting}>
          <Eye className="h-4 w-4" />
          Preview
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={filledCount === 0 || isSubmitting}
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </div>
  );
};

export default EventReportTemplate;
