import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Button from "../../../../components/common/Button";
import { FileDown, FileUp } from "lucide-react";
import DataTableSkeleton from "../../../../components/ui/DataTableSkeleton";

const FilesModule = () => {
	return (
		<PageRowSectionLayout
			stickyHeader
			header_children={
				<PageHeader
					headerText="Import/Export Module"
					subtitleText="Manage your all files here"
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
					<Button
						type="button"
						text="Bulk Upload"
						Icon={FileUp}
						status="brand"
						className="text-xs m-1 sm:m-2"
					/>
					<Button
						type="button"
						text="Download all files"
						Icon={FileUp}
						status="brand"
						className="text-xs m-1 sm:m-2"
					/>
				</PageHeader>
			}
		>
			<DataTableSkeleton rows={8} columns={5} showPagination />
		</PageRowSectionLayout>
	);
};

export default FilesModule;
