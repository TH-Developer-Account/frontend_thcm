// components/LeadsTable.tsx

import React from "react";
import { ServerAxios } from "../../../../../../services/ServerAxios";
import DataTable from "../../../../../../components/ui/DataTable";
import { Modal } from "../../../../../../components/common/Modal";
import type { LeadEventGroup, LeadRow } from "../../types/leads.types";
import { groupLeadsByEvent } from "../../helpers/groupLeadsByEvent";
import { getGroupedLeadColumns } from "../columns/groupedLeadColumns";
import { getLeadCustomerColumns } from "../columns/leadCustomerColumns";

const LeadsTable = () => {
	const [leads, setLeads] = React.useState<LeadRow[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [selectedGroup, setSelectedGroup] =
		React.useState<LeadEventGroup | null>(null);

	const groupedData = React.useMemo(() => {
		return groupLeadsByEvent(leads);
	}, [leads]);

	const groupedColumns = React.useMemo(
		() =>
			getGroupedLeadColumns({
				onViewLeads: (group) => {
					setSelectedGroup(group);
				},
			}),
		[],
	);

	const customerColumns = React.useMemo(() => getLeadCustomerColumns(), []);

	const fetchLeads = React.useCallback(async () => {
		try {
			setLoading(true);

			const response = await ServerAxios.get("/leads");

			const list =
				response.data?.data?.leads ||
				response.data?.data ||
				response.data?.leads ||
				[];

			setLeads(Array.isArray(list) ? list : []);
		} catch (err) {
			console.log({ err });
			setLeads([]);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		void fetchLeads();
	}, [fetchLeads]);

	return (
		<>
			<DataTable<LeadEventGroup>
				data={groupedData}
				columns={groupedColumns}
				loading={loading}
				manualSorting={false}
				manualPagination={false}
				scrollTargetId="tableScroll"
				emptyTitle="No Lead records found"
				emptyDescription="Create leads from an EPC event to see them here"
			/>

			<Modal
				open={Boolean(selectedGroup)}
				title="Lead Details"
				onClose={() => setSelectedGroup(null)}
				size="xl"
				className="content-box"
			>
				{selectedGroup && (
					<div className="space-y-4">
						<div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
							<div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
								<div>
									<span className="uppercase-label-text">EPC No</span>
									<p className="mt-1 font-semibold text-zinc-900">
										{selectedGroup.proposal_number || "--"}
									</p>
								</div>

								<div>
									<span className="uppercase-label-text">Event Name</span>
									<p className="mt-1 font-semibold text-zinc-900">
										{selectedGroup.event_name || "--"}
									</p>
								</div>

								<div>
									<span className="uppercase-label-text">Location</span>
									<p className="mt-1 font-semibold text-zinc-900">
										{selectedGroup.location || "--"}
									</p>
								</div>

								<div>
									<span className="uppercase-label-text">Total Leads</span>
									<p className="mt-1 font-semibold text-orange-700">
										{selectedGroup.lead_count}
									</p>
								</div>
							</div>
						</div>

						<DataTable<LeadRow>
							data={selectedGroup.leads}
							columns={customerColumns}
							loading={false}
							manualSorting={false}
							manualPagination={false}
							scrollTargetId="leadModalScroll"
							emptyTitle="No customers found"
							emptyDescription="No lead customers are linked to this event"
						/>
					</div>
				)}
			</Modal>
		</>
	);
};

export default LeadsTable;
