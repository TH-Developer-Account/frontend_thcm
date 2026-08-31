import { Mail, Phone } from "lucide-react";
import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";

type OrganizationUserStatus = "Active" | "Inactive";

type OrganizationUser = {
	id: number;
	name: string;
	role: string;
	email: string;
	phone: string;
	department: string;
	status: OrganizationUserStatus;
};

const organizationUsers: OrganizationUser[] = [
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

const getInitials = (name: string): string =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0))
		.join("")
		.toUpperCase();

const columns: SimpleTableColumn<OrganizationUser>[] = [
	{
		key: "user",
		header: "User",
		widthUnits: 3,
		minWidth: 190,
		render: (user) => (
			<div className="bp-people-user">
				<div className="bp-people-avatar" aria-hidden="true">
					{getInitials(user.name)}
				</div>

				<div className="bp-people-user-copy">
					<p className="bp-people-name">{user.name}</p>
					<p className="bp-people-id">Employee ID #{user.id}</p>
				</div>
			</div>
		),
	},
	{
		key: "role",
		header: "Role / Department",
		widthUnits: 2,
		minWidth: 150,
		render: (user) => (
			<div className="bp-people-role-details">
				<span className="bp-people-role">{user.role}</span>
				<span className="bp-people-department">{user.department}</span>
			</div>
		),
	},
	{
		key: "contact",
		header: "Contact",
		widthUnits: 4,
		minWidth: 230,
		render: (user) => (
			<div className="bp-people-contact-list">
				<a
					href={`mailto:${user.email}`}
					className="bp-people-contact-row"
					title={user.email}
				>
					<Mail
						size={13}
						className="bp-people-contact-icon"
						aria-hidden="true"
					/>

					<span className="bp-people-contact">{user.email}</span>
				</a>

				<a
					href={`tel:${user.phone.replace(/\s+/g, "")}`}
					className="bp-people-contact-row"
				>
					<Phone
						size={13}
						className="bp-people-contact-icon"
						aria-hidden="true"
					/>

					<span className="bp-people-contact">{user.phone}</span>
				</a>
			</div>
		),
	},
	{
		key: "status",
		header: "Status",
		widthUnits: 1,
		minWidth: 100,
		render: (user) => (
			<span
				className={`bp-people-status ${
					user.status === "Active"
						? "bp-people-status--active"
						: "bp-people-status--inactive"
				}`}
			>
				{user.status}
			</span>
		),
	},
];

const BPPeople = () => {
	return (
		<div className="bp-people">
			<div className="bp-people-header">
				<div>
					<h3 className="bp-people-title">User Directory</h3>

					<p className="bp-people-description">
						View and manage all organization members in one place.
					</p>
				</div>
			</div>

			<SimpleViewTable<OrganizationUser>
				data={organizationUsers}
				columns={columns}
				getRowId={(user) => String(user.id)}
				maxHeight="360px"
				defaultColumnMinWidth={100}
				className="bp-people-view-table"
				ariaLabel="Organization user directory"
				emptyTitle="No organization members found"
				emptyDescription="No users have been added to this organization."
			/>
		</div>
	);
};

export default BPPeople;
