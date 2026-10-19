import React from "react";
import {
  useSubmitReportMutation,
  useResubmitReportMutation,
} from "./useEventReportMutations";
import type {
  EventReportDetail,
  EventReportFormConfig,
  EventReportImageSlot,
} from "./eventReport.types";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const revokeIfBlobUrl = (url: string): void => {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
};

const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported image type. Use JPEG, PNG, or WebP.`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `"${file.name}" exceeds the 5 MB limit.`;
  }
  return null;
};

// ── Builds initial slots from an existing report (resubmit/retry case), or
// an empty array for first-time submission. Existing images carry `id` and
// their signed `url` as `previewUrl` — no `file`, since nothing was
// re-picked yet. ─────────────────────────────────────────────────────────
const buildInitialSlots = (
  report: EventReportDetail | null | undefined,
): EventReportImageSlot[] => {
  if (!report) return [];

  return report.images
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      position: image.position,
      id: image.id,
      previewUrl: image.url,
      caption: image.caption ?? "",
    }));
};

type UseEventReportSubmitFormArgs = {
  epcId: string;
  formConfig: EventReportFormConfig | undefined;
  existingReport: EventReportDetail | null | undefined;
  mode: "create" | "resubmit" | "retry";
  onSuccess?: () => void | Promise<void>;
};

export function useEventReportSubmitForm({
  epcId,
  formConfig,
  existingReport,
  mode,
  onSuccess,
}: UseEventReportSubmitFormArgs) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const submitMutation = useSubmitReportMutation();
  const resubmitMutation = useResubmitReportMutation();
  const isSubmitting = submitMutation.isPending || resubmitMutation.isPending;

  const [slots, setSlots] = React.useState<EventReportImageSlot[]>(() =>
    buildInitialSlots(existingReport),
  );
  const [eventHighlights, setEventHighlights] = React.useState(
    existingReport?.eventHighlights ?? "",
  );
  // Every rejected file in one picked batch gets its own message, shown
  // together — picking 3 bad files at once surfaces all 3 reasons, not just
  // the last one processed.
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    return () => {
      slots.forEach((slot) => {
        if (slot.file) revokeIfBlobUrl(slot.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minImages = formConfig?.minImages ?? 1;
  const maxImages = formConfig?.maxImages ?? 10;
  const canAddMore = slots.length < maxImages;

  const openFilePicker = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesPicked = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (files.length === 0) return;

      const rejections: string[] = [];

      setSlots((prev) => {
        const remainingSlots = maxImages - prev.length;
        const filesToAdd = files.slice(0, remainingSlots);

        const newSlots: EventReportImageSlot[] = [];
        for (const file of filesToAdd) {
          const validationError = validateImageFile(file);
          if (validationError) {
            rejections.push(validationError);
            continue;
          }
          newSlots.push({
            position: prev.length + newSlots.length + 1,
            file,
            previewUrl: URL.createObjectURL(file),
            caption: "",
          });
        }

        return [...prev, ...newSlots];
      });

      setErrors(rejections);
    },
    [maxImages],
  );

  const removeSlot = React.useCallback((index: number) => {
    setSlots((prev) => {
      const target = prev[index];
      if (target?.file) revokeIfBlobUrl(target.previewUrl);

      // Renumber positions after removal so they stay contiguous —
      // matters for resubmit, where `position` is how the backend
      // matches a replacement image to an existing one.
      return prev
        .filter((_, i) => i !== index)
        .map((slot, i) => ({ ...slot, position: i + 1 }));
    });
  }, []);

  const updateCaption = React.useCallback((index: number, caption: string) => {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, caption } : slot)),
    );
  }, []);

  const validate = React.useCallback((): string | null => {
    if (slots.length < minImages) {
      return `Please upload at least ${minImages} photo${minImages === 1 ? "" : "s"}.`;
    }
    if (slots.length > maxImages) {
      return `You can upload at most ${maxImages} photos.`;
    }
    return null;
  }, [slots.length, minImages, maxImages]);

  const canSubmit =
    !isSubmitting && slots.length >= minImages && slots.length <= maxImages;

  const handleSubmit = React.useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setErrors([validationError]);
      return;
    }

    try {
      if (mode === "create") {
        await submitMutation.mutateAsync({
          epcId,
          images: slots.map((slot) => slot.file!), // every slot has a file on first submit
          captions: slots.map((slot) => slot.caption),
          eventHighlights,
        });
      } else {
        // Resubmit — covers both clarification-resubmit and generation-retry;
        // the backend (report.controller.ts resubmitReport) treats them
        // identically. Only send slots that got a new file picked — unchanged
        // slots are left alone entirely. A "plain retry" naturally produces
        // an empty images/positions/captions payload if the user didn't
        // touch any photo, so there's no need to special-case it — doing so
        // previously also dropped eventHighlights edits made during retry.
        const changedSlots = slots.filter((slot) => slot.file);
        await resubmitMutation.mutateAsync({
          epcId,
          images: changedSlots.map((slot) => slot.file!),
          positions: changedSlots.map((slot) => slot.position),
          captions: changedSlots.map((slot) => slot.caption),
          eventHighlights,
        });
      }

      setErrors([]);
      await onSuccess?.();
    } catch (err: any) {
      setErrors([
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit report.",
      ]);
    }
  }, [
    epcId,
    eventHighlights,
    mode,
    onSuccess,
    resubmitMutation,
    slots,
    submitMutation,
    validate,
  ]);

  return {
    slots,
    eventHighlights,
    setEventHighlights,
    errors,
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
  };
}
