import type { EpcFormValues } from "../../types/epc.types";

type MasterOption = {
  value: string;
  label: string;
  code?: string;
  [key: string]: unknown;
};

type EpcMasters = {
  regions?: MasterOption[];
  branches?: MasterOption[];
  // Division replaced Department as EPC's org-unit master. The form field
  // itself is still named/keyed "department" (see EpcFormFields.tsx and
  // EpcFormValues["department"]) — only the master list backing it moved
  // from the removed `departments` key to `divisions`.
  divisions?: MasterOption[];
  vertical?: MasterOption[];
  eventNames?: MasterOption[];
  budgetMasters?: MasterOption[];
};

export const generateEpcNo = (
  deptCode: string,
  branchCode: string,
  zoneCode: string,
  verticalCode: string,
) => {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const time = now
    .toLocaleTimeString("en-GB", { hour12: false })
    .replace(/:/g, "");

  return `${deptCode}/${verticalCode}/${zoneCode}/${branchCode}/${yyyy}${mm}${dd}${time}`;
};

const findOption = (options: MasterOption[] = [], value?: string | null) => {
  if (!value) return null;

  return (
    options.find(
      (option) =>
        option.value === value ||
        option.code === value ||
        option.label === value,
    ) ?? null
  );
};

// ✅ FIX (production bug — reference number showing a raw UUID for Division
// and the literal text "null" for Vertical): Division has no `code` column
// at all (only `name`), and Vertical's `code` is optional — EOR supplies
// none for most verticals, so it's `null` in the DB for them. The previous
// `String(option?.code || option?.value || "")` fell through to the raw id
// for Division (no code to prefer), and a bare `${vertical?.code}` elsewhere
// rendered the literal word "null" when code was present-but-null.
//
// Fix: when `code` is missing, derive a 4-letter code from the option's
// name/label instead of falling back to the id or leaking a literal "null" —
// same derivation `generateVendorOnboardingReferenceNumber` already uses for
// its vendor code in vendorOnboarding.helper.ts (letters only, uppercased,
// padded with X if the name is shorter than 4 letters). Branch/Zone, which
// do carry a real code, are unaffected — this only changes the fallback path.
const deriveCodeFromName = (name: string): string => {
  const letters = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters + "XXXX").slice(0, 4);
};

const getCode = (option?: MasterOption | null): string => {
  if (!option) return "";

  const code = option.code;
  if (code) return String(code).trim();

  const label = option.label;
  if (label) return deriveCodeFromName(String(label));

  // Last resort only — every master option should have a label; this just
  // avoids ever emitting "null"/"undefined" if one somehow doesn't.
  return String(option.value ?? "").trim();
};

export const buildEpcNoFromValues = (
  values: EpcFormValues,
  masters?: EpcMasters,
) => {
  const department = findOption(masters?.divisions, values.department);
  const branch = findOption(masters?.branches, values.branch);
  const region = findOption(masters?.regions, values.region);
  const vertical = findOption(masters?.vertical, values.vertical);

  const deptCode = getCode(department);
  const branchCode = getCode(branch);
  const zoneCode = getCode(region);
  const verticalCode = getCode(vertical);

  if (!deptCode || !branchCode || !zoneCode || !verticalCode) {
    return "";
  }

  return generateEpcNo(deptCode, branchCode, zoneCode, verticalCode);
};
