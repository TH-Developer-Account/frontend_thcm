// components/common/DataTable.tsx

import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	flexRender,
	type ColumnDef,
	type SortingState,
	type OnChangeFn,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import Pagination from "../common/Pagination";

export interface UserTableProps<T extends object> {
	data: T[];
	columns: ColumnDef<T>[];
	loading?: boolean;

	sorting?: SortingState;
	onSortingChange?: OnChangeFn<SortingState>;
	manualSorting?: boolean;

	manualPagination?: boolean;
	pageIndex?: number;
	pageSize?: number;
	pageCount?: number;
	onPageChange?: (page: number) => void;
	onPageSizeChange?: (size: number) => void;

	className?: string;
}

function UserTable<T extends object>({
	data,
	columns,
	loading = false,
	sorting,
	onSortingChange,
	manualSorting = false,
	manualPagination = false,
	pageIndex = 0,
	pageSize = 10,
	pageCount = 0,
	onPageChange,
	onPageSizeChange,
	className = "",
}: UserTableProps<T>) {
	const table = useReactTable({
		data,
		columns,
		state: { sorting },
		onSortingChange,
		manualSorting,
		manualPagination,
		pageCount,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const rows = table.getRowModel().rows;

	return (
		<div
			className={`w-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col ${className}`}
		>
			<div className="flex-1 overflow-auto">
				<table className="w-full text-sm text-gray-800">
					<thead className="bg-gray-50 border-b border-gray-200">
						{table.getHeaderGroups().map((group) => (
							<tr key={group.id}>
								{group.headers.map((header) => {
									const isSorted = header.column.getIsSorted();

									return (
										<th
											key={header.id}
											onClick={
												header.column.getCanSort()
													? header.column.getToggleSortingHandler()
													: undefined
											}
											className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer"
										>
											<div className="flex items-center gap-1">
												{flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
												{isSorted === "asc" && (
													<ChevronUp size={14} className="text-orange-500" />
												)}
												{isSorted === "desc" && (
													<ChevronDown size={14} className="text-orange-500" />
												)}
											</div>
										</th>
									);
								})}
							</tr>
						))}
					</thead>

					<tbody>
						{loading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={i} className="border-b border-gray-100">
									<td colSpan={columns.length} className="px-6 py-4">
										<div className="h-4 w-full animate-pulse rounded bg-gray-200" />
									</td>
								</tr>
							))
						) : rows.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-6 py-10 text-center">
									<div className="text-gray-500 text-sm">No records found</div>
								</td>
							</tr>
						) : (
							rows.map((row) => (
								<tr
									key={row.id}
									className="border-b border-gray-100 hover:bg-gray-50 transition"
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-6 py-4 text-gray-700">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{manualPagination &&
				pageCount > 1 &&
				onPageChange &&
				onPageSizeChange && (
					<div className="border-t border-gray-200 bg-white px-6 py-3">
						<Pagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							totalPages={pageCount}
							onPageChange={onPageChange}
							onPageSizeChange={onPageSizeChange}
						/>
					</div>
				)}
		</div>
	);
}

export default UserTable;
