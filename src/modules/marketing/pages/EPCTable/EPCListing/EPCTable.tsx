import React from "react";
import { useNavigate } from "react-router-dom";
import { getEPCColumns } from "./columns";
import { useEPC } from "../../../context/useEPC";
import type { EPCRow } from "../../../../../utils/types";
import DataTable from "../../../../../components/ui/DataTable";

const EPCTable = () => {
	const navigate = useNavigate();

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

	const columns = React.useMemo(
		() =>
			getEPCColumns({
				onLeadCreate: (row: EPCRow) => {
					const leadInfo = {
						epcId: row.id,
						leadId: row.lead_id || null,
						proposalNumber: row.proposal_number,
						eventName: row.event_name,
						location: row.location,
						status: row.status,
						createdBy: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
					};

					navigate(`/marketing/leads/create`, {
						state: {
							leadInfo,
						},
					});
				},
			}),
		[navigate],
	);

	return (
		<DataTable<EPCRow>
			data={data}
			columns={columns}
			loading={loading}
			sorting={sorting}
			onSortingChange={setSorting}
			manualSorting
			manualPagination
			pageIndex={pageIndex}
			pageSize={pageSize}
			pageCount={totalPages}
			onPageChange={setPageIndex}
			onPageSizeChange={setPageSize}
			scrollTargetId="tableScroll"
			emptyTitle="No EPC records found"
			emptyDescription="Try adjusting filters or search"
		/>
	);
};

export default EPCTable;
