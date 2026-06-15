import React from "react";

import DataTable from "../../../../../components/ui/DataTable";
import { getLeadCustomerColumns } from "../columns/leadCustomerColumns";
import type { LeadRow } from "../types/leads.types";

type LeadsTableProps = {
	leads: LeadRow[];
	loading?: boolean;
};

const LeadsTable = ({ leads, loading = false }: LeadsTableProps) => {
	const columns = React.useMemo(() => getLeadCustomerColumns(), []);
	const tableData = Array.isArray(leads) ? leads : [];

	return (
		<DataTable<LeadRow>
			data={tableData}
			columns={columns}
			loading={loading}
			manualSorting={false}
			manualPagination={false}
			scrollTargetId="tableScroll"
			emptyTitle="No Lead records found"
			emptyDescription="Created leads will appear here"
		/>
	);
};

export default LeadsTable;
