import { useState } from "react";
import BPContact from "./BPContact";
import BPOrganization from "./BPOrganization";
import BPPeople from "./BPPeople";
import BPAddress from "./BPAddress";
import BPMainContact from "./BPMainContact";

const bpTabs = ["Contact", "Organization", "Address", "Main Contact", "People"];

export const BPTabs = () => {
	const [activeTab, setActiveTab] = useState("Contact");
	// const sampleMainContact = {
	// 	name: "John Doe",
	// 	email: "john.doe@joedeengineers.com",
	// 	number: "+91 9876543210",
	// 	address: "342, Bandra West, Mumbai",
	// 	status: "Active",
	// };
	return (
		<>
			{/* Tabs */}
			<div className="bp-tabs">
				{bpTabs.map((tab) => {
					const isActive = activeTab === tab;

					return (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`bp-tab-item ${
								isActive ? "bp-tab-item-active" : "bp-tab-item-inactive"
							}`}
						>
							<span className="bp-tab-label">{tab}</span>
						</button>
					);
				})}
			</div>

			{/* Content */}
			<div className="bp-tab-content">
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
