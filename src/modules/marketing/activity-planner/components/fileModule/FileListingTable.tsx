import React from "react";

import DataTable from "../../../../../components/ui/DataTable";
import { getFilesListingColumns } from "./files.module.columns";
import type { FileModuleListingRow } from "./fileModule.types";

type FileModuleListingRowProps = {
	files: FileModuleListingRow[];
	loading?: boolean;
};

const FileListingTable = ({
	files,
	loading = false,
}: FileModuleListingRowProps) => {
	const columns = React.useMemo(() => getFilesListingColumns(), []);
	const tableData = Array.isArray(files) ? files : [];

	return (
		<DataTable<FileModuleListingRow>
			data={tableData}
			columns={columns}
			loading={loading}
			manualSorting={false}
			manualPagination={false}
			scrollTargetId="tableScroll"
			emptyTitle="No File records found"
			emptyDescription="Uploaded files will appear here"
		/>
	);
};

export default FileListingTable;
