import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../../components/common/Button";
import { FilterTabs } from "../../../../components/ui/FilterTabs";

import {
	useBusinessPartnerSectionEditor,
	businessPartnerPaths,
	type DetailFormSection,
} from "../hooks/useBusinessPartnerForm";

import type {
	BusinessPartnerPermissions,
	BusinessPartnerViewModel,
} from "../utils/bp.types";
import BPContact from "./BPContact";
import BPAddress from "./BPAddress";
import BPBranches from "./BPBranches";
// import { BPGeneralInfoForm } from "./BPGenInfo";
import { BPOrganizationForm } from "./BPOrganization";
import BPPeople from "./BPPeople";

const bpTabs = [
	// { value: "general", label: "General", controlsId: "bp-tab-general-panel" },
	{
		value: "organization",
		label: "Organization",
		shortLabel: "Org",
		controlsId: "bp-tab-organization-panel",
	},
	{ value: "contact", label: "Contact", controlsId: "bp-tab-contact-panel" },
	{ value: "address", label: "Address", controlsId: "bp-tab-address-panel" },
	{
		value: "branches",
		label: "Branches",
		controlsId: "bp-tab-branches-panel",
	},
	{ value: "people", label: "People", controlsId: "bp-tab-people-panel" },
] as const;

type BPTab = (typeof bpTabs)[number]["value"];

type BPTabsProps = {
	view: BusinessPartnerViewModel;
	permissions: BusinessPartnerPermissions;
};

// const isBPTab = (value: string): value is BPTab =>
// 	bpTabs.some((tab) => tab.value === value);

const SECTION_LABELS: Record<Exclude<DetailFormSection, null>, string> = {
	general: "General Information",
	organization: "Organization Information",
	contact: "Contact Information",
	address: "Address Information",
};

const isContactDataEmpty = (view: BusinessPartnerViewModel): boolean =>
	!view.partner.mobileNumber &&
	!view.partner.email &&
	!view.partner.telephone &&
	!view.partner.fax;

