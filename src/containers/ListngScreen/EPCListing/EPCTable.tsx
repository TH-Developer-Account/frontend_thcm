import { columns } from "./columns";
import { useEPC } from "../context/useEPC";
import type { EPCRow } from "../../../utils/types";
import DataTable from "../../../components/ui/DataTable";

const EPCTable = () => {
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
		<DataTable<EPCRow>
			data={data}
			columns={columns}
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

export default EPCTable;
