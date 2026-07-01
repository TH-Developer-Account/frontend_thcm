import BPGenInfo from "./components/BPGenInfo";
import { BPTabs } from "./components/BPTabs";

const BusinessPartnerView = () => {
	return (
		<div className="bp-view-container">
			<BPGenInfo
				title="Joe & De Engineers"
				name="Joe & De Engineers Pvt. Ltd"
				number="+91 9876543210"
				mainContactPerson="John Doe"
				mainContactNumber="+91 9876543210"
				code="J80610"
				zone="WEST"
				status="Active"
			/>
			<div className="bp-tab-container content-box w-full">
				<div className="bp-tab-wrapper">
					<BPTabs />
				</div>
			</div>
		</div>
	);
};

export default BusinessPartnerView;