export const BPTabs = ({ view, permissions }: BPTabsProps) => {
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState<BPTab>(() =>
		isContactDataEmpty(view) ? "contact" : "organization",
	);
	const activeTabId = `bp-tab-${activeTab}`;
	const activePanelId = `${activeTabId}-panel`;

	// Controls whether the "Add Address" create form is open — lifted
	// up here so the trigger button can live next to the other tab
	// action rows (Edit General/Org/Contact, Add Branch).
	const [isAddingAddress, setIsAddingAddress] = useState(false);

	// Controls the "Add Contact" search-or-manual panel on the Contact tab.
	const [isAddingContact, setIsAddingContact] = useState(false);

	// Same lifted pattern for the "Add People" search-and-attach panel.
	const [isAddingPeople, setIsAddingPeople] = useState(false);

	const detailForm = useBusinessPartnerSectionEditor({
		partner: view.partner,
		permissions,
	});

	const handleAddBranch = () => {
		navigate(
			`${businessPartnerPaths.create()}?parentId=${encodeURIComponent(view.partner.id)}`,
		);
	};
	const canUpdateSection = (
		section: Exclude<DetailFormSection, null>,
	): boolean => {
		switch (section) {
			case "general":
				return permissions.general.canUpdateGeneral;
			case "organization":
				return permissions.organization.canUpdateOrganization;
			case "contact":
				return permissions.contact.canUpdateContact;
			case "address":
				return permissions.address.canUpdateAddress;
			default:
				return false;
		}
	};
	const renderDetailSection = (
		section: Exclude<DetailFormSection, null>,
		readView: React.ReactNode,
		formView: React.ReactNode,
	) => {
		const showForm = detailForm.editingSection === section;

		if (!showForm) {
			return (
				<div className="bp-gen-content">
					{readView}

					{canUpdateSection(section) && (
						<div className="bp-gen-content-actions">
							<Button
								type="button"
								text={`Edit ${SECTION_LABELS[section]}`}
								variant="outline"
								size="sm"
								Icon={Pencil}
								onClick={() => detailForm.startEditing(section)}
							/>
						</div>
					)}
				</div>
			);
		}

		return (
			<div className="bp-gen-content">
				{formView}

				{detailForm.error && (
					<p className="bp-master-form-error" role="alert">
						{detailForm.error}
					</p>
				)}

				<div className="bp-master-form-actions">
					<Button
						type="button"
						text="Cancel"
						variant="secondary"
						onClick={detailForm.cancelEditing}
						disabled={detailForm.isSaving}
					/>

					<Button
						type="button"
						text={detailForm.isSaving ? "Saving..." : "Save"}
						variant="brand"
						onClick={() => {
							console.log(
								"[BPTabs] Save button clicked, section:",
								section,
								"editingSection:",
								detailForm.editingSection,
							);
							detailForm.handleSave();
						}}
						disabled={detailForm.isSaving}
					/>
				</div>
			</div>
		);
	};
	return (
		<>
			<FilterTabs
				id="bp-tab"
				items={bpTabs}
				value={activeTab}
				onChange={setActiveTab}
				ariaLabel="Business partner details"
				variant="soft"
			/>

			<div
				id={activePanelId}
				aria-labelledby={activeTabId}
				className="bp-tab-content"
				role="tabpanel"
				tabIndex={0}
			>
				{/* {activeTab === "general" &&
					renderDetailSection(
						"general",
						<div className="detail-section">
							<div className="detail-grid">
								<div className="detail-row">
									<p className="detail-label">Internal ID</p>
									<p className="detail-value">{view.partner.internalId}</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">BP Name</p>
									<p className="detail-value">{view.partner.bpName}</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">Office Type</p>
									<p className="detail-value">
										{view.partner.officeType.replaceAll("_", " ")}
									</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">BP Type</p>
									<p className="detail-value">{view.partner.bpType}</p>
								</div>
							</div>
						</div>,
						<BPGeneralInfoForm
							form={detailForm.form}
							onChange={detailForm.handleChange}
						/>,
					)} */}

				{activeTab === "contact" && (
					<div className="bp-gen-content">
						<BPContact
							businessPartnerId={view.partner.id}
							contacts={view.contacts}
							permissions={permissions.people}
							isAdding={isAddingContact}
							onAddContact={() => setIsAddingContact(true)}
							onCancelAdd={() => setIsAddingContact(false)}
							onAdded={() => setIsAddingContact(false)}
						/>

						{permissions.people.canAddPeople &&
							view.contacts.length > 0 &&
							!isAddingContact && (
								<div className="bp-gen-content-actions">
									<Button
										type="button"
										text="Add Contact"
										Icon={Plus}
										iconPosition="left"
										appearance="standard"
										variant="outline"
										size="sm"
										onClick={() => setIsAddingContact(true)}
										disabled={isAddingContact}
									/>
								</div>
							)}
					</div>
				)}

				{activeTab === "organization" &&
					renderDetailSection(
						"organization",
						<div className="detail-section">
							<div className="detail-grid">
								<div className="detail-row">
									<p className="detail-label">Legal Trade Name</p>
									<p className="detail-value">
										{view.partner.legalTradeName || "--"}
									</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">Entity Type</p>
									<p className="detail-value">
										{view.partner.entityType || "--"}
									</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">Joined On</p>
									<p className="detail-value">
										{view.partner.joinedOn || "--"}
									</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">Vendor ID</p>
									<p className="detail-value">
										{view.partner.vendorId || "--"}
									</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">Vendor Code</p>
									<p className="detail-value">
										{view.partner.vendorCode || "--"}
									</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">S4 ID</p>
									<p className="detail-value">{view.partner.s4Id || "--"}</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">BYD ID</p>
									<p className="detail-value">{view.partner.bydId || "--"}</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">C4C ID</p>
									<p className="detail-value">{view.partner.c4cId || "--"}</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">GST Number</p>
									<p className="detail-value">{view.partner.gst || "--"}</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">PAN Number</p>
									<p className="detail-value">
										{view.partner.panNumber || "--"}
									</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">Key Account</p>
									<p className="detail-value">
										{view.partner.isKeyAccount ? "Yes" : "No"}
									</p>
								</div>
								<div className="detail-row">
									<p className="detail-label">Active</p>
									<p className="detail-value">
										{view.partner.isActive ? "Yes" : "No"}
									</p>
								</div>
							</div>
						</div>,
						<BPOrganizationForm
							form={detailForm.form}
							onChange={detailForm.handleChange}
						/>,
					)}

				{activeTab === "address" && (
					<div className="bp-gen-content">
						{view.addresses.length === 0 && !isAddingAddress ? (
							<div className="bp-address-empty-state">
								<div className="bp-address-empty-content">
									<p className="bp-address-empty-title">
										No addresses added yet
									</p>

									<p className="bp-address-empty-description">
										Add an address to keep the business partner's location
										information up to date.
									</p>

									{permissions.address.canCreateAddress && (
										<div className="bp-gen-content-actions">
											<Button
												type="button"
												text="Add Address"
												Icon={Plus}
												iconPosition="left"
												appearance="standard"
												variant="outline"
												size="sm"
												onClick={() => setIsAddingAddress(true)}
											/>
										</div>
									)}
								</div>
							</div>
						) : (
							<>
								<BPAddress
									businessPartnerId={view.partner.id}
									addresses={view.addresses}
									permissions={permissions.address}
									isAdding={isAddingAddress}
									onCancelAdd={() => setIsAddingAddress(false)}
									onAdded={() => setIsAddingAddress(false)}
								/>

								{permissions.address.canCreateAddress && (
									<div className="bp-gen-content-actions">
										<Button
											type="button"
											text="Add Address"
											Icon={Plus}
											iconPosition="left"
											appearance="standard"
											variant="outline"
											size="sm"
											onClick={() => setIsAddingAddress(true)}
											disabled={isAddingAddress}
										/>
									</div>
								)}
							</>
						)}
					</div>
				)}

				{activeTab === "branches" && (
					<div className="bp-gen-content">
						<BPBranches
							branches={view.branches}
							onAddBranch={handleAddBranch}
						/>

						{permissions.canCreateBusinessPartner &&
							view.branches.length > 0 && (
								<div className="bp-gen-content-actions">
									<Button
										type="button"
										text="Add Branch"
										Icon={Plus}
										iconPosition="left"
										appearance="standard"
										variant="outline"
										size="sm"
										onClick={handleAddBranch}
									/>
								</div>
							)}
					</div>
				)}

				{activeTab === "people" && (
					<div className="bp-gen-content">
						<BPPeople
							businessPartnerId={view.partner.id}
							people={view.people}
							permissions={permissions.people}
							isAdding={isAddingPeople}
							onAddPeople={() => setIsAddingPeople(true)}
							onCancelAdd={() => setIsAddingPeople(false)}
							onAdded={() => setIsAddingPeople(false)}
						/>

						{permissions.people.canAddPeople &&
							view.people.length > 0 &&
							!isAddingPeople && (
								<div className="bp-gen-content-actions">
									<Button
										type="button"
										text="Add People"
										Icon={Plus}
										iconPosition="left"
										appearance="standard"
										variant="outline"
										size="sm"
										onClick={() => setIsAddingPeople(true)}
										disabled={isAddingPeople}
									/>
								</div>
							)}
					</div>
				)}
			</div>
		</>
	);
};

export default BPTabs;
