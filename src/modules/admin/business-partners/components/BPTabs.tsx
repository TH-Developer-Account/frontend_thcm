import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../../components/common/Button";
import { FilterTabs } from "../../../../components/ui/FilterTabs";

import {
	useBusinessPartnerForm,
	businessPartnerPaths,
	type DetailFormSection,
} from "../hooks/useBusinessPartnerForm";

import type {
	BusinessPartnerPermissions,
	BusinessPartnerViewModel,
} from "../utils/bp.types";

import BPAddress from "./BPAddress";
import BPBranches from "./BPBranches";
import BPContact, { BPContactForm } from "./BPContact";
import { BPGeneralInfoForm } from "./BPGenInfo";
import BPOrganization, { BPOrganizationForm } from "./BPOrganization";
import BPPeople from "./BPPeople";

const bpTabs = [
	{ value: "general", label: "General", controlsId: "bp-tab-general-panel" },
	{ value: "contact", label: "Contact", controlsId: "bp-tab-contact-panel" },
	{
		value: "organization",
		label: "Organization",
		shortLabel: "Org",
		controlsId: "bp-tab-organization-panel",
	},
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

const isBPTab = (value: string): value is BPTab =>
	bpTabs.some((tab) => tab.value === value);

const SECTION_LABELS: Record<Exclude<DetailFormSection, null>, string> = {
	general: "General Information",
	organization: "Organization Information",
	contact: "Contact Information",
};

const isOrgDataEmpty = (view: BusinessPartnerViewModel): boolean =>
	!view.partner.gst &&
	!view.partner.panNumber &&
	!view.partner.legalTradeName &&
	!view.partner.vendorCode &&
	!view.partner.entityType &&
	!view.partner.joinedOn;

const isContactDataEmpty = (view: BusinessPartnerViewModel): boolean =>
	!view.partner.mobileNumber &&
	!view.partner.email &&
	!view.partner.telephone &&
	!view.partner.fax;

export const BPTabs = ({ view, permissions }: BPTabsProps) => {
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState<BPTab>("general");
	const activeTabId = `bp-tab-${activeTab}`;
	const activePanelId = `${activeTabId}-panel`;

	// Controls whether the "Add Address" create form is open — lifted
	// up here so the trigger button can live next to the other tab
	// action rows (Edit General/Org/Contact, Add Branch).
	const [isAddingAddress, setIsAddingAddress] = useState(false);

	// Same lifted pattern for the "Add People" search-and-attach panel.
	const [isAddingPeople, setIsAddingPeople] = useState(false);

	const detailForm = useBusinessPartnerForm({
		partner: view.partner,
		permissions,
	});

	// Auto-open an empty section into edit mode exactly once, on first
	// load — via a real startEditing() call, so editingSection is
	// genuinely set and Save works. Never re-fires on later renders,
	// and never overrides a section the user is actively editing.
	const hasAutoOpened = useRef(false);

	useEffect(() => {
		if (hasAutoOpened.current) return;
		if (detailForm.editingSection !== null) return;

		if (isContactDataEmpty(view)) {
			console.log("[BPTabs] auto-opening contact (empty data)");
			detailForm.startEditing("contact");
			hasAutoOpened.current = true;
			return;
		}

		if (isOrgDataEmpty(view)) {
			console.log("[BPTabs] auto-opening organization (empty data)");
			detailForm.startEditing("organization");
			hasAutoOpened.current = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view]);

	const handleAddBranch = () => {
		navigate(
			`${businessPartnerPaths.create()}?parentId=${encodeURIComponent(view.partner.id)}`,
		);
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

					{permissions.canUpdateBusinessPartner && (
						<div className="bp-gen-content-actions">
							<Button
								type="button"
								text={`Edit ${SECTION_LABELS[section]}`}
								variant="outline"
								size="sm"
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
				{activeTab === "general" &&
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
					)}

				{activeTab === "contact" &&
					renderDetailSection(
						"contact",
						<BPContact
							data={{
								...view.contact,
								mobile_number: view.contact.mobileNumber,
							}}
							onNavigateTab={(tab) => {
								const normalizedTab = tab.toLowerCase().replace(/\s+/g, "-");

								if (isBPTab(normalizedTab)) {
									setActiveTab(normalizedTab);
								}
							}}
						/>,
						<BPContactForm
							form={detailForm.form}
							onChange={detailForm.handleChange}
						/>,
					)}

				{activeTab === "organization" &&
					renderDetailSection(
						"organization",
						<BPOrganization data={view.organization} />,
						<BPOrganizationForm
							form={detailForm.form}
							onChange={detailForm.handleChange}
						/>,
					)}

				{activeTab === "address" && (
					<div className="bp-gen-content">
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
					</div>
				)}

				{activeTab === "branches" && (
					<div className="bp-gen-content">
						<BPBranches branches={view.branches} />

						{permissions.canCreateBusinessPartner && (
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
							onCancelAdd={() => setIsAddingPeople(false)}
							onAdded={() => setIsAddingPeople(false)}
						/>

						{permissions.people.canAddPeople && (
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
