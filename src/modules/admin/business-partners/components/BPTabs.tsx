import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../../components/common/Button";
import { FilterTabs } from "../../../../components/ui/FilterTabs";

import type {
	BusinessPartnerPermissions,
	BusinessPartnerViewModel,
} from "../utils/bp.types";
import BPContact from "./BPContact";
import BPAddress from "./BPAddress";
import BPBranches from "./BPBranches";
import BPGeneralInfoCard from "./BPGeneralInfoCard";
import BPOrganizationCard from "./BPOrganizationCard";
import BPUsers from "./BPUsers";
import { businessPartnerPaths } from "../utils/businessPartner.paths";

const bpTabs = [
	{ value: "general", label: "General", controlsId: "bp-tab-general-panel" },
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
	// { value: "users", label: "Users", controlsId: "bp-tab-users-panel" },
] as const;

type BPTab = (typeof bpTabs)[number]["value"];

type BPTabsProps = {
	view: BusinessPartnerViewModel;
	permissions: BusinessPartnerPermissions;
};

// const isBPTab = (value: string): value is BPTab =>
// 	bpTabs.some((tab) => tab.value === value);

const isOrgDataEmpty = (view: BusinessPartnerViewModel): boolean =>
	!view.partner.gst &&
	!view.partner.panNumber &&
	!view.partner.legalTradeName &&
	!view.partner.vendorCode &&
	!view.partner.entityType &&
	!view.partner.joinedOn;

export const BPTabs = ({ view, permissions }: BPTabsProps) => {
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState<BPTab>("general");
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

	const handleAddBranch = () => {
		navigate(
			`${businessPartnerPaths.create()}?parentId=${encodeURIComponent(view.partner.id)}`,
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
				{activeTab === "general" && (
					<div className="bp-gen-content">
						<BPGeneralInfoCard
							key={view.partner.id}
							partner={view.partner}
							parentIdFromQuery=""
							parentPartner={null}
							canSubmit={permissions.general.canUpdateGeneral}
							allowViewToggle
						/>
					</div>
				)}

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

				{activeTab === "organization" && (
					<div className="bp-gen-content">
						<BPOrganizationCard
							key={view.partner.id}
							partner={view.partner}
							canSubmit={permissions.organization.canUpdateOrganization}
							startInEditMode={isOrgDataEmpty(view)}
						/>
					</div>
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
						<BPUsers businessPartnerId={view.partner.id} />

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
