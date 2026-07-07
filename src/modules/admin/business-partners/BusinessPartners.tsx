import React from "react";
import { Plus } from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import BPTable from "./components/BPTable";
import type { BusinessPartner } from "./utils/bp.types";

const BUSINESS_PARTNERS: BusinessPartner[] = [
	{
		id: "bp-1",
		internalId: "94273",
		externalId: "94273",
		organizationName: "Recon Technologies Pvt. Ltd",
		region: "Hyderabad",
		mainContact: "John Doe",
		address: "123 Main St, Anytown, USA",
		joinedOn: "2023-01-15",
	},
	{
		id: "bp-2",
		internalId: "94273",
		externalId: "18209",
		organizationName: "Tricare Services Pvt. Ltd",
		region: "Pune",
		mainContact: "John Doe",
		address: "123 Main St, Anytown, USA",
		joinedOn: "2023-01-15",
	},
	{
		id: "bp-3",
		internalId: "94273",
		externalId: "15812",
		organizationName: "Joe & De Engineers Pvt. Ltd",
		region: "Hyderabad",
		mainContact: "John Doe",
		address: "123 Main St, Anytown, USA",
		joinedOn: "2023-01-15",
	},
	{
		id: "bp-4",
		internalId: "95421",
		externalId: "16382",
		organizationName: "Apex Industrial Services",
		region: "Bengaluru",
		mainContact: "Priya Sharma",
		address: "45 Industrial Layout, Bengaluru, Karnataka",
		joinedOn: "2023-02-18",
	},
	{
		id: "bp-5",
		internalId: "97546",
		externalId: "19273",
		organizationName: "Eastern Machinery Solutions",
		region: "Kolkata",
		mainContact: "Arun Das",
		address: "18 Park Street, Kolkata, West Bengal",
		joinedOn: "2023-03-11",
	},
	{
		id: "bp-6",
		internalId: "98352",
		externalId: "21845",
		organizationName: "Northline Equipment Pvt. Ltd",
		region: "Delhi",
		mainContact: "Rahul Mehta",
		address: "72 Business Park, New Delhi",
		joinedOn: "2023-04-22",
	},
	{
		id: "bp-7",
		internalId: "99173",
		externalId: "23751",
		organizationName: "Western Infrastructure Services",
		region: "Mumbai",
		mainContact: "Neha Patil",
		address: "21 MIDC Road, Mumbai, Maharashtra",
		joinedOn: "2023-05-09",
	},
];

const BusinessPartners = () => {
	const [search, setSearch] = React.useState("");

	const filteredPartners = React.useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		if (!normalizedSearch) {
			return BUSINESS_PARTNERS;
		}

		return BUSINESS_PARTNERS.filter((partner) => {
			const searchableValue = [
				partner.internalId,
				partner.externalId,
				partner.organizationName,
				partner.region,
				partner.mainContact,
				partner.address,
			]
				.join(" ")
				.toLowerCase();

			return searchableValue.includes(normalizedSearch);
		});
	}, [search]);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Business Partners"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Business partners page location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Business Partners",
						},
					],
					separator: "›",
				}}
			/>

			<Card
				className="bp-listing-card"
				secondaryHeader={
					<div className="bp-listing-toolbar">
						<div className="bp-listing-search">
							<SearchInput
								value={search}
								onChange={setSearch}
								placeholder="Search business partners"
								aria-label="Search business partners"
							/>
						</div>

						<div className="bp-listing-action">
							<Button
								type="button"
								text="Create New"
								Icon={Plus}
								iconPosition="left"
								iconSize={16}
								appearance="standard"
								variant="brand"
								size="sm"
								// onClick={onCreateNew}
							/>
						</div>
					</div>
				}
			>
				<BPTable partners={filteredPartners} />
			</Card>
		</PageSectionLayout>
	);
};

export default BusinessPartners;
