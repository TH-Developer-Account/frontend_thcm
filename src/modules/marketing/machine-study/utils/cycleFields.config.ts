export type CycleFieldKey =
  | "sl"
  | "truckNumber"
  | "start"
  | "finish"
  | "bucketPasses"
  | "swingAngle"
  | "unladenWeight"
  | "ladenWeight"
  | "remarks";

// Canonical order — every consumer (template, guide, any future preview)
// renders columns in this order.
export const CYCLE_FIELD_ORDER: CycleFieldKey[] = [
  "sl",
  "truckNumber",
  "start",
  "finish",
  "bucketPasses",
  "swingAngle",
  "unladenWeight",
  "ladenWeight",
  "remarks",
];

export const CYCLE_FIELD_LABELS: Record<CycleFieldKey, string> = {
  sl: "Sl",
  truckNumber: "Truck Number",
  start: "Start (hh:mm:ss)",
  finish: "Finish (hh:mm:ss)",
  bucketPasses: "Bucket Passes (no.)",
  swingAngle: "Swing angle (degree)",
  unladenWeight: "Unladened Weight (kg)",
  ladenWeight: "Ladened Weight (kg)",
  remarks: "Remarks",
};

export const CYCLE_FIELD_REQUIRED: CycleFieldKey[] = [
  "sl",
  "start",
  "finish",
  "remarks",
];

type CycleFieldTemplateMeta = {
  width: number;
  format: string;
  notes: string;
};

// Mirrors lead.fieldConfig.ts's FIELD_TEMPLATE_META shape (width/format/notes)
// — no `example` here, since this template intentionally ships with no
// example row (headers only), unlike the Leads template.
export const CYCLE_FIELD_TEMPLATE_META: Record<
  CycleFieldKey,
  CycleFieldTemplateMeta
> = {
  sl: { width: 6, format: "Number", notes: "Sequential row number" },
  truckNumber: {
    width: 16,
    format: "Text",
    notes:
      'e.g. "Truck No 30" — required for Loading rows, leave blank for Material Preparation rows',
  },
  start: {
    width: 16,
    format: "Time",
    notes: "Elapsed time from start of study, e.g. 00:03:45",
  },
  finish: { width: 16, format: "Time", notes: "Must not be before Start" },
  bucketPasses: {
    width: 16,
    format: "Number",
    notes: "Number of bucket passes for this loading cycle",
  },
  swingAngle: {
    width: 16,
    format: "Text",
    notes: "A single value (e.g. 45) or a range (e.g. 90-120)",
  },
  unladenWeight: {
    width: 18,
    format: "Number",
    notes: "Required for Loading rows — truck weight before loading",
  },
  ladenWeight: {
    width: 18,
    format: "Number",
    notes:
      "Required for Loading rows — truck weight after loading, must not be less than Unladened Weight",
  },
  remarks: {
    width: 20,
    format: "Text — exact values only",
    notes:
      'Must be exactly "Loading" or "Material Preparation" (case-insensitive, no other values accepted)',
  },
};

export const orderCycleFields = (fields: CycleFieldKey[]): CycleFieldKey[] =>
  CYCLE_FIELD_ORDER.filter((field) => fields.includes(field));
