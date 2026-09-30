export type TableUserStatus = "Active" | "Blocked" | "Inactive";

export interface TableUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  status: string;
  avatar: string;
}
export const statusStyles: Record<TableUserStatus, string> = {
  Active: "bg-green-100 text-green-700",
  // active: "bg-green-100 text-green-700",
  Inactive: "bg-amber-100 text-amber-700",
  // inactive: "bg-amber-100 text-amber-700",
  Blocked: "bg-red-100 text-red-600",
  // blocked: "bg-red-100 text-red-600",
};
// utils/types/api.types.ts

export type ApiErrorResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
};

export type EventDeviationPayload =
  | {
      status: string;
      reason: string;
    }
  | FormData;

export type CaptureState =
  | { status: "idle" }
  | { status: "requestingPermission" }
  | { status: "capturingPhoto" }
  | { status: "awaitingLocation"; photo: File }
  | { status: "captured"; payload: CapturePayload }
  | { status: "locationDenied"; reason: string }
  | { status: "error"; reason: string };

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracyInMeters: number;
  capturedAt: number;
}

export interface CapturePayload {
  photo: File;
  coordinates: GeoCoordinates;
}

export interface SubmitCaptureResult {
  success: boolean;
  errorMessage?: string;
}
