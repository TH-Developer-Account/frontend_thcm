import { Mail, Phone, Trash2, UserRoundCheck } from "lucide-react";

import ActionMenu from "../../../../components/common/ActionMenu";
import type { ActionMenuItem } from "../../../../components/common/ActionMenu";
import { Badge } from "../../../../components/common/Badge";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";
import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";

import { useBPPeopleManager } from "../hooks/useBusinessPartners";

import type {
	BPContactViewModel,
	BPPeoplePermissions,
} from "../utils/bp.types";

type BPPeopleProps = {
	businessPartnerId: string;
	people: BPContactViewModel[];
	permissions: BPPeoplePermissions;
};

type PeopleColumnOptions = {
	canSetMainContact: boolean;
	canRemovePeople: boolean;
	isUpdating: boolean;
	isRemoving: boolean;
	onSetMainContact: (person: BPContactViewModel) => void;
	onRemove: (person: BPContactViewModel) => void;
};

type RoleBadgeVariant = "success" | "warning" | "info";

const getInitials = (name: string): string =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

const getRoleBadgeVariant = (person: BPContactViewModel): RoleBadgeVariant => {
	if (person.isOwner) {
		return "success";
	}

	if (person.isMainContact) {
		return "info";
	}

	return "warning";
};

const getColumns = ({
	canSetMainContact,
	canRemovePeople,
	isUpdating,
	isRemoving,
	onSetMainContact,
	onRemove,
}: PeopleColumnOptions): SimpleTableColumn<BPContactViewModel>[] => {
	const columns: SimpleTableColumn<BPContactViewModel>[] = [
		{
			key: "user",
			header: "Person",
			widthUnits: 3,
			minWidth: 190,
			render: (person) => (
				<div
					className={[
						"bp-people-user",
						person.isMainContact && "bp-main-contact-marker",
					]
						.filter(Boolean)
						.join(" ")}
				>
					<div className="bp-people-avatar" aria-hidden="true">
						{getInitials(person.name)}
					</div>

					<div className="bp-people-user-copy">
						<div className="bp-people-name-row">
							<p className="bp-people-name">{person.name}</p>
						</div>

						<p className="bp-people-id">
							{person.email || `Contact ID: ${person.id.slice(0, 8)}`}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "role",
			header: "Role",
			widthUnits: 2,
			minWidth: 130,
			render: (person) => (
				<Badge variant={getRoleBadgeVariant(person)}>
					{person.role || "--"}
				</Badge>
			),
		},
		{
			key: "contact",
			header: "Contact",
			widthUnits: 4,
			minWidth: 230,
			render: (person) => (
				<div className="bp-people-contact-list">
					{person.email ? (
						<a
							href={`mailto:${person.email}`}
							className="bp-people-contact-row"
						>
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
			key: "businessPartnerId",
			header: "Business Partner ID",
			widthUnits: 3,
			minWidth: 190,
			render: (person) => <span>{person.businessPartnerId || "--"}</span>,
		},
		{
			key: "pan",
			header: "PAN",
			widthUnits: 2,
			minWidth: 140,
			render: (person) => <span>{person.panNumber || "--"}</span>,
		},
	];

	const hasActions = canSetMainContact || canRemovePeople;

	if (hasActions) {
		columns.push({
			key: "actions",
			header: "Actions",
			widthUnits: 1,
			minWidth: 80,
			render: (person) => {
				const actions: ActionMenuItem<BPContactViewModel>[] = [
					{
						id: "set-main-contact",
						label: person.isMainContact
							? "Current main contact"
							: "Set as main contact",
						Icon: UserRoundCheck,
						onClick: onSetMainContact,
						hidden: !canSetMainContact,
						disabled: person.isMainContact || isUpdating,
						ariaLabel: person.isMainContact
							? `${person.name} is already the main contact`
							: `Set ${person.name} as main contact`,
					},
					{
						id: "remove-contact",
						label: "Remove",
						Icon: Trash2,
						onClick: onRemove,
						hidden: !canRemovePeople,
						disabled: person.isOwner || isRemoving,
						variant: "danger",
						ariaLabel: person.isOwner
							? `${person.name} is the owner and cannot be removed`
							: `Remove ${person.name} from this business partner`,
					},
				];

				return (
					<ActionMenu
						row={person}
						actions={actions}
						ariaLabel={`Actions for ${person.name}`}
						size="md"
						triggerVariant="outline"
					/>
				);
			},
		});
	}

	return columns;
};

const BPPeople = ({
	businessPartnerId,
	people,
	permissions,
}: BPPeopleProps) => {
	const {
		sortedPeople,
		handleSetMainContact,
		handleRemovePerson,
		isUpdatingPeople,
		isRemovingContact,
		canSetMainContact,
		canRemovePeople,
	} = useBPPeopleManager(businessPartnerId, people, permissions);

	const columns = getColumns({
		canSetMainContact,
		canRemovePeople,
		isUpdating: isUpdatingPeople,
		isRemoving: isRemovingContact,
		onSetMainContact: handleSetMainContact,
		onRemove: handleRemovePerson,
	});

	return (
		<div className="bp-people">
			<SimpleViewTable
				data={sortedPeople}
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
};

export default BPPeople;
