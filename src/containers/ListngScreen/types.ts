// types.ts (or same file)
export interface EPCRow {
  company: string;
  domain: string;
  email: string;
  status: string;
  about: string;
}

export type Status = "Done" | "In process" | "Pending";
