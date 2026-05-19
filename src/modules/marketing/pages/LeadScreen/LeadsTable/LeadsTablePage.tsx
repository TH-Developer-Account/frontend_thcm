import PageRowSectionLayout from "../../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import { FileDown, FileUp } from "lucide-react";
import Button from "../../../../../components/common/Button";
import DataTableSkeleton from "../../../../../components/ui/DataTableSkeleton";

import { useLeadsQuery } from "../queries/useLeadsQuery";
import LeadsTable from "./components/LeadsTable";

export default function LeadsTablePage() {
	const { data: leadGroups = [], isLoading } = useLeadsQuery();

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
					className="flex flex-row justify-between items-end"
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
		</PageRowSectionLayout>
	);
}
