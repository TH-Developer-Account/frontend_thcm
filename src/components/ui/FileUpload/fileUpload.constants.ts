import type { FileUploadKind } from "./fileUpload.types";

export const FILE_UPLOAD_LIMITS: Record<
  FileUploadKind,
  {
    maxSize: number;
    mimeTypes: string[];
    extensions?: string[];
    label: string;
  }
> = {
  image: {
    maxSize: 5 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/jpg", "image/png"],
    extensions: ["jpg", "jpeg", "png"],
    label: "JPEG, JPG or PNG",
  },

  pdf: {
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ["application/pdf"],
    extensions: ["pdf"],
    label: "PDF",
  },

  document: {
    maxSize: 10 * 1024 * 1024,
    mimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    extensions: ["pdf", "jpg", "jpeg", "png", "doc", "docx"],
    label: "PDF, image, DOC, or DOCX",
  },

  spreadsheet: {
    maxSize: 10 * 1024 * 1024,
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ],
    extensions: ["xlsx", "xls", "csv"],
    label: "XLSX, XLS, or CSV",
  },

  any: {
    maxSize: 10 * 1024 * 1024,
    mimeTypes: [],
    extensions: [],
    label: "file",
  },
  vendorDocument: {
    maxSize: 5 * 1024 * 1024,
    mimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    extensions: ["pdf", "jpg", "jpeg", "png"],
    label: "PDF, JPG, JPEG, or PNG files (max 5 MB)",
  },
  // Must match the backend multer filter for bill attachments
  // (mediclaim.validation.ts → BILL_ATTACHMENT_MIME_TYPES / 5 MB).
  mediclaimDocument: {
    maxSize: 5 * 1024 * 1024,
    mimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    extensions: ["pdf", "jpg", "jpeg", "png"],
    label: "PDF, JPG, JPEG, or PNG files (max 5 MB)",
  },
};
