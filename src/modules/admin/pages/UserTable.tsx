// UserTable.tsx
import { type TableUser } from "../../../utils/types";
import { statusStyles } from "../../../utils/types";
import { Pencil, MoreVertical } from "lucide-react";

interface Props {
	users: TableUser[];
}

export function UserTable({ users }: Props) {
	return (
		<div className="">
			<div className="bg-white overflow-hidden ">
				<table className="w-full text-sm">
					<thead className="bg-gray-100 text-gray-600">
						<tr>
							<th className="px-6 py-4 text-left">Name ↑</th>
							<th className="px-6 py-4 text-left">Phone number</th>
							<th className="px-6 py-4 text-left">Company</th>
							<th className="px-6 py-4 text-left">Role</th>
							<th className="px-6 py-4 text-left">Status</th>
							<th className="px-6 py-4 text-right"></th>
						</tr>
					</thead>

					<tbody>
						{users.map((user) => (
							<tr
								key={user.id}
								className="border-t border-gray-200 hover:bg-gray-50 transition"
							>
								<td className="px-6 py-4 flex items-center gap-3">
									<img src={user.avatar} className="w-10 h-10 rounded-full" />
									<div>
										<div className="font-medium text-gray-900">{user.name}</div>
										<div className="text-gray-500 text-xs">{user.email}</div>
									</div>
								</td>

								<td className="px-6 py-4">{user.phone}</td>
								<td className="px-6 py-4">{user.company}</td>
								<td className="px-6 py-4">{user.role}</td>

								<td className="px-6 py-4">
									<span
										className={`px-3 py-1 text-xs rounded-lg font-medium ${
											statusStyles[user.status]
										}`}
									>
										{user.status}
									</span>
								</td>

								<td className="px-6 py-4 text-right">
									<div className="flex justify-end gap-3 text-gray-500">
										<Pencil size={16} className="cursor-pointer" />
										<MoreVertical size={16} className="cursor-pointer" />
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
