import * as XLSX from "xlsx";

import {
  FIELD_LABELS,
  FIELD_TEMPLATE_META,
  orderFields,
  REQUIRED_FIELDS,
} from "../helpers/lead.fieldConfig";
import type { LeadFormFieldKey } from "../types/leads.types";

// ─────────────────────────────────────────────────────────────────────────────
// Builds and downloads a lead-import Excel template scoped to the current
// event's variant — Import Data + Field Guide sheets, matching the original
// two-sheet structure, but columns now driven by `fields` instead of a
// fixed 4-column set. Header labels match FIELD_LABELS, and column order
// matches orderFields — the same source LeadExcelPreview and LeadEntryTable
// read from, so the downloaded template, the animated preview, and the
// entry form never disagree on column order or naming.
// ─────────────────────────────────────────────────────────────────────────────

export function downloadLeadImportTemplate(fields: LeadFormFieldKey[]) {
  const orderedFields = orderFields(fields);
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Import Data ──────────────────────────────────
  const headers = orderedFields.map((field) => FIELD_LABELS[field]);
  const examples = orderedFields.map(
    (field) => FIELD_TEMPLATE_META[field].example,
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, examples]);
  ws["!cols"] = orderedFields.map((field) => ({
    wch: FIELD_TEMPLATE_META[field].width,
  }));

  XLSX.utils.book_append_sheet(wb, ws, "Import Data");

  // ── Sheet 2: Field Guide ──────────────────────────────────
  const guideRows: string[][] = [
    ["Field", "Format", "Required", "Notes"],
    ...orderedFields.map((field) => [
      FIELD_LABELS[field],
      FIELD_TEMPLATE_META[field].format,
      REQUIRED_FIELDS.includes(field) ? "Yes" : "No",
      FIELD_TEMPLATE_META[field].notes,
    ]),
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide["!cols"] = [
    { wch: 22 }, // Field
    { wch: 18 }, // Format
    { wch: 12 }, // Required
    { wch: 40 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, wsGuide, "Field Guide");

  // ── Download ──────────────────────────────────────────────
  XLSX.writeFile(wb, "lead-import-template.xlsx");
}
