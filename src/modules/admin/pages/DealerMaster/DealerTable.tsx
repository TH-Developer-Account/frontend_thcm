import { statusStyles, type Dealer } from "./common.types";

interface Props {
	dealer: Dealer[];
}

export function DealerTable({ dealer }: Props) {
	return (
		<div className="p-6 bg-zinc-50 rounded-2xl min-h-screen mt-6">
			<div className="">
				<h2>Dealer List</h2>
				<div className="bg-white overflow-hidden ">
					<table className="w-full text-sm text-left">
						<thead className="bg-gray-100 text-gray-600 text-left">
							<tr>
								<th className="px-6 py-4 text-left">Code</th>
								<th className="px-6 py-4 text-left">Name</th>
								<th className="px-6 py-4 text-left">Phone number</th>
								<th className="px-6 py-4 text-left">Region</th>
								<th className="px-6 py-4 text-left">Location</th>
								<th className="px-6 py-4 text-left">State</th>
								<th className="px-6 py-4 text-left">Status</th>
							</tr>
						</thead>

						<tbody>
							{dealer.map((dealer) => (
								<tr
									key={dealer.id}
									className="border-t border-gray-200 hover:bg-gray-50 transition"
								>
									<td className="px-6 py-4 flex items-center gap-3">
										{dealer.dealerCode}
									</td>

									<td className="px-6 py-4">{dealer.dealerName}</td>
									<td className="px-6 py-4">{dealer.contactNumber}</td>
									<td className="px-6 py-4">{dealer.region}</td>
									<td className="px-6 py-4">{dealer.location}</td>
									<td className="px-6 py-4">{dealer.state}</td>

									<td className="px-6 py-4">
										<span
											className={`px-3 py-1 text-xs rounded-lg font-medium ${
												statusStyles[dealer.status]
											}`}
										>
											{dealer.status}
										</span>
									</td>

									{/* <td className="px-6 py-4 text-right">
										<div className="flex justify-end gap-3 text-gray-500">
											<Pencil size={16} className="cursor-pointer" />
											<MoreVertical size={16} className="cursor-pointer" />
										</div>
									</td> */}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
