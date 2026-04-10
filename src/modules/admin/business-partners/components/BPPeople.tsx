import React from "react";
import { Mail, Phone } from "lucide-react";

const organizationUsers = [
	{
		id: 1,
		name: "Ananya Sharma",
		role: "Admin",
		email: "ananya.sharma@company.com",
		phone: "+91 98765 43210",
		department: "Operations",
		status: "Active",
	},
	{
		id: 2,
		name: "Rahul Verma",
		role: "Manager",
		email: "rahul.verma@company.com",
		phone: "+91 91234 56789",
		department: "Sales",
		status: "Active",
	},
	{
		id: 3,
		name: "Sneha Reddy",
		role: "Executive",
		email: "sneha.reddy@company.com",
		phone: "+91 99887 76655",
		department: "Marketing",
		status: "Inactive",
	},
	{
		id: 4,
		name: "Arjun Nair",
		role: "Finance Lead",
		email: "arjun.nair@company.com",
		phone: "+91 93456 78123",
		department: "Finance",
		status: "Active",
	},
];

const BPPeople = () => {
	return (
		<div className="tab-view">
			<div className="px-6 py-5">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h3 className="text-base font-semibold text-zinc-900">
							User Directory
						</h3>
						<p className="mt-1 text-sm text-zinc-500">
							View and manage all organization members in one place.
						</p>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-zinc-200">
					<div className="hidden grid-cols-12 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 md:grid">
						<div className="col-span-3">User</div>
						<div className="col-span-2">Role</div>
						<div className="col-span-3">Contact</div>
						<div className="col-span-2">Department</div>
						<div className="col-span-2">Status</div>
					</div>

					<div className="divide-y divide-zinc-200 bg-white">
						{organizationUsers.map((user) => (
							<div
								key={user.id}
								className="grid gap-4 px-5 py-4 md:grid-cols-12 md:items-center"
							>
								<div className="md:col-span-3">
									<div className="flex items-center gap-3">
										<div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-50 text-sm font-bold text-orange-700">
											{user.name
												.split(" ")
												.map((part) => part[0])
												.slice(0, 2)
												.join("")}
										</div>
										<div>
											<p className="font-semibold text-zinc-900">{user.name}</p>
											<p className="text-sm text-zinc-500">
												Employee ID #{user.id}
											</p>
										</div>
									</div>
								</div>

								<div className="md:col-span-2">
									<span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
										{user.role}
									</span>
								</div>

								<div className="space-y-1 md:col-span-3">
									<div className="flex items-center gap-2 text-sm text-zinc-600">
										<Mail size={14} className="text-zinc-400" />
										<span>{user.email}</span>
									</div>
									<div className="flex items-center gap-2 text-sm text-zinc-600">
										<Phone size={14} className="text-zinc-400" />
										<span>{user.phone}</span>
									</div>
								</div>

								<div className="md:col-span-2">
									<p className="text-sm font-medium text-zinc-700">
										{user.department}
									</p>
								</div>

								<div className="md:col-span-2">
									<span
										className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
											user.status === "Active"
												? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
												: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
										}`}
									>
										{user.status}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default BPPeople;
