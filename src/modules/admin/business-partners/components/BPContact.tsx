import { useState } from "react";
import { Mail, Phone, Plus, Trash2, UserRoundCheck, X } from "lucide-react";

import ActionMenu from "../../../../components/common/ActionMenu";
import type { ActionMenuItem } from "../../../../components/common/ActionMenu";
import TabsBar from "../../../../components/common/TabsBar"; // adjust path to match your project structure
import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/forms/FormInput";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";
import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";
import UserAsyncSelect from "../../../../components/forms/AsyncSelect";
import { useBPContactsManager } from "../hooks/useBusinessPartners";
import { useBusinessPartnerPeopleMutations } from "../hooks/useBusinessPartnerMutations";

import type {
	BPContactViewModel,
	BPPeoplePermissions,
} from "../utils/bp.types";
import { Badge } from "../../../../components/common/Badge";

type BPContactProps = {
	businessPartnerId: string;
	contacts: BPContactViewModel[];
	permissions: BPPeoplePermissions;

	/** Controlled from BPTabs via the "Add Contact" action row. */
	isAdding: boolean;
	onAddContact: () => void;
	onCancelAdd: () => void;
	onAdded: () => void;
};

type ContactColumnOptions = {
	canSetMainContact: boolean;
	canRemovePeople: boolean;
	isUpdating: boolean;
	isRemoving: boolean;
	onSetMainContact: (contact: BPContactViewModel) => void;
	onRemove: (contact: BPContactViewModel) => void;
};

/** A row pending submission in the "Add Contact" panel — either a searched
 * existing user (has userId) or a manually typed contact (no userId). */
type PendingContact = {
	localId: string;
	userId?: string;
	name: string;
	email?: string;
	phoneNumber?: string;
	panNumber?: string;
	isMainContact: boolean;
	isDefault: boolean;
	isManual: boolean;
};

const EMPTY_MANUAL_FORM = {
	name: "",
	phoneNumber: "",
	email: "",
	panNumber: "",
};

const addContactModes = [
	{ value: "search", label: "Search Existing User" },
	{ value: "manual", label: "Add Manually" },
] as const;

const makeLocalId = () =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getInitials = (name: string): string =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

type RoleBadgeVariant = "success" | "warning" | "info";
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
}: ContactColumnOptions): SimpleTableColumn<BPContactViewModel>[] => {
	const columns: SimpleTableColumn<BPContactViewModel>[] = [
		{
			key: "name",
			header: "Name",
			widthUnits: 3,
			minWidth: 190,
			render: (contact) => (
				<div
					className={[
						"bp-people-user",
						contact.isMainContact && "bp-main-contact-marker",
					]
						.filter(Boolean)
						.join(" ")}
				>
					<div className="bp-people-avatar" aria-hidden="true">
						{getInitials(contact.name)}
					</div>

					<div className="bp-people-user-copy">
						<p className="bp-people-name">{contact.name}</p>

						{contact.isMainContact && (
							<p className="bp-people-id">Default contact</p>
						)}
					</div>
				</div>
			),
		},
		{
			key: "role",
			header: "Role",
			widthUnits: 2,
			minWidth: 130,
			render: (contact) => (
				<Badge variant={getRoleBadgeVariant(contact)}>
					{contact.role || "--"}
				</Badge>
			),
		},
		{
			key: "phoneNumber",
			header: "Phone Number",
			widthUnits: 3,
			minWidth: 180,
			render: (contact) =>
				contact.phoneNumber ? (
					<a
						href={`tel:${contact.phoneNumber.replace(/\s+/g, "")}`}
						className="bp-people-contact-row"
					>
						<Phone
							size={13}
							className="bp-people-contact-icon"
							aria-hidden="true"
						/>

						<span className="bp-people-contact">{contact.phoneNumber}</span>
					</a>
				) : (
					<span>--</span>
				),
		},
		{
			key: "email",
			header: "Email ID",
			widthUnits: 4,
			minWidth: 220,
			render: (contact) =>
				contact.email ? (
					<a href={`mailto:${contact.email}`} className="bp-people-contact-row">
						<Mail
							size={13}
							className="bp-people-contact-icon"
							aria-hidden="true"
						/>

						<span className="bp-people-contact">{contact.email}</span>
					</a>
				) : (
					<span>--</span>
				),
		},
		{
			key: "pan",
			header: "PAN Number",
			widthUnits: 2,
			minWidth: 140,
			render: (contact) => <span>{contact.panNumber || "--"}</span>,
		},
	];

	const hasActions = canSetMainContact || canRemovePeople;

	if (hasActions) {
		columns.push({
			key: "actions",
			header: "Actions",
			widthUnits: 1,
			minWidth: 80,
			render: (contact) => {
				const actions: ActionMenuItem<BPContactViewModel>[] = [
					{
						id: "set-default-contact",
						label: contact.isMainContact
							? "Current default contact"
							: "Set as default",
						Icon: UserRoundCheck,
						onClick: onSetMainContact,
						hidden: !canSetMainContact,
						disabled: contact.isMainContact || isUpdating,
						ariaLabel: contact.isMainContact
							? `${contact.name} is already the default contact`
							: `Set ${contact.name} as the default contact`,
					},
					{
						id: "remove-contact",
						label: "Remove",
						Icon: Trash2,
						onClick: onRemove,
						hidden: !canRemovePeople,
						disabled: contact.isOwner || isRemoving,
						variant: "danger",
						ariaLabel: contact.isOwner
							? `${contact.name} is the owner and cannot be removed`
							: `Remove ${contact.name} from this business partner`,
					},
				];

				return (
					<ActionMenu
						row={contact}
						actions={actions}
						ariaLabel={`Actions for ${contact.name}`}
						size="sm"
						triggerVariant="outline"
					/>
				);
			},
		});
	}

	return columns;
};

