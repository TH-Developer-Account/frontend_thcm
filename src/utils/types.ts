import type { TableUserStatus } from "../components/common/Badge";
import { status } from "../containers/ListngScreen/constant";

export interface TableUser {
	id: number;
	name: string;
	email: string;
	phone: string;
	company: string;
	role: string;
	status: TableUserStatus;
	avatar: string;
}

// types.ts (or same file)
type StatusKey = keyof typeof status;

// EPC Listing Table
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
