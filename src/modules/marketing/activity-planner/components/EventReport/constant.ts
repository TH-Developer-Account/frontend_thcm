export const MAX_IMAGES = 4;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const OUTCOME_OPTIONS = [
  { value: "", label: "Select outcome" },
  { value: "SUCCESSFUL", label: "Successful" },
  { value: "PARTIALLY_SUCCESSFUL", label: "Partially Successful" },
  { value: "UNSUCCESSFUL", label: "Unsuccessful" },
];

export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported image type. Use JPEG, PNG, or WebP`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `"${file.name}" exceeds the 5 MB limit`;
  }
  return null;
};
