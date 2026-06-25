import React from "react";
import axios from "axios";

import DataTable from "../../../../../components/ui/DataTable";
import type {
	FileDownloadKind,
	FileModuleListingRow,
} from "../../types/fileModule.types";
import { getFilesListingColumns } from "./files.module.columns";
import { ServerAxios } from "../../../../../services/ServerAxios";

type FileListingTableProps = {
	files: FileModuleListingRow[];
	loading?: boolean;
};

type DownloadNotice = {
	type: "success" | "error";
	message: string;
	url?: string;
};

const getFileLabel = (kind: FileDownloadKind): string =>
	kind === "output" ? "success file" : "error file";

const getDownloadErrorMessage = (
	error: unknown,
	kind: FileDownloadKind,
): string => {
	const fileLabel = getFileLabel(kind);

	if (axios.isAxiosError(error)) {
		if (error.response?.status === 401) {
			return "Your session is not authorized. Please sign in again.";
		}

		if (error.response?.status === 403) {
			return `You do not have permission to download this ${fileLabel}.`;
		}

		if (error.response?.status === 404) {
			return `No ${fileLabel} is available for this record.`;
		}

		const responseData = error.response?.data as
			| {
					message?: unknown;
					error?: unknown;
			  }
			| undefined;

		if (
			typeof responseData?.message === "string" &&
			responseData.message.trim()
		) {
			return responseData.message;
		}

		if (typeof responseData?.error === "string" && responseData.error.trim()) {
			return responseData.error;
		}
	}

	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return `Unable to download the ${fileLabel}.`;
};

const FileListingTable = ({
	files,
	loading = false,
}: FileListingTableProps) => {
	const [downloadingKeys] = React.useState<Set<string>>(() => new Set());
	const [downloadNotice, setDownloadNotice] =
		React.useState<DownloadNotice | null>(null);

	const handleDownloadFile = React.useCallback(
		async (
			file: FileModuleListingRow,
			kind: FileDownloadKind,
		): Promise<void> => {
			const endpoint =
				kind === "output"
					? `/import-export/${encodeURIComponent(file.id)}/file`
					: `/import-export/${encodeURIComponent(file.id)}/errors`;

			console.group("Import/export file API test");
			console.log("Clicked file row:", file);
			console.log("Log ID:", file.id);
			console.log("Download kind:", kind);
			console.log("Endpoint:", endpoint);

			try {
				const response = await ServerAxios.post(endpoint);

				console.log("Full Axios response:", response);
				console.log("HTTP status:", response.status);
				console.log("Response headers:", response.headers);
				console.log("Response data:", response.data);
				console.log("Returned URL:", response.data?.url);

				setDownloadNotice({
					type: "success",
					message: `API returned status ${response.status}. Check the browser console.`,
					url:
						typeof response.data?.url === "string"
							? response.data.url
							: undefined,
					// fileName: getFileName(file, kind),
				});
			} catch (error) {
				console.error("Direct API call failed:", error);

				if (axios.isAxiosError(error)) {
					console.log("Error status:", error.response?.status);
					console.log("Error response:", error.response);
					console.log("Error response data:", error.response?.data);
					console.log("Request URL:", error.config?.url);
					console.log("Request method:", error.config?.method);
				}

				setDownloadNotice({
					type: "error",
					message: getDownloadErrorMessage(error, kind),
				});
			} finally {
				console.groupEnd();
			}
		},
		[],
	);

	const columns = React.useMemo(
		() =>
			getFilesListingColumns({
				onDownloadFile: handleDownloadFile,
				downloadingKeys,
			}),
		[downloadingKeys, handleDownloadFile],
	);

	const tableData = Array.isArray(files) ? files : [];

	return (
		<div className="min-w-0">
			{downloadNotice ? (
				<div
					role={downloadNotice.type === "error" ? "alert" : "status"}
					aria-live={downloadNotice.type === "error" ? "assertive" : "polite"}
					className="mb-3 flex flex-col gap-2 rounded-md border border-default bg-surface px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
				>
					<p
						className={
							downloadNotice.type === "error"
								? "text-sm text-rejected"
								: "text-sm text-approved"
						}
					>
						{downloadNotice.message}
					</p>

					<div className="flex shrink-0 items-center gap-3">
						{downloadNotice.url ? (
							<a
								href={downloadNotice.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
							>
								Open file
							</a>
						) : null}

						<button
							type="button"
							onClick={() => setDownloadNotice(null)}
							className="text-xs font-medium text-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
						>
							Dismiss
						</button>
					</div>
				</div>
			) : null}

			<DataTable<FileModuleListingRow>
				data={tableData}
				columns={columns}
				loading={loading}
				manualSorting={false}
				manualPagination={false}
				scrollTargetId="file-module-table-scroll"
				emptyTitle="No file records found"
				emptyDescription="Import and export history will appear here."
			/>
		</div>
	);
};

export default FileListingTable;
