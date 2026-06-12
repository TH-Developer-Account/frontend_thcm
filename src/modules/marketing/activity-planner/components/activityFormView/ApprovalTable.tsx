import React from "react";
import type { ApprovalTableRow } from "../../../../../utils/types";
import type { WorkflowStage } from "../../types/workflow.types";
import { Badge } from "../../../../../components/common/Badge";
import { getStatusForBadge } from "../../../activity-planner/utils/status";

type Props = {
	data: ApprovalTableRow[];
	stages?: WorkflowStage[];
};

const ApprovalTable = ({ data }: Props) => {
	if (!data.length) return null;

	return (
		<React.Fragment>
			<div className="w-full overflow-x-auto rounded-sm px-3 mt-4 mb-4">
				<table className="w-full text-xs md:text-sm border border-gray-400">
					<thead className="bg-gray-200 px-3 border-b border-gray-400 h-auto my-3 py-2 font-semibold text-gray-600 md:text-sm text-xs">
						<tr>
							<th className="px-3 py-2 text-left">Stage</th>
							<th className="px-3 py-2 text-left">Type</th>
							<th className="px-3 py-2 text-left">Approver</th>
							<th className="px-3 py-2 text-left">Email</th>
							<th className="px-3 py-2 text-center">Flow</th>
							<th className="px-3 py-2 text-center">Min</th>
							<th className="px-3 py-2 text-center">Total</th>
							<th className="px-3 py-2 text-center">Status</th>
						</tr>
					</thead>

					<tbody>
						{data.map((row) => {
							const approvers = row.approvers ?? [];

							return (
								<tr
									key={row.id}
									className="border-t border-gray-400 hover:bg-gray-50 transition text-xs text-left m-1 align-top"
								>
									<td className="px-3 py-2 align-top font-medium">
										<div>{row.stageOrder}</div>
									</td>
									<td className="px-3 py-2 align-top font-medium">
										{row.stageName}
									</td>

									<td className="px-3 py-2 align-top font-medium text-gray-800">
										<div className="space-y-1">
											{approvers.length ? (
												approvers.map((approver) => (
													<div key={approver.id}>{approver.name}</div>
												))
											) : (
												<div>{row.name || "--"}</div>
											)}
										</div>
									</td>

									<td className="px-3 py-2 align-top text-gray-600">
										<div className="space-y-1">
											{approvers.length ? (
												approvers.map((approver) => (
													<div key={approver.id}>{approver.email}</div>
												))
											) : (
												<div>{row.email || "--"}</div>
											)}
										</div>
									</td>

									<td className="px-3 py-2 text-center align-top">
										{row.strategy}
									</td>

									<td className="px-3 py-2 text-center align-top">
										<div className="space-y-1">
											{approvers.length ? (
												approvers.map((approver) => (
													<div key={approver.id}>
														{approver.minApprovals ?? "--"}
													</div>
												))
											) : (
												<div>{row.minApprovals ?? "--"}</div>
											)}
										</div>
									</td>

									<td className="px-3 py-2 text-center align-top">
										{row.totalApprovers ?? "--"}
									</td>

									<td className="px-3 py-2 text-center align-top">
										<div className="space-y-1">
											{approvers.length ? (
												approvers.map((approver) => (
													<div key={approver.id}>
														<Badge
															status={
																approver?.status
																	? getStatusForBadge(approver?.status)
																	: undefined
															}
														/>
													</div>
												))
											) : (
												<div>{row.status || null}</div>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</React.Fragment>
	);
};

export default ApprovalTable;
