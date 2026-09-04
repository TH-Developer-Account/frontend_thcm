import { useState } from "react";
import { Mail, Phone, Trash2, UserRoundCheck, X } from "lucide-react";

import ActionMenu from "../../../../components/common/ActionMenu";
import type { ActionMenuItem } from "../../../../components/common/ActionMenu";
import { Badge } from "../../../../components/common/Badge";
import Button from "../../../../components/common/Button";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";
import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";
import UserAsyncSelect from "../../../../components/forms/AsyncSelect";

import {
	useBPAddPeopleForm,
	useBPPeopleManager,
} from "../hooks/useBusinessPartners";

import type {
	BPContactViewModel,
	BPPeoplePermissions,
} from "../utils/bp.types";

type BPPeopleProps = {
	businessPartnerId: string;
	people: BPContactViewModel[];
	permissions: BPPeoplePermissions;

	/** Controlled from BPTabs via the "Add People" action row. */
	isAdding: boolean;
	onCancelAdd: () => void;
	onAdded: () => void;
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
	isAdding,
	onCancelAdd,
	onAdded,
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

	const {
		selected,
		excludedUserIds,
		handleSelectUser,
		handleRemoveSelected,
		handleToggleMainContact,
		resetSelection,
		handleSubmit,
		isSubmitting,
		error: addPeopleError,
	} = useBPAddPeopleForm(businessPartnerId, people);

	/**
	 * UserAsyncSelect keeps its internal search input state.
	 * Remounting it after a selection clears the previous search text.
	 */
	const [selectKey, setSelectKey] = useState(0);

	const columns = getColumns({
		canSetMainContact,
		canRemovePeople,
		isUpdating: isUpdatingPeople,
		isRemoving: isRemovingContact,
		onSetMainContact: handleSetMainContact,
		onRemove: handleRemovePerson,
	});

	const handleCancel = () => {
		resetSelection();
		onCancelAdd();
	};

	const handleAdd = async () => {
		const succeeded = await handleSubmit();

		if (succeeded) {
			onAdded();
		}
	};

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

			{isAdding && (
				<div className="bp-people-add-panel">
					<UserAsyncSelect
						key={selectKey}
						name="add-people-search"
						label="Search and add people"
						placeholder="Search by name or email..."
						excludedUserIds={excludedUserIds}
						value={null}
						onChange={(user) => {
							if (!user) {
								return;
							}

							handleSelectUser(user);

							setSelectKey((current) => current + 1);
						}}
					/>

					{selected.length > 0 && (
						<div className="bp-people-selected-list">
							{selected.map((entry) => (
								<div key={entry.userId} className="bp-people-selected-chip">
									<div className="bp-people-avatar" aria-hidden="true">
										{getInitials(entry.name)}
									</div>

									<div className="bp-people-user-copy">
										<p className="bp-people-name">{entry.name}</p>

										<p className="bp-people-id">{entry.email || "--"}</p>
									</div>

									<label className="bp-people-selected-main-check">
										<input
											type="checkbox"
											checked={entry.isMainContact}
											onChange={() => handleToggleMainContact(entry.userId)}
										/>

										<span>Main contact</span>
									</label>

									<button
										type="button"
										className="bp-people-selected-remove"
										aria-label={`Remove ${entry.name} from selection`}
										onClick={() => handleRemoveSelected(entry.userId)}
									>
										<X size={14} aria-hidden="true" />
									</button>
								</div>
							))}
						</div>
					)}

					{addPeopleError && (
						<p className="bp-master-form-error" role="alert">
							{addPeopleError instanceof Error
								? addPeopleError.message
								: "Unable to add people"}
						</p>
					)}

					<div className="bp-master-form-actions">
						<Button
							type="button"
							text="Cancel"
							variant="secondary"
							onClick={handleCancel}
							disabled={isSubmitting}
						/>

						<Button
							type="button"
							text={isSubmitting ? "Adding..." : "Add Selected"}
							variant="brand"
							onClick={handleAdd}
							disabled={selected.length === 0 || isSubmitting}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default BPPeople;