const BPContact = ({
	businessPartnerId,
	contacts,
	permissions,
	isAdding,
	onAddContact,
	onCancelAdd,
	onAdded,
}: BPContactProps) => {
	const {
		sortedPeople,
		handleSetMainContact,
		handleRemovePerson,
		isUpdatingPeople,
		isRemovingContact,
		canSetMainContact,
		canRemovePeople,
	} = useBPContactsManager(businessPartnerId, contacts, permissions);

	const { addPeople, isAddingPeople, addPeopleError } =
		useBusinessPartnerPeopleMutations(businessPartnerId);

	const columns = getColumns({
		canSetMainContact,
		canRemovePeople,
		isUpdating: isUpdatingPeople,
		isRemoving: isRemovingContact,
		onSetMainContact: handleSetMainContact,
		onRemove: handleRemovePerson,
	});

	/* --- Add Contact panel: search-existing-user OR manual entry --- */

	const [addMode, setAddMode] = useState<"search" | "manual">("search");
	const [selectKey, setSelectKey] = useState(0);
	const [manualForm, setManualForm] = useState(EMPTY_MANUAL_FORM);
	const [pending, setPending] = useState<PendingContact[]>([]);

	const existingUserIds = contacts
		.map((contact) => contact.userId)
		.filter((id): id is string => Boolean(id));

	const excludedUserIds = [
		...existingUserIds,
		...pending
			.map((entry) => entry.userId)
			.filter((id): id is string => Boolean(id)),
	];

	const handleSelectUser = (
		user: { value: string; label: string; email?: string } | null,
	) => {
		if (!user) return;

		setPending((current) => {
			if (current.some((entry) => entry.userId === user.value)) {
				return current;
			}

			return [
				...current,
				{
					localId: makeLocalId(),
					userId: user.value,
					name: user.label,
					email: user.email ?? "",
					isMainContact: false,
					isDefault: false,
					isManual: false,
				},
			];
		});

		setSelectKey((current) => current + 1);
	};

	const handleManualFieldChange = (
		field: keyof typeof EMPTY_MANUAL_FORM,
		value: string,
	) => {
		setManualForm((current) => ({ ...current, [field]: value }));
	};

	const handleAddManualEntry = () => {
		if (!manualForm.name.trim()) return;

		setPending((current) => [
			...current,
			{
				localId: makeLocalId(),
				name: manualForm.name.trim(),
				phoneNumber: manualForm.phoneNumber.trim() || undefined,
				email: manualForm.email.trim() || undefined,
				panNumber: manualForm.panNumber.trim() || undefined,
				isMainContact: false,
				isDefault: false,
				isManual: true,
			},
		]);

		setManualForm(EMPTY_MANUAL_FORM);
	};

	const handleRemovePending = (localId: string) => {
		setPending((current) =>
			current.filter((entry) => entry.localId !== localId),
		);
	};

	const handleToggleMainContact = (localId: string) => {
		setPending((current) =>
			current.map((entry) => ({
				...entry,
				isMainContact: entry.localId === localId ? !entry.isMainContact : false,
			})),
		);
	};

	const resetAddPanel = () => {
		setPending([]);
		setManualForm(EMPTY_MANUAL_FORM);
		setAddMode("search");
	};

	const handleCancel = () => {
		resetAddPanel();
		onCancelAdd();
	};

	const handleAdd = async () => {
		if (pending.length === 0) return;

		const payload = pending.map((entry) =>
			entry.userId
				? {
						userId: entry.userId,
						isMainContact: entry.isMainContact,
						isDefault: entry.isDefault,
					}
				: {
						name: entry.name,
						phoneNumber: entry.phoneNumber,
						email: entry.email,
						panNumber: entry.panNumber,
						isMainContact: entry.isMainContact,
						isDefault: entry.isDefault,
					},
		);

		try {
			// NOTE: manual (no-userId) entries assume the payload/mutation
			// accepts name/phoneNumber/email/panNumber directly. If
			// UpdateBusinessPartnerPeoplePayload is currently typed to
			// require userId, widen it to accept this shape too.
			await addPeople(payload as Parameters<typeof addPeople>[0]);
			resetAddPanel();
			onAdded();
		} catch {
			// Mutation exposes the error via addPeopleError.
		}
	};

	return (
		<div>
			{!(isAdding && sortedPeople.length === 0) && (
				<SimpleViewTable
					data={sortedPeople}
					columns={columns}
					getRowId={(contact) => contact.id}
					maxHeight="360px"
					className="bp-people-view-table mb-4"
					ariaLabel="Business partner contacts"
					emptyTitle="No contacts found"
					emptyDescription="No contacts are associated with this business partner."
					emptyContent={
						<Button
							type="button"
							text="Add Contact"
							Icon={Plus}
							iconPosition="left"
							appearance="standard"
							variant="outline"
							size="sm"
							className="mt-1"
							onClick={onAddContact}
						/>
					}
				/>
			)}

			{isAdding && (
				<div className="bp-people-add-panel">
					<TabsBar
						items={addContactModes}
						active={addMode}
						onChange={setAddMode}
						ariaLabel="Add contact method"
						variant="soft"
					/>

					{addMode === "search" ? (
						<UserAsyncSelect
							key={selectKey}
							name="add-contact-search"
							label="Search and add contact"
							placeholder="Search by name or email..."
							excludedUserIds={excludedUserIds}
							value={null}
							className="bp-contact-select-input"
							onChange={handleSelectUser}
						/>
					) : (
						<div className="bp-master-form-grid">
							<FormInput
								name="manualName"
								label="Name"
								value={manualForm.name}
								onChange={(event) =>
									handleManualFieldChange("name", event.target.value)
								}
							/>

							<FormInput
								name="manualPhoneNumber"
								label="Phone Number"
								value={manualForm.phoneNumber}
								onChange={(event) =>
									handleManualFieldChange("phoneNumber", event.target.value)
								}
							/>

							<FormInput
								name="manualEmail"
								label="Email"
								type="email"
								value={manualForm.email}
								onChange={(event) =>
									handleManualFieldChange("email", event.target.value)
								}
							/>

							<FormInput
								name="manualPanNumber"
								label="PAN Number"
								value={manualForm.panNumber}
								onChange={(event) =>
									handleManualFieldChange("panNumber", event.target.value)
								}
							/>

							<Button
								type="button"
								text="Add to list"
								variant="outline"
								size="sm"
								className="mt-6"
								onClick={handleAddManualEntry}
								disabled={!manualForm.name.trim()}
							/>
						</div>
					)}

					{pending.length > 0 && (
						<div className="bp-people-selected-list">
							{pending.map((entry) => (
								<div key={entry.localId} className="bp-people-selected-chip">
									<div className="bp-people-avatar" aria-hidden="true">
										{getInitials(entry.name)}
									</div>

									<div className="bp-people-user-copy">
										<p className="bp-people-name">
											{entry.name}
											{entry.isManual ? " (manual)" : ""}
										</p>
										<p className="bp-people-id">{entry.email || "--"}</p>
									</div>

									<label className="bp-people-selected-main-check">
										<input
											type="checkbox"
											checked={entry.isMainContact}
											onChange={() => handleToggleMainContact(entry.localId)}
										/>
										<span>Main contact</span>
									</label>

									<button
										type="button"
										className="bp-people-selected-remove"
										aria-label={`Remove ${entry.name} from selection`}
										onClick={() => handleRemovePending(entry.localId)}
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
								: "Unable to add contact"}
						</p>
					)}

					<div className="bp-master-form-actions bp-gen-content-actions">
						<Button
							type="button"
							text="Cancel"
							variant="secondary"
							onClick={handleCancel}
							disabled={isAddingPeople}
						/>

						<Button
							type="button"
							text={isAddingPeople ? "Adding..." : "Add Selected"}
							variant="brand"
							onClick={handleAdd}
							disabled={pending.length === 0 || isAddingPeople}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default BPContact;
