import { type TableUser } from "../../utils/types";
import { statusStyles } from "../../utils/types";
import { Pencil, MoreVertical } from "lucide-react";

export const columns = [
	{
		header: "",
		render: () => <input type="checkbox" />,
		className: "w-10",
	},
	{
		header: "Name ↑",
		render: (user: TableUser) => (
			<div className="flex items-center gap-3">
				<img src={user.avatar} className="w-10 h-10 rounded-full" />
				<div>
					<div className="font-medium text-gray-900">{user.name}</div>
					<div className="text-gray-500 text-xs">{user.email}</div>
				</div>
			</div>
		),
	},
	{
		header: "Phone number",
		accessor: "phone",
	},
	{
		header: "Company",
		accessor: "company",
	},
	{
		header: "Role",
		accessor: "role",
	},
	{
		header: "Status",
		render: (user: TableUser) => (
			<span
				className={`px-3 py-1 text-xs rounded-lg font-medium ${
					statusStyles[user.status]
				}`}
			>
				{user.status}
			</span>
		),
	},
	{
		header: "",
		render: () => (
			<div className="flex justify-end gap-3 text-gray-500">
				<Pencil size={16} className="cursor-pointer" />
				<MoreVertical size={16} className="cursor-pointer" />
			</div>
		),
	},
];
