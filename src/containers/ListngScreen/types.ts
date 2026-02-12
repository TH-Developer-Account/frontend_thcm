import { status } from "./constant";
// types.ts (or same file)
type StatusKey = keyof typeof status;

export interface EPCRow {
  proposal_number: string;
  event_description: string;
  created_by: string;
  status: StatusKey;
  location: string;
  event_name: string;
  first_name: string;
  last_name: string;
}

export interface PaginationProps {
  pageIndex: number; // 0-based
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}
