import BPGenInfo from "./components/BPGenInfo";
import BPInfo from "./components/BPInfo";
import { BPTabs } from "./components/BPTabs";

const BusinessPartnerView = () => {
	return (
		<div className="bp-view-container">
			<BPGenInfo />
			<div className="bp-tab-container content-box">
				<div className="bp-tab-wrapper">
					<BPTabs />
				</div>

				<div className="tab-view ">
					<BPInfo />
				</div>
			</div>
		</div>
	);
};

export default BusinessPartnerView;
