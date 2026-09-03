import { useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import BPGenInfo from "./components/BPGenInfo";
import { BPTabs } from "./components/BPTabs";
import { useBusinessPartnerView } from "./hooks/useBusinessPartnerQueries";

import type { BusinessPartnerPermissions } from "./utils/bp.types";

const BUSINESS_PARTNER_PERMISSIONS: BusinessPartnerPermissions = {
	address: {
		canCreateAddress: true,
		canUpdateAddress: true,
		canDeleteAddress: true,
		canSetDefaultAddress: true,
	},
	people: {
		canAddPeople: true,
		canSetMainContact: true,
		canRemovePeople: true,
	},
};

const BusinessPartnerView = () => {
	const { id = "" } = useParams<{ id: string }>();

	const { data: view, isLoading, isError } = useBusinessPartnerView(id);

	if (isLoading) {
		return (
			<PageSectionLayout>
				<div role="status">Loading business partner…</div>
			</PageSectionLayout>
		);
	}

	if (isError || !view) {
		return (
			<PageSectionLayout>
				<div role="alert" className="alert-card">
					<h2 className="alert-title">Unable to load business partner</h2>

					<p className="alert-description">
						The requested business The requested business partner could not be
						retrieved.
					</p>
				</div>
			</PageSectionLayout>
		);
	}

	const { partner, primaryContact } = view;

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Business Partners"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Business partners view",
					breadcrumbs: [
						{
							label: "Business Partners",
							href: "/business-partners",
						},
						{
							label: partner.bpName,
						},
					],
					separator: "›",
				}}
			/>

			<div className="bp-view-container">
				<BPGenInfo
					title={partner.bpShortName || partner.bpName}
					name={partner.legalTradeName || partner.bpName}
					number={
						partner.internalId || partner.bpId || partner.s4Id || partner.id
					}
					mainContactPerson={primaryContact?.name || "--"}
					mainContactNumber={primaryContact?.phoneNumber || "--"}
					code={partner.vendorCode || partner.bpShortName || undefined}
					zone={partner.officeType.replaceAll("_", " ")}
					status={partner.isActive ? "Active" : "Inactive"}
				/>

				<Card>
					<BPTabs view={view} permissions={BUSINESS_PARTNER_PERMISSIONS} />
				</Card>
			</div>
		</PageSectionLayout>
	);
};

export default BusinessPartnerView;
