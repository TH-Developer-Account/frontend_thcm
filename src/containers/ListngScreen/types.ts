// types.ts (or same file)
export interface EPCRow {
  proposal_number: string;
  event_description: string;
  created_by: string;
  status: string;
  location: string;
  event_name: Record<string, string>;
}

export interface PaginationProps {
  pageIndex: number; // 0-based
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}
