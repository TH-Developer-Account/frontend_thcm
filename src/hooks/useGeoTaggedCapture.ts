import { useCallback, useRef, useState } from "react";
import { requestCurrentLocation } from "../components/adapters/locationAdapter";
import {
  createCameraCaptureInput,
  triggerCameraCapture,
  removeCameraCaptureInput,
} from "../components/adapters/cameraAdapter";
import type {
  CaptureState,
  GeoCoordinates,
  SubmitCaptureResult,
  CapturePayload,
} from "../types/common.types";

const CAPTURE_UPLOAD_ENDPOINT = "/api/captures";

// Camera and location are requested in parallel: browsers only allow the native
// picker to open synchronously within a user gesture, so we cannot await location
// first without losing that activation. Whichever resolves first waits briefly
// for the other; a location failure discards any photo already taken (retake
// from scratch is the settled policy).
export function useGeoTaggedCapture() {
  const [state, setState] = useState<CaptureState>({ status: "idle" });
  const capturedPhotoRef = useRef<File | null>(null);
  const resolvedCoordinatesRef = useRef<GeoCoordinates | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const reset = useCallback(() => {
    removeCameraCaptureInput(cameraInputRef.current);
    cameraInputRef.current = null;
    capturedPhotoRef.current = null;
    resolvedCoordinatesRef.current = null;
    setState({ status: "idle" });
  }, []);

  const tryFinalizeCapture = useCallback(() => {
    const photo = capturedPhotoRef.current;
    const coordinates = resolvedCoordinatesRef.current;

    if (photo && coordinates) {
      setState({ status: "captured", payload: { photo, coordinates } });
    } else if (photo && !coordinates) {
      setState({ status: "awaitingLocation", photo });
    }
    // If only coordinates are ready, stay in capturingPhoto — nothing to show yet.
  }, []);

  const startCapture = useCallback(() => {
    capturedPhotoRef.current = null;
    resolvedCoordinatesRef.current = null;
    setState({ status: "capturingPhoto" });

    // Fired synchronously in the click handler so the picker actually opens.
    cameraInputRef.current = createCameraCaptureInput(
      (photo) => {
        capturedPhotoRef.current = photo;
        tryFinalizeCapture();
      },
      () => {
        reset();
      },
    );
    triggerCameraCapture(cameraInputRef.current);

    // Runs independently of the camera; does not block input.click() above.
    requestCurrentLocation()
      .then((coordinates) => {
        resolvedCoordinatesRef.current = coordinates;
        tryFinalizeCapture();
      })
      .catch((error) => {
        setState({
          status: "locationDenied",
          reason:
            error instanceof Error ? error.message : "Location access failed.",
        });
        removeCameraCaptureInput(cameraInputRef.current);
        cameraInputRef.current = null;
        capturedPhotoRef.current = null;
      });
  }, [reset, tryFinalizeCapture]);

  return { state, startCapture, reset };
}

// Kept separate from useGeoTaggedCapture: upload is a networking concern with its own
// failure modes, and this is the seam where offline queueing will plug in later.
export async function submitCapture(
  payload: CapturePayload,
): Promise<SubmitCaptureResult> {
  const formData = new FormData();
  formData.append("photo", payload.photo);
  formData.append("latitude", String(payload.coordinates.latitude));
  formData.append("longitude", String(payload.coordinates.longitude));
  formData.append(
    "accuracyInMeters",
    String(payload.coordinates.accuracyInMeters),
  );
  formData.append("capturedAt", String(payload.coordinates.capturedAt));

  try {
    const response = await fetch(CAPTURE_UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        errorMessage: `Upload failed with status ${response.status}.`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : "Upload failed.",
    };
  }
}
