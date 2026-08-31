import { useState } from "react";

import Card from "../../../components/common/Card";
import FilterDropdown from "../../../components/common/FilterDropdown";
import { SearchInput } from "../../../components/forms/SearchInput";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import BPTable from "./components/BPTable";
import type { BusinessPartnerFilters } from "./utils/bp.types";
import { FILTER_SECTIONS } from "./utils/bp.constant";

const INITIAL_FILTERS: BusinessPartnerFilters = {
	status: [],
	zone: [],
};

const BusinessPartners = () => {
	const [search, setSearch] = useState("");
	const [filters, setFilters] =
		useState<BusinessPartnerFilters>(INITIAL_FILTERS);

	const handleFilterChange = (updated: Partial<BusinessPartnerFilters>) => {
		setFilters((current) => ({ ...current, ...updated }));
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Business Partners"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Business partners page location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "Business Partners" },
					],
					separator: "›",
				}}
			/>

			<Card
				className="bp-listing-card"
				title={
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search business partners"
						aria-label="Search business partners"
					/>
				}
				actions={
					<>
						<FilterDropdown
							filters={filters}
							sections={FILTER_SECTIONS}
							onChange={handleFilterChange}
							onClearAll={() => setFilters(INITIAL_FILTERS)}
							title="Business Partner Filters"
							ariaLabel="Filter business partners"
						/>
					</>
				}
			>
				<BPTable
					partners={[]}
					isLoading={false}
					isFetching={false}
					isError={false}
				/>
			</Card>
		</PageSectionLayout>
	);
};

export default BusinessPartners;
