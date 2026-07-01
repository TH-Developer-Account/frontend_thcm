import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { Badge } from "../../../../../components/common/Badge";
import Button from "../../../../../components/common/Button";
import { formatDate } from "../../../../../utils/format";
import type {
	FileDownloadKind,
	FileModuleListingRow,
} from "../../types/fileModule.types";

type DownloadFileHandler = (
	file: FileModuleListingRow,
	kind: FileDownloadKind,
) => void | Promise<void>;

type GetFilesListingColumnsOptions = {
	onDownloadFile: DownloadFileHandler;
	downloadingKeys: ReadonlySet<string>;
};

const getDownloadKey = (logId: string, kind: FileDownloadKind): string =>
	`${logId}:${kind}`;

const formatImportType = (type: string): string => {
	const normalizedType = type.trim();

	if (!normalizedType) {
		return "Unknown";
	}

	return normalizedType
		.toLowerCase()
		.split("_")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
};

const normalizeStatus = (status: string): string => {
	const normalizedStatus = status.trim().toUpperCase();

	return normalizedStatus || "UNKNOWN";
};

export const getFilesListingColumns = ({
	onDownloadFile,
	downloadingKeys,
}: GetFilesListingColumnsOptions): ColumnDef<FileModuleListingRow>[] => [
	{
		id: "proposalNumber",
		accessorFn: (row) => row.epc?.proposalNumber ?? "",
		header: "EPC No",
		cell: ({ row }) => (
			<span className="font-medium">
				{row.original.epc?.proposalNumber || "--"}
			</span>
		),
	},
	{
		accessorKey: "type",
		header: "Operation",
		cell: ({ row }) => (
			<span className="font-medium">{formatImportType(row.original.type)}</span>
		),
	},
	{
		id: "triggeredBy",
		accessorFn: (row) => row.triggeredBy?.fullName ?? "",
		header: "Triggered By",
		cell: ({ row }) => {
			const user = row.original.triggeredBy;

			if (!user) {
				return <span>--</span>;
			}

			return (
				<div className="min-w-0">
					<p className="truncate font-medium">{user.fullName}</p>

					{user.email ? (
						<p className="truncate text-xs text-muted">{user.email}</p>
					) : null}
				</div>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: "Created On",
		cell: ({ row }) => (
			<span className="whitespace-nowrap">
				{row.original.createdAt ? formatDate(row.original.createdAt) : "--"}
			</span>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <Badge status={normalizeStatus(row.original.status)} />,
	},
	{
		id: "downloads",
		header: "Files",
		enableSorting: false,
		cell: ({ row }) => {
			const file = row.original;

			const outputDownloadKey = getDownloadKey(file.id, "output");
			const errorDownloadKey = getDownloadKey(file.id, "error");

			const isOutputDownloading = downloadingKeys.has(outputDownloadKey);
			const isErrorDownloading = downloadingKeys.has(errorDownloadKey);

			if (!file.hasOutputFile && !file.hasErrorFile) {
				return <span className="text-muted">No files</span>;
			}

			return (
				<div className="flex flex-wrap items-center gap-2">
					{file.hasOutputFile ? (
						<Button
							type="button"
							text={isOutputDownloading ? "Preparing..." : "Success file"}
							Icon={Download}
							size="sm"
							status="outline"
							disabled={isOutputDownloading}
							aria-busy={isOutputDownloading}
							onClick={() => {
								void onDownloadFile(file, "output");
							}}
						/>
					) : null}

					{file.hasErrorFile ? (
						<Button
							type="button"
							text={isErrorDownloading ? "Preparing..." : "Error file"}
							Icon={Download}
							size="sm"
							status="brand"
							disabled={isErrorDownloading}
							aria-busy={isErrorDownloading}
							onClick={() => {
								void onDownloadFile(file, "error");
							}}
						/>
					) : null}
				</div>
			);
		},
	},
];
