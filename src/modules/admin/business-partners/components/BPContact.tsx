import { useState } from "react";
import { Check, Mail, Phone, X } from "lucide-react";

import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/forms/FormInput";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";
import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";
import UserAsyncSelect from "../../../../components/forms/AsyncSelect";

import { useBPPeopleManager } from "../hooks/useBusinessPartners";
import { useBusinessPartnerPeopleMutations } from "../hooks/useBusinessPartnerMutations";

import type {
	BPContactViewModel,
	BPPeoplePermissions,
	BusinessPartnerFormState,
} from "../utils/bp.types";

type BPContactProps = {
	businessPartnerId: string;
	contacts: BPContactViewModel[];
	permissions: BPPeoplePermissions;

	/** Controlled from BPTabs via the "Add Contact" action row. */
	isAdding: boolean;
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
			key: "id",
			header: "ID",
			widthUnits: 2,
			minWidth: 130,
			render: (contact) => (
				<span className="bp-people-id">{contact.id.slice(0, 8)}</span>
			),
		},

		{
			key: "name",
			header: "Name",
			widthUnits: 3,
			minWidth: 190,
			render: (contact) => (
				<div className="bp-people-user">
					<div className="bp-people-avatar" aria-hidden="true">
						{getInitials(contact.name)}
					</div>

					<div className="bp-people-user-copy">
						<p className="bp-people-name">{contact.name}</p>
					</div>
				</div>
			),
		},

		{
			key: "phoneNumber",
			header: "Phone Number",
			widthUnits: 2,
			minWidth: 160,
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
			header: "Email Id",
			widthUnits: 3,
			minWidth: 210,
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

		{
			key: "isOwner",
			header: "Is Owner",
			widthUnits: 1,
			minWidth: 100,
			render: (contact) =>
				contact.isOwner ? (
					<Check size={16} aria-label="Owner" />
				) : (
					<span>--</span>
				),
		},

		{
			key: "isMainContact",
			header: "Is Main Contact",
			widthUnits: 1,
			minWidth: 130,
			render: (contact) => {
				const isMain = contact.isMainContact;

				if (canSetMainContact) {
					return (
						<button
							type="button"
							className="bp-people-main-toggle"
							disabled={isMain || isUpdating}
							onClick={() => onSetMainContact(contact)}
							aria-label={
								isMain
									? `${contact.name} is already the main contact`
									: `Set ${contact.name} as main contact`
							}
						>
							{isMain ? <Check size={16} aria-hidden="true" /> : "--"}
						</button>
					);
				}

				return isMain ? (
					<Check size={16} aria-label="Main contact" />
				) : (
					<span>--</span>
				);
			},
		},

		{
			key: "businessPartnerId",
			header: "BP ID",
			widthUnits: 3,
			minWidth: 190,
			render: (contact) => <span>{contact.businessPartnerId || "--"}</span>,
		},
	];

	if (canRemovePeople) {
		columns.push({
			key: "actions",
			header: "",
			widthUnits: 1,
			minWidth: 60,
			render: (contact) =>
				contact.isOwner ? null : (
					<button
						type="button"
						className="bp-people-selected-remove"
						aria-label={`Remove ${contact.name} from this business partner`}
						disabled={isRemoving}
						onClick={() => onRemove(contact)}
					>
						<X size={14} aria-hidden="true" />
					</button>
				),
		});
	}

	return columns;
};

const BPContact = ({
	businessPartnerId,
	contacts,
	permissions,
	isAdding,
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
	} = useBPPeopleManager(businessPartnerId, contacts, permissions);

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
		<div className="bp-people">
			<SimpleViewTable
				data={sortedPeople}
				columns={columns}
				getRowId={(contact) => contact.id}
				maxHeight="360px"
				className="bp-people-view-table"
				ariaLabel="Business partner contacts"
				emptyTitle="No contacts found"
				emptyDescription="No contacts are associated with this business partner."
			/>

			{isAdding && (
				<div className="bp-people-add-panel">
					<div className="bp-contact-add-mode-toggle" role="tablist">
						<button
							type="button"
							role="tab"
							aria-selected={addMode === "search"}
							className={
								addMode === "search"
									? "bp-contact-mode-tab bp-contact-mode-tab-active"
									: "bp-contact-mode-tab"
							}
							onClick={() => setAddMode("search")}
						>
							Search Existing User
						</button>

						<button
							type="button"
							role="tab"
							aria-selected={addMode === "manual"}
							className={
								addMode === "manual"
									? "bp-contact-mode-tab bp-contact-mode-tab-active"
									: "bp-contact-mode-tab"
							}
							onClick={() => setAddMode("manual")}
						>
							Add Manually
						</button>
					</div>

					{addMode === "search" ? (
						<UserAsyncSelect
							key={selectKey}
							name="add-contact-search"
							label="Search and add contact"
							placeholder="Search by name or email..."
							excludedUserIds={excludedUserIds}
							value={null}
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

					<div className="bp-master-form-actions">
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

/* Unchanged: edit form for the BP's own contact fields (mobile/email/telephone/fax). */
type FormChangeHandler = <K extends keyof BusinessPartnerFormState>(
	key: K,
	value: BusinessPartnerFormState[K],
) => void;

type BPContactFormProps = {
	form: BusinessPartnerFormState;
	onChange: FormChangeHandler;
};

export const BPContactForm = ({ form, onChange }: BPContactFormProps) => (
	<section
		className="bp-create-form-section"
		aria-labelledby="contact-information-heading"
	>
		<h3 id="contact-information-heading" className="sr-only">
			Contact Information
		</h3>

		<div className="bp-master-form-grid">
			<FormInput
				name="mobileNumber"
				label="Mobile Number"
				value={form.mobileNumber}
				onChange={(event) => onChange("mobileNumber", event.target.value)}
			/>

			<FormInput
				name="email"
				label="Email"
				type="email"
				value={form.email}
				onChange={(event) => onChange("email", event.target.value)}
			/>

			<FormInput
				name="telephone"
				label="Telephone"
				value={form.telephone}
				onChange={(event) => onChange("telephone", event.target.value)}
			/>

			<FormInput
				name="fax"
				label="Fax"
				value={form.fax}
				onChange={(event) => onChange("fax", event.target.value)}
			/>
		</div>
	</section>
);

export default BPContact;
