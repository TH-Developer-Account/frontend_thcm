// Wraps the native file-picker camera capture (option A: <input capture>).
// Kept as its own adapter so a future switch to getUserMedia only touches this file.
export function createCameraCaptureInput(
  onPhotoSelected: (file: File) => void,
  onCancelled: () => void,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment";
  // Some mobile browsers only reliably fire the picker/change flow for inputs
  // attached to the DOM; keeping it invisible avoids any layout impact.
  input.style.display = "none";

  input.addEventListener("change", () => {
    const selectedFile = input.files?.[0];
    if (selectedFile) {
      onPhotoSelected(selectedFile);
    } else {
      onCancelled();
    }
    removeCameraCaptureInput(input);
  });

  document.body.appendChild(input);
  return input;
}

export function triggerCameraCapture(input: HTMLInputElement): void {
  input.click();
}

export function removeCameraCaptureInput(input: HTMLInputElement | null): void {
  if (input && input.parentNode) {
    input.parentNode.removeChild(input);
  }
}
