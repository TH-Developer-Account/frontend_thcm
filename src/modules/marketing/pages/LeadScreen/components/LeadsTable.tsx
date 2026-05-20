import React from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../../../../components/ui/DataTable";
import type { LeadEventGroup } from "../types/leads.types";
import { getGroupedLeadColumns } from "../columns/groupedLeadColumns";

type LeadsTableProps = {
	groups: LeadEventGroup[];
	loading?: boolean;
};

const LeadsTable = ({ groups, loading = false }: LeadsTableProps) => {
	const navigate = useNavigate();

	const safeGroups = React.useMemo(() => {
		return Array.isArray(groups) ? groups : [];
	}, [groups]);

	const handleViewLeads = React.useCallback(
		(group: LeadEventGroup) => {
			navigate("/marketing/leads/create", {
				state: {
					mode: "view",
					leadInfo: {
						epcId: group.epcId,
						proposalNumber: group.proposalNumber,
						eventName: group.event_name,
						location: group.location,
						status: group.status,
					},
				},
			});
		},
		[navigate],
	);

	const groupedColumns = React.useMemo(
		() =>
			getGroupedLeadColumns({
				onViewLeads: handleViewLeads,
			}),
		[handleViewLeads],
	);

	return (
		<DataTable<LeadEventGroup>
			data={safeGroups}
			columns={groupedColumns}
			loading={loading}
			manualSorting={false}
			manualPagination={false}
			scrollTargetId="tableScroll"
			emptyTitle="No Lead records found"
			emptyDescription="Create leads from an EPC event to see them here"
		/>
	);
};

export default LeadsTable;
