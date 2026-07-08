import React from "react";

import DataTable from "../../../../components/ui/tables/DataTable/DataTable";
import type { BusinessPartner } from "../utils/bp.types";

import { getBusinessPartnerColumns } from "./businessPartner.columns";

type BPTableProps = {
	partners: BusinessPartner[];
	isLoading?: boolean;
	isFetching?: boolean;
	isError?: boolean;
};

const BPTable = ({
	partners,
	isLoading = false,
	isFetching = false,
	isError = false,
}: BPTableProps) => {
	const columns = React.useMemo(() => getBusinessPartnerColumns(), []);

	const tableData = React.useMemo(
		() => (Array.isArray(partners) ? partners : []),
		[partners],
	);

	if (isError) {
		return (
			<div role="alert" className="alert-card">
				<h2 className="alert-title">Unable to load business partners</h2>

				<p className="alert-description">
					The business partner listing could not be retrieved. Refresh the page
					or try again.
				</p>
			</div>
		);
	}

	return (
		<section
			aria-label="Business partner records"
			aria-busy={isLoading || isFetching}
		>
			<DataTable<BusinessPartner>
				data={tableData}
				columns={columns}
				loading={isLoading}
				manualSorting={false}
				manualPagination={true}
				scrollTargetId="business-partner-table-scroll"
				emptyTitle="No business partners found"
				emptyDescription="Try adjusting the current search term."
			/>

			{isFetching && !isLoading ? (
				<span className="sr-only" role="status" aria-live="polite">
					Refreshing business partners
				</span>
			) : null}
		</section>
	);
};

export default BPTable;
