import React from "react";

type ApprovalRow = {
	id: number;
	name: string;
	email: string;
	designation: string;
	type: string;
	status: string;
	timestamp: string;
};

type Props = {
	data: ApprovalRow[];
};

const ApprovalTable = ({ data }: Props) => {
	return (
		<div className="w-full overflow-x-auto rounded-sm px-3 mt-4">
			{/* Table */}
			<table className="w-full text-xs md:text-sm border border-gray-400">
				<thead className="bg-gray-200 px-3  border-b border-gray-400 h-auto my-3 py-2 font-semibold text-gray-600 md:text-sm text-xs">
					<tr>
						<th className="px-3 py-2 text-left">#</th>
						<th className="px-3 py-2 text-left">Name</th>
						<th className="px-3 py-2 text-left">Email</th>
						<th className="px-3 py-2 text-left">Designation</th>
						<th className="px-3 py-2 text-left">Type</th>
						<th className="px-3 py-2 text-left">Status</th>
						<th className="px-3 py-2 text-left">Timestamp</th>
					</tr>
				</thead>

				<tbody>
					{data.map((row, index) => (
						<tr
							key={row.id}
							className="border-t border-gray-400 hover:bg-gray-50 transition text-xs text-left m-1"
						>
							<td className="px-3 py-2">{index + 1}</td>
							<td className="px-3 py-2 font-medium text-gray-800">
								{row.name}
							</td>
							<td className="px-3 py-2 text-gray-600">{row.email}</td>
							<td className="px-3 py-2">{row.designation}</td>
							<td className="px-3 py-2">{row.type}</td>

							{/* Status Badge */}
							<td className="px-3 py-2">
								<span
									className={`rounded-full px-2 py-1 text-xs font-medium
                    ${
											row.status === "Approved"
												? "bg-green-100 text-green-700"
												: row.status === "Submitted"
													? "bg-blue-100 text-blue-700"
													: "bg-gray-100 text-gray-600"
										}
                  `}
								>
									{row.status}
								</span>
							</td>

							<td className="px-3 py-2 text-gray-500">{row.timestamp}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default ApprovalTable;
