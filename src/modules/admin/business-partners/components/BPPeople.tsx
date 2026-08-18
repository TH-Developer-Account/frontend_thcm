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

const getInitials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0))
		.join("")
		.toUpperCase();

const BPPeople = () => {
	return (
		<div className="bp-people">
			<div className="bp-people-header">
				<h3 className="bp-people-title">User Directory</h3>
				<p className="bp-people-description">
					View and manage all organization members in one place.
				</p>
			</div>

			<div className="bp-people-table">
				<div className="bp-people-head">
					<div className="col-span-3">User</div>
					<div className="col-span-2">Role</div>
					<div className="col-span-3">Contact</div>
					<div className="col-span-2">Department</div>
					<div className="col-span-2">Status</div>
				</div>

				<div className="bp-people-body">
					{organizationUsers.map((user) => {
						const isActive = user.status === "Active";

						return (
							<div key={user.id} className="bp-people-row">
								<div className="md:col-span-3">
									<div className="bp-people-user">
										<div className="bp-people-avatar" aria-hidden="true">
											{getInitials(user.name)}
										</div>

										<div className="min-w-0">
											<p className="bp-people-name">{user.name}</p>
											<p className="bp-people-id">Employee ID #{user.id}</p>
										</div>
									</div>
								</div>

								<div className="md:col-span-2">
									<span className="bp-people-role">{user.role}</span>
								</div>

								<div className="space-y-1 md:col-span-3">
									<div className="bp-people-contact-row">
										<Mail
											size={14}
											className="bp-people-contact-icon"
											aria-hidden="true"
										/>
										<span className="bp-people-contact">{user.email}</span>
									</div>

									<div className="bp-people-contact-row">
										<Phone
											size={14}
											className="bp-people-contact-icon"
											aria-hidden="true"
										/>
										<span className="bp-people-contact">{user.phone}</span>
									</div>
								</div>

								<div className="md:col-span-2">
									<p className="bp-people-department">{user.department}</p>
								</div>

								<div className="md:col-span-2">
									<span
										className={`bp-people-status ${
											isActive
												? "bp-people-status--active"
												: "bp-people-status--inactive"
										}`}
									>
										{user.status}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default BPPeople;
