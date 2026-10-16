import * as XLSX from "xlsx";

import {
  CYCLE_FIELD_LABELS,
  CYCLE_FIELD_ORDER,
  CYCLE_FIELD_REQUIRED,
  CYCLE_FIELD_TEMPLATE_META,
} from "./cycleFields.config";

// ─────────────────────────────────────────────────────────────────────────────
// Builds and downloads a blank truck-cycle Excel template — Import Data +
// Field Guide sheets, matching the exact same two-sheet pattern as
// generateImportTemplate.ts (Leads). Headers only, no example row, since
// Time Taken and Payload are computed backend-side (not input columns) and
// the field team fills this in directly from a stopwatch/weighbridge, not
// from a worked example.
//
// No in-cell dropdown on Remarks — xlsx (SheetJS) community edition can't
// write data validation. The Field Guide sheet documents the exact allowed
// values; machineStudyCycleImport.services.ts enforces them strictly at
// import time with a clear per-row error if violated.
// ─────────────────────────────────────────────────────────────────────────────

export function downloadMachineStudyCycleTemplate(): void {
  const orderedFields = CYCLE_FIELD_ORDER;
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Import Data — headers only, no example row ────────────────
  const headers = orderedFields.map((field) => CYCLE_FIELD_LABELS[field]);

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  ws["!cols"] = orderedFields.map((field) => ({
    wch: CYCLE_FIELD_TEMPLATE_META[field].width,
  }));

  XLSX.utils.book_append_sheet(wb, ws, "Import Data");

  // ── Sheet 2: Field Guide ──────────────────────────────────
  const guideRows: string[][] = [
    ["Field", "Format", "Required", "Notes"],
    ...orderedFields.map((field) => [
      CYCLE_FIELD_LABELS[field],
      CYCLE_FIELD_TEMPLATE_META[field].format,
      CYCLE_FIELD_REQUIRED.includes(field) ? "Yes" : "No",
      CYCLE_FIELD_TEMPLATE_META[field].notes,
    ]),
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide["!cols"] = [
    { wch: 22 }, // Field
    { wch: 22 }, // Format
    { wch: 12 }, // Required
    { wch: 55 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, wsGuide, "Field Guide");

  // ── Download ──────────────────────────────────────────────
  XLSX.writeFile(wb, "machine-study-cycle-template.xlsx");
}
