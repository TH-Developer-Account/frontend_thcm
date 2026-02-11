// types.ts (or same file)
export interface EPCRow {
  company: string;
  domain: string;
  email: string;
  status: string;
  about: string;
}

export interface PaginationProps {
  pageIndex: number; // 0-based
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}
