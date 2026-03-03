export function mapHeader(key: string, map?: Record<string, string>) {
  if (map?.[key]) return map[key];

  return key.replace(/^T/, "").replace(/^C/, "").replace(/_/g, " ").trim();
}

export function normalizeSapRow(row: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};

  for (const key in row) {
    if (key === "__metadata") continue;

    const value = row[key];

    if (typeof value === "string") {
      const match = /\/Date\((\d+)\)\//.exec(value);
      cleaned[key] = match
        ? new Date(Number(match[1])).toLocaleDateString()
        : value;
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

export const bydEmployeeColumnMap: Record<string, string> = {
  CCOMPANY_UUID: "Company",
  TCOMPANY_UUID: "Company Name",
  CEMPLOYEE_UUID: "Employee ID",
  TEMPLOYEE_UUID: "Full Name",
  CY4M9FABQY_37FB16C540: "Manager Code",
  Cs1ANsDEEFA17BFFCF618: "Designation",
  Ts1ANs6AE1BC19D4E7A30: "Vertical",
  Ts1ANs188C5F1E104E8F1: "Designation",
  Ts1ANsB16243B33AE70B6: "Department",
  Ts1ANs564DE5EF7E2FC4D: "Employee Status",
  CWA_START_DATE: "Date of Joining",
  CEE_PRIV_MOBILE: "Mobile No",
  CEE_PRIV_MAIL: "Email",
  Ts1ANsE819527096E9697: "Staff",
  Ts1ANsA4889B6AD57D2F6: "Organization",
  CWA_END_DATE: "Employee Last Date",
  Ts1ANs627E6567A30CCE2: "Area",
  Ts1ANsE1AB739751277B4: "Zone",
};

export const c4cEmployeeColumnMap: Record<string, string> = {
  CEE_UUID: "Employee ID",
  CEE_GIVEN_NAME: "First Name",
  CEE_FAMILY_NAME: "Last Name",
  CWRKADRS_EMAIL: "Email",
  CWRKADRS_FRM_MOBILE: "Mobile",
  TSTAFFED_OC_UUID: "Department",
  TRESP_MANAGER_UUID: "Manager Name",
  CRESP_MANAGER_UUID: "Manager Code",
  CEMPL_TYPE_START_DATE: "Date of Joining",
  CEMPL_TYPE_END_DATE: "Employee Last Date",
  TJOB_UUID: "Designation",
};
