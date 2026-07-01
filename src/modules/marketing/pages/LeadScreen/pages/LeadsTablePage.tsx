import { FileDown } from "lucide-react";
import Button from "../../../../../components/common/Button";
import DataTableSkeleton from "../../../../../components/ui/DataTableSkeleton";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";
import LeadsTable from "../components/LeadsTable";
import { useLeadRowsQuery } from "../queries/useLeadQueries";
import "../styles/leads.css";

export default function LeadsTablePage() {
	const { data: leads = [], isLoading, isFetching } = useLeadRowsQuery();

	return (
		<PageRowSectionLayout
			stickyHeader
			header_children={
				<PageHeader
					headerText="Leads Listing"
					subtitleText="Manage your Lead details here"
					badgeProps={{
						text: "Back to Home Screen",
						direction: "back",
						to: "/",
					}}
					className="flex flex-row items-end justify-between"
				>
					<Button
						type="button"
						text="Export"
						Icon={FileDown}
						status="brand"
						className="m-1 text-xs sm:m-2"
					/>
				</PageHeader>
			}
		>
			{isLoading ? (
				<DataTableSkeleton rows={8} columns={6} showPagination />
			) : (
				<LeadsTable leads={leads} />
			)}

			{isFetching && !isLoading ? (
				<span className="sr-only">Refreshing lead list</span>
			) : null}
		</PageRowSectionLayout>
	);
}
