import React from "react";
import type { PaginationState } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import BPTable from "./components/BPTable";
import { useBusinessPartnerListing } from "./hooks/useBusinessPartnerQueries";
import type { BusinessPartner } from "./utils/bp.types";
import { useDebounce } from "../../../hooks/useDebounce";

const INITIAL_PAGINATION: PaginationState = {
	pageIndex: 0,
	pageSize: 10,
};

const BusinessPartners = () => {
	const navigate = useNavigate();

	const [search, setSearch] = React.useState("");
	const [pagination, setPagination] =
		React.useState<PaginationState>(INITIAL_PAGINATION);

	const debouncedSearch = useDebounce(search, 400);

	const { data, isLoading, isFetching, isError } = useBusinessPartnerListing({
		search: debouncedSearch,
		pageIndex: pagination.pageIndex + 1,
		pageSize: pagination.pageSize,
	});

	const handleSearchChange = React.useCallback((value: string) => {
		setSearch(value);
	}, []);

	React.useEffect(() => {
		setPagination((current) => {
			if (current.pageIndex === 0) {
				return current;
			}

			return {
				...current,
				pageIndex: 0,
			};
		});
	}, [debouncedSearch]);

	const handleView = React.useCallback(
		(partner: BusinessPartner) => {
			navigate(
				`/admin/business-partners/${encodeURIComponent(partner.id)}/view`,
			);
		},
		[navigate],
	);

	const handleCreate = React.useCallback(() => {
		navigate("/admin/business-partners/create");
	}, [navigate]);

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
								onChange={handleSearchChange}
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
								onClick={handleCreate}
							/>
						</div>
					</div>
				}
			>
				<BPTable
					partners={data?.rows ?? []}
					pageCount={data?.totalPages ?? 0}
					pagination={pagination}
					onPaginationChange={setPagination}
					isLoading={isLoading}
					isFetching={isFetching}
					isError={isError}
					onView={handleView}
				/>
			</Card>
		</PageSectionLayout>
	);
};

export default BusinessPartners;
