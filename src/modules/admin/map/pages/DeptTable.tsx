import DataTable from "../../../../components/ui/DataTable";
import { useEPC } from "../../../marketing/pages/EPCTable/context/useEPC";
import type { DepartmentRow } from "../types";
import { deptTableColumn } from "../utils/adminTableColumn";

const DeptTable = () => {
	const {
		data,
		sorting,
		setSorting,
		pageIndex,
		pageSize,
		setPageIndex,
		setPageSize,
		totalPages,
		loading,
	} = useEPC();

	return (
		<DataTable<DepartmentRow>
			data={data}
			columns={deptTableColumn}
			loading={loading}
			/* ------------------ Sorting ------------------ */
			sorting={sorting}
			onSortingChange={setSorting}
			manualSorting
			/* ---------------- Pagination ---------------- */
			manualPagination
			pageIndex={pageIndex}
			pageSize={pageSize}
			pageCount={totalPages}
			onPageChange={setPageIndex}
			onPageSizeChange={setPageSize}
			/* --------------- Optional UI ---------------- */
			scrollTargetId="tableScroll"
			emptyTitle="No EPC records found"
			emptyDescription="Try adjusting filters or search"
		/>
	);
};

export default DeptTable;
