import { Mail, Phone } from "lucide-react";
import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";
import type { BPContactViewModel } from "../hooks/useBusinessPartners";

const getInitials = (name: string) =>
	name
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

const columns: SimpleTableColumn<BPContactViewModel>[] = [
	{
		key: "user",
		header: "Person",
		widthUnits: 3,
		minWidth: 190,
		render: (person) => (
			<div className="bp-people-user">
				<div className="bp-people-avatar" aria-hidden="true">
					{getInitials(person.name)}
				</div>
				<div className="bp-people-user-copy">
					<p className="bp-people-name">{person.name}</p>
					<p className="bp-people-id">Contact ID #{person.id.slice(0, 8)}</p>
				</div>
			</div>
		),
	},
	{
		key: "role",
		header: "Role",
		widthUnits: 2,
		minWidth: 130,
		render: (person) => <span className="bp-people-role">{person.role}</span>,
	},
	{
		key: "contact",
		header: "Contact",
		widthUnits: 4,
		minWidth: 230,
		render: (person) => (
			<div className="bp-people-contact-list">
				{person.email ? (
					<a href={`mailto:${person.email}`} className="bp-people-contact-row">
						<Mail
							size={13}
							className="bp-people-contact-icon"
							aria-hidden="true"
						/>
						<span className="bp-people-contact">{person.email}</span>
					</a>
				) : (
					<span>--</span>
				)}
				{person.phoneNumber ? (
					<a
						href={`tel:${person.phoneNumber.replace(/\s+/g, "")}`}
						className="bp-people-contact-row"
					>
						<Phone
							size={13}
							className="bp-people-contact-icon"
							aria-hidden="true"
						/>
						<span className="bp-people-contact">{person.phoneNumber}</span>
					</a>
				) : null}
			</div>
		),
	},
	{
		key: "pan",
		header: "PAN",
		widthUnits: 2,
		minWidth: 140,
		render: (person) => <span>{person.panNumber || "--"}</span>,
	},
];

const BPPeople = ({ people }: { people: BPContactViewModel[] }) => (
	<div className="bp-people">
		<div className="bp-people-header">
			<div>
				<h3 className="bp-people-title">People</h3>
				<p className="bp-people-description">
					Business partner owners and contacts.
				</p>
			</div>
		</div>
		<SimpleViewTable
			data={people}
			columns={columns}
			getRowId={(person) => person.id}
			maxHeight="360px"
			className="bp-people-view-table"
			ariaLabel="Business partner people"
			emptyTitle="No people found"
			emptyDescription="No contacts are associated with this business partner."
		/>
	</div>
);

export default BPPeople;
