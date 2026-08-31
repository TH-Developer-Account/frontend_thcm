import type { FilterSection } from "../../../../components/common/FilterDropdown";
import type { BusinessPartnerFilters } from "./bp.types";

export const FILTER_SECTIONS: readonly FilterSection<BusinessPartnerFilters>[] =
	[
		{
			type: "checkbox",
			key: "status",
			label: "Status",
			options: [
				{ label: "Active", value: "ACTIVE" },
				{ label: "Inactive", value: "INACTIVE" },
			],
			columns: 1,
		},
		{
			type: "checkbox",
			key: "zone",
			label: "Zone",
			options: [
				{ label: "North", value: "NORTH" },
				{ label: "South", value: "SOUTH" },
				{ label: "East", value: "EAST" },
				{ label: "West", value: "WEST" },
				{ label: "Central", value: "CENTRAL" },
			],
			columns: 2,
		},
	];
