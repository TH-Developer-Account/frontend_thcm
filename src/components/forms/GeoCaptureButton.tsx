import { useEffect, useState } from "react";
import {
  Camera,
  MapPin,
  MapPinOff,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  useGeoTaggedCapture,
  submitCapture,
} from "../../hooks/useGeoTaggedCapture";

export function GeoCaptureButton() {
  const { state, startCapture, reset } = useGeoTaggedCapture();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.status !== "captured") {
      return;
    }

    const photo = state.payload.photo;
    const url = URL.createObjectURL(photo);
    setPhotoPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [state.status === "captured" ? state.payload.photo : null]);

  async function handleSubmit() {
    if (state.status !== "captured") return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await submitCapture(state.payload);

    setIsSubmitting(false);

    if (result.success) {
      reset();
    } else {
      setSubmitError(result.errorMessage ?? "Upload failed.");
    }
  }

  if (state.status === "idle") {
    return (
      <button
        type="button"
        onClick={startCapture}
        className="flex flex-col items-center justify-center gap-2 w-full py-6 sm:py-8 min-h-[44px] border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 active:bg-orange-100 transition-colors"
      >
        <span className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-100 text-orange-600">
          <Camera size={22} strokeWidth={2} />
        </span>
        <span className="text-sm font-medium text-gray-700 text-center px-4">
          Capture photo with location
        </span>
      </button>
    );
  }

  if (state.status === "capturingPhoto") {
    return (
      <StatusPanel
        icon={<Camera size={28} />}
        label="Opening camera…"
        tone="neutral"
      />
    );
  }

  if (state.status === "awaitingLocation") {
    return (
      <StatusPanel
        icon={<Loader2 size={28} className="animate-spin" />}
        label="Confirming location…"
        tone="neutral"
      />
    );
  }

  if (state.status === "locationDenied") {
    return (
      <StatusPanel
        icon={<MapPinOff size={28} />}
        label={state.reason}
        tone="error"
      >
        <button
          type="button"
          onClick={reset}
          className="mt-3 min-h-[44px] px-4 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Try again
        </button>
      </StatusPanel>
    );
  }

  if (state.status === "captured") {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {photoPreviewUrl && (
          <img
            src={photoPreviewUrl}
            alt="Captured claim evidence"
            className="w-full h-40 sm:h-48 object-cover"
          />
        )}
        <div className="p-3 flex items-center gap-2 text-sm text-gray-600 border-t border-gray-100">
          <MapPin size={16} className="shrink-0" />
          <span className="truncate">
            {state.payload.coordinates.latitude.toFixed(5)},{" "}
            {state.payload.coordinates.longitude.toFixed(5)}
          </span>
        </div>

        {submitError && (
          <p className="px-3 pb-2 text-sm text-red-600">{submitError}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 p-3 pt-0">
          <button
            type="button"
            onClick={reset}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Retake
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <StatusPanel
        icon={<AlertTriangle size={28} />}
        label={state.reason}
        tone="error"
      >
        <button
          type="button"
          onClick={reset}
          className="mt-3 min-h-[44px] px-4 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Retake
        </button>
      </StatusPanel>
    );
  }

  return null;
}

// Shared layout for transient/error states — avoids repeating the same
// icon+label+spacing structure across capturingPhoto, awaitingLocation,
// locationDenied, and error.
function StatusPanel({
  icon,
  label,
  tone,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "neutral" | "error";
  children?: React.ReactNode;
}) {
  const toneClasses =
    tone === "error" ? "text-red-600 bg-red-50" : "text-gray-500 bg-gray-50";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 w-full py-6 sm:py-8 rounded-lg ${toneClasses}`}
    >
      {icon}
      <span className="text-sm font-medium text-center px-4">{label}</span>
      {children}
    </div>
  );
}
