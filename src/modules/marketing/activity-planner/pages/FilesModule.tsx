import { FileDown, FileUp } from "lucide-react";

import Button from "../../../../components/common/Button";
import DataTableSkeleton from "../../../../components/ui/DataTableSkeleton";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import FileListingTable from "../components/fileModule/FileListingTable";
import { useFileModuleQuery } from "../queries/useFileModuleQuery";

const FilesModule = () => {
	const {
		data: files = [],
		isLoading,
		isFetching,
		isError,
	} = useFileModuleQuery();

	return (
		<PageRowSectionLayout
			contentClassName="min-w-0 overflow-hidden"
			stickyHeader
			header_children={
				<PageHeader
					headerText="Import/Export Module"
					subtitleText="Manage import and export history"
					badgeProps={{
						text: "Back to Home Screen",
						direction: "back",
						to: "/",
					}}
					className="flex flex-col items-stretch gap-3 mr-2 pb-2 sm:flex-row sm:items-end sm:justify-between"
				>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							text="Export"
							Icon={FileDown}
							status="brand"
							size="sm"
						/>

						<Button
							type="button"
							text="Import"
							Icon={FileUp}
							status="brand"
							size="sm"
						/>

						{/* <Button
							type="button"
							text="Bulk Upload"
							Icon={FileUp}
							status="brand"
							size="sm"
						/>

						<Button
							type="button"
							text="Download all files"
							Icon={FileDown}
							status="brand"
							size="sm"
						/> */}
					</div>
				</PageHeader>
			}
		>
			{isLoading ? (
				<DataTableSkeleton rows={8} columns={9} showPagination />
			) : isError ? (
				<div role="alert" className="alert-card">
					<h2 className="alert-title">Unable to load file history</h2>

					<p className="alert-description">
						The import and export history could not be retrieved. Refresh the
						page or try again.
					</p>
				</div>
			) : (
				<FileListingTable files={files} loading={false} />
			)}

			{isFetching && !isLoading ? (
				<span className="sr-only">Refreshing import and export history</span>
			) : null}
		</PageRowSectionLayout>
	);
};

export default FilesModule;
