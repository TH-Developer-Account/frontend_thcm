import { useState } from "react";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";

import FileListingTable, {
	type FileListFilter,
} from "../components/fileModule/FileListingTable";
import { useFileModuleQuery } from "../queries/useFileModuleQuery";

const FilesModule = () => {
	const {
		data: files = [],
		isLoading,
		isFetching,
		isError,
	} = useFileModuleQuery();
	const [selectedFilter, setSelectedFilter] = useState<FileListFilter>("all");
	const handleImport = () => {
		console.log("Import clicked");
	};

	const handleExport = () => {
		console.log("Export clicked");
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Import/Export Module"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Files page location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Files Module",
						},
					],
					separator: "›",
				}}
			/>

			<FileListingTable
				files={files}
				isLoading={isLoading}
				isFetching={isFetching}
				isError={isError}
				onImport={handleImport}
				onExport={handleExport}
				selectedFilter={selectedFilter}
				onFilterChange={setSelectedFilter}
			/>
		</PageSectionLayout>
	);
};

export default FilesModule;
