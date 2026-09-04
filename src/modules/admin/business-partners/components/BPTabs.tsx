import { useState } from "react";

import { FilterTabs } from "../../../../components/ui/FilterTabs";

import type {
	BusinessPartnerPermissions,
	BusinessPartnerViewModel,
} from "../utils/bp.types";

import BPAddress from "./BPAddress";
import BPBranches from "./BPBranches";
import BPContact from "./BPContact";
import BPOrganization from "./BPOrganization";
import BPPeople from "./BPPeople";

const bpTabs = [
	{
		value: "contact",
		label: "Contact",
		controlsId: "bp-tab-contact-panel",
	},
	{
		value: "organization",
		label: "Organization",
		shortLabel: "Org",
		controlsId: "bp-tab-organization-panel",
	},
	{
		value: "address",
		label: "Address",
		controlsId: "bp-tab-address-panel",
	},
	{
		value: "branches",
		label: "Branches",
		controlsId: "bp-tab-branches-panel",
	},
	{
		value: "people",
		label: "People",
		controlsId: "bp-tab-people-panel",
	},
] as const;

type BPTab = (typeof bpTabs)[number]["value"];

type BPTabsProps = {
	view: BusinessPartnerViewModel;
	permissions: BusinessPartnerPermissions;
};

const isBPTab = (value: string): value is BPTab =>
	bpTabs.some((tab) => tab.value === value);

export const BPTabs = ({ view, permissions }: BPTabsProps) => {
	const [activeTab, setActiveTab] = useState<BPTab>("contact");

	const activeTabId = `bp-tab-${activeTab}`;
	const activePanelId = `${activeTabId}-panel`;

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
				{activeTab === "contact" && (
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
					/>
				)}

				{activeTab === "organization" && (
					<BPOrganization data={view.organization} />
				)}

				{activeTab === "address" && (
					<BPAddress
						businessPartnerId={view.partner.id}
						addresses={view.addresses}
						permissions={permissions.address}
					/>
				)}

				{activeTab === "branches" && <BPBranches branches={view.branches} />}

				{activeTab === "people" && (
					<BPPeople
						businessPartnerId={view.partner.id}
						people={view.people}
						permissions={permissions.people}
					/>
				)}
			</div>
		</>
	);
};

export default BPTabs;
