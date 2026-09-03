import { useState } from "react";

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
	"Contact",
	"Organization",
	"Address",
	"Branches",
	"People",
] as const;

type BPTab = (typeof bpTabs)[number];

type BPTabsProps = {
	view: BusinessPartnerViewModel;
	permissions: BusinessPartnerPermissions;
};

const isBPTab = (value: string): value is BPTab =>
	bpTabs.some((tab) => tab === value);

export const BPTabs = ({ view, permissions }: BPTabsProps) => {
	const [activeTab, setActiveTab] = useState<BPTab>("Contact");

	const activeTabId = `bp-tab-${activeTab.toLowerCase().replace(/\s+/g, "-")}`;

	return (
		<>
			<div
				className="bp-tabs"
				role="tablist"
				aria-label="Business partner details"
			>
				{bpTabs.map((tab) => {
					const isActive = activeTab === tab;

					const tabId = `bp-tab-${tab.toLowerCase().replace(/\s+/g, "-")}`;

					return (
						<button
							key={tab}
							id={tabId}
							type="button"
							role="tab"
							aria-selected={isActive}
							aria-controls={`${tabId}-panel`}
							tabIndex={isActive ? 0 : -1}
							onClick={() => setActiveTab(tab)}
							className={`bp-tab-item ${isActive ? "bp-tab-item-active" : ""}`}
						>
							<span className="bp-tab-label">{tab}</span>
						</button>
					);
				})}
			</div>

			<div
				id={`${activeTabId}-panel`}
				aria-labelledby={activeTabId}
				className="bp-tab-content"
				role="tabpanel"
			>
				{activeTab === "Contact" && (
					<BPContact
						data={{
							...view.contact,
							mobile_number: view.contact.mobileNumber,
						}}
						onNavigateTab={(tab) => {
							if (isBPTab(tab)) {
								setActiveTab(tab);
							}
						}}
					/>
				)}

				{activeTab === "Organization" && (
					<BPOrganization data={view.organization} />
				)}

				{activeTab === "Address" && (
					<BPAddress
						businessPartnerId={view.partner.id}
						addresses={view.addresses}
						permissions={permissions.address}
					/>
				)}

				{activeTab === "Branches" && <BPBranches branches={view.branches} />}

				{activeTab === "People" && (
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
