import { FileDown, FileUp } from "lucide-react";
import Button from "../../../../../components/common/Button";
import DataTableSkeleton from "../../../../../components/ui/DataTableSkeleton";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";
import { useLeadGroupsQuery } from "../queries/useLeadQueries";
import LeadsTable from "../components/LeadsTable";
import "../styles/leads.css";

export default function LeadsTablePage() {
	const { data: leadGroups = [], isLoading, isFetching } = useLeadGroupsQuery();

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
						className="text-xs m-1 sm:m-2"
					/>
					<Button
						type="button"
						text="Import"
						Icon={FileUp}
						status="brand"
						className="text-xs m-1 sm:m-2"
					/>
				</PageHeader>
			}
		>
			{isLoading ? (
				<DataTableSkeleton rows={8} columns={5} showPagination />
			) : (
				<LeadsTable groups={leadGroups} />
			)}

			{isFetching && !isLoading ? (
				<span className="sr-only">Refreshing lead list</span>
			) : null}
		</PageRowSectionLayout>
	);
}
