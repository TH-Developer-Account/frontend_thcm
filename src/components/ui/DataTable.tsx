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

export interface DataTableProps<T extends object> {
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

	emptyTitle?: string;
	emptyDescription?: string;
	scrollTargetId?: string;
	className?: string;
}

function DataTable<T extends object>({
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

	emptyTitle = "No records found",
	emptyDescription = "Try adjusting filters or search",
	scrollTargetId = "tableScroll",
	className = "",
}: DataTableProps<T>) {
	const table = useReactTable({
		data,
		columns,

		state: {
			sorting,
		},

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
			className={`w-full h-full rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col ${className}`}
		>
			{/* Scrollable Table Area */}
			<div className="flex-1 min-h-0 overflow-auto">
				<table
					className="min-w-[800px] w-full text-sm text-black  text-left "
					id={scrollTargetId}
				>
					{/* Header */}
					<thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
						{table.getHeaderGroups().map((group) => (
							<tr
								key={group.id}
								className="bg-[var(--color-brand)] text-[var(--color-white)] text-sm"
							>
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
											className={`relative px-3 py-2 text-left font-semibold tracking-wide select-none
												${header.column.getCanSort() ? "cursor-pointer" : "cursor-default"}`}
										>
											<div className="flex items-center gap-1 text-sm">
												{flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}

												{isSorted === "asc" && (
													<ChevronUp size={14} className="text-[#f35a00]" />
												)}
												{isSorted === "desc" && (
													<ChevronDown size={14} className="text-[#f35a00]" />
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
							Array.from({ length: pageSize }).map((_, i) => (
								<tr key={i} className="border-b border-gray-100">
									<td colSpan={columns.length} className="px-2 py-2">
										<div className="h-4 w-full animate-pulse rounded bg-gray-200" />
									</td>
								</tr>
							))
						) : rows.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="px-3 py-4 text-gray-500"
								>
									<div className="flex flex-col items-centergap-2">
										<div className="text-sm font-medium">{emptyTitle}</div>
										<div className="text-xs text-gray-400">
											{emptyDescription}
										</div>
									</div>
								</td>
							</tr>
						) : (
							rows.map((row, index) => (
								<tr
									key={row.id}
									className={`border-b border-gray-100 transition hover:bg-gray-50
									${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-2 py-3 text-gray-700">
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

			{/* Pagination - Always Visible */}
			{manualPagination &&
				pageCount >= 1 &&
				onPageChange &&
				onPageSizeChange && (
					<div className="flex-shrink-0 border-t border-gray-100 bg-gray-100 ">
						<div className="flex justify-center items-center">
							<Pagination
								pageIndex={pageIndex}
								pageSize={pageSize}
								totalPages={pageCount}
								onPageChange={onPageChange}
								onPageSizeChange={onPageSizeChange}
								scrollTargetId={scrollTargetId}
							/>
						</div>
					</div>
				)}
		</div>
	);
}

export default DataTable;
