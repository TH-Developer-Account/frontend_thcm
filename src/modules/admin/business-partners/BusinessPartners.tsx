import React from "react";
import "./bp.css";
import BPFilters from "./components/BPFilters";
import BPTable from "./components/BPTable";

const BusinessPartners = () => {
	return (
		<React.Fragment>
			<div className="business-partners">
				<div className="bp-header">
					<h3>Business Partners</h3>
				</div>

				<div className="bp-container">
					<div className="bp-box">
						<BPFilters />

						<div className="middle-box">
							<BPTable />
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
};

export default BusinessPartners;
