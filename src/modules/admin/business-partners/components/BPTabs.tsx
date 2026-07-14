import { useState } from "react";

import BPAddress from "./BPAddress";
import BPContact from "./BPContact";
import BPMainContact from "./BPMainContact";
import BPOrganization from "./BPOrganization";
import BPPeople from "./BPPeople";

const bpTabs = ["Contact", "Organization", "Address", "Main Contact", "People"];

export const BPTabs = () => {
	const [activeTab, setActiveTab] = useState("Contact");

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
					const panelId = `${tabId}-panel`;

					return (
						<button
							key={tab}
							id={tabId}
							type="button"
							role="tab"
							aria-selected={isActive}
							aria-controls={panelId}
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
				aria-labelledby={`bp-tab-${activeTab.toLowerCase().replace(/\s+/g, "-")}`}
			>
				{activeTab === "Contact" && (
					<BPContact
						onNavigateTab={(tab) => setActiveTab(tab)}
						data={{
							name: "Joe & De Engineers Pvt. Ltd",
							email: "joedeengineers@gmail.com",
							mobile_number: "+91 9876543210",
							fax: "",
							status: "Active",
							mainContactPerson: "John Doe",
							mainContactNumber: "+91 9876543210",
							state: "Maharashtra",
							city: "Mumbai",
							country: "India",
						}}
					/>
				)}

				{activeTab === "Organization" && (
					<BPOrganization
						data={{
							orgName: "Joe & De Engineers Pvt. Ltd",
							joinedOn: "12 Jan 2022",
							branches: "8",
							gstNo: "29ABCDE1234F1Z5",
							panNo: "ABCDE1234F",
							registrationNo: "U12345KA2022PTC000111",
							bpCode: "J80610",
							zone: "WEST",
							segment: "Industrial Equipment",
							category: "Authorized Dealer",
							partnerType: "Distributor",
							status: "Active",
							website: "www.joedeengineers.com",
						}}
					/>
				)}

				{activeTab === "Address" && <BPAddress />}
				{activeTab === "Main Contact" && <BPMainContact />}
				{activeTab === "People" && <BPPeople />}
			</div>
		</>
	);
};

export default BPTabs;
