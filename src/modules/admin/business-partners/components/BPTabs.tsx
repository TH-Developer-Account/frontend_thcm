import { useState } from "react";

const bpTabs = ["Contact", "Organization", "Address", "People"];

export const BPTabs = () => {
	const [activeTab, setActiveTab] = useState("Contact");

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
			{/* <div className="bp-tab-content">
				{activeTab === "Contact" && <Contact />}
				{activeTab === "Organization" && <Organization />}
				{activeTab === "Address" && <Address />}
				{activeTab === "People" && <People />}
			</div> */}
		</>
	);
};
export default BPTabs;
