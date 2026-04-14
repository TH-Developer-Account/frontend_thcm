import { columns } from "./workflow.columns";
import DataTable from "../../../../components/ui/DataTable";
import type { WorkflowRow } from "../types/workflow.types";
import { useWorkflow } from "../context/useWorkflows";

const WorkflowTable = () => {
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
	} = useWorkflow();

	return (
		<DataTable<WorkflowRow>
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

export default WorkflowTable;
