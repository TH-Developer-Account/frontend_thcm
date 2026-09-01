import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import BPGenInfo from "./components/BPGenInfo";
import { BPTabs } from "./components/BPTabs";

const BusinessPartnerView = () => {
	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Business Partners"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Business partners view",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Business Partner View",
						},
					],
					separator: "›",
				}}
			/>

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

				<Card>
					<BPTabs />
				</Card>
			</div>
		</PageSectionLayout>
	);
};

export default BusinessPartnerView;
