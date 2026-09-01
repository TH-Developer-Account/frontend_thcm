import { useState } from "react";
import type { BusinessPartnerViewModel } from "../hooks/useBusinessPartners";
import BPAddress from "./BPAddress";
import BPContact from "./BPContact";
import BPMainContact from "./BPMainContact";
import BPOrganization from "./BPOrganization";
import BPPeople from "./BPPeople";
import BPBranches from "./BPBranches";

const bpTabs = [
	"Contact",
	"Organization",
	"Address",
	"Branches",
	"Main Contact",
	"People",
] as const;
type BPTab = (typeof bpTabs)[number];

export const BPTabs = ({ view }: { view: BusinessPartnerViewModel }) => {
	const [activeTab, setActiveTab] = useState<BPTab>("Contact");

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
							onClick={() => setActiveTab(tab)}
							className={`bp-tab-item ${isActive ? "bp-tab-item-active" : ""}`}
						>
							<span className="bp-tab-label">{tab}</span>
						</button>
					);
				})}
			</div>
			<div
				id={`bp-tab-${activeTab.toLowerCase().replace(/\s+/g, "-")}-panel`}
				className="bp-tab-content"
				role="tabpanel"
			>
				{activeTab === "Contact" && (
					<BPContact
						onNavigateTab={(tab) => {
							if (bpTabs.includes(tab as BPTab)) setActiveTab(tab as BPTab);
						}}
						data={{ ...view.contact, mobile_number: view.contact.mobileNumber }}
					/>
				)}
				{activeTab === "Organization" && (
					<BPOrganization data={view.organization} />
				)}
				{activeTab === "Address" && <BPAddress addresses={view.addresses} />}
				{activeTab === "Branches" && <BPBranches branches={view.branches} />}
				{activeTab === "Main Contact" && (
					<BPMainContact contacts={view.mainContacts} />
				)}
				{activeTab === "People" && <BPPeople people={view.people} />}
			</div>
		</>
	);
};
export default BPTabs;
