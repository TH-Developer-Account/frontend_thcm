import React from "react";

import DataTable from "../../../../../../components/ui/DataTable";

import type { LeadEventGroup } from "../../types/leads.types";
import { getGroupedLeadColumns } from "../columns/groupedLeadColumns";

type LeadsTableProps = {
	groups: LeadEventGroup[];
};

const LeadsTable = ({ groups }: LeadsTableProps) => {
	const safeGroups = React.useMemo(() => {
		return Array.isArray(groups) ? groups : [];
	}, [groups]);

	const handleViewLeads = React.useCallback((group: LeadEventGroup) => {
		console.log("View leads group", {
			epcId: group.epcId,
			eventName: group.event_name,
			location: group.location,
			leadCount: group.lead_count,
			leads: group.leads,
		});
	}, []);

	const groupedColumns = React.useMemo(
		() =>
			getGroupedLeadColumns({
				onViewLeads: handleViewLeads,
			}),
		[handleViewLeads],
	);

	return (
		<>
			<DataTable<LeadEventGroup>
				data={safeGroups}
				columns={groupedColumns}
				loading={false}
				manualSorting={false}
				manualPagination={false}
				scrollTargetId="tableScroll"
				emptyTitle="No Lead records found"
				emptyDescription="Create leads from an EPC event to see them here"
			/>
		</>
	);
};

export default LeadsTable;
