import type { GeoCoordinates } from "../../types/common.types";

const FRESH_FIX_TIMEOUT_MS = 8000;
const CACHED_POSITION_MAX_AGE_MS = 60000;

// Wraps navigator.geolocation so callers never touch the raw browser API.
// Isolates this project's settled policy: prefer a cached fix, fall back to a fresh one.
export async function requestCurrentLocation(): Promise<GeoCoordinates> {
  if (!("geolocation" in navigator)) {
    throw new Error("Location services are not available on this device.");
  }

  const position = await getCachedOrFreshPosition();

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyInMeters: position.coords.accuracy,
    capturedAt: position.timestamp,
  };
}

function getCachedOrFreshPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: FRESH_FIX_TIMEOUT_MS,
      maximumAge: CACHED_POSITION_MAX_AGE_MS,
    });
  });
}
