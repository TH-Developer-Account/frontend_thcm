import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { Badge } from "../../../../../components/common/Badge";
import Button from "../../../../../components/common/Button";
import { formatDate } from "../../../../../utils/format";
import type {
	FileDownloadKind,
	FileModuleEventGroupRow,
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

const formatOperationType = (type: string): string => {
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

const getRecordStatus = (
	totalRecords: number,
	successRecords: number,
	failedRecords: number,
): string => {
	if (totalRecords <= 0) {
		return "UNKNOWN";
	}

	if (successRecords === totalRecords && failedRecords === 0) {
		return "COMPLETED";
	}

	if (successRecords === 0 && failedRecords > 0) {
		return "FAILED";
	}

	return "PARTIAL";
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
			<span className="file-operation-chip">
				{formatOperationType(row.original.type)}
			</span>
		),
	},
	{
		accessorKey: "totalRecords",
		header: "Total",
		cell: ({ row }) => (
			<span className="tabular-nums">{row.original.totalRecords}</span>
		),
	},
	{
		accessorKey: "successRecords",
		header: "Successful",
		cell: ({ row }) => (
			<span
				className={
					row.original.successRecords > 0
						? "tabular-nums text-approved"
						: "tabular-nums text-muted"
				}
			>
				{row.original.successRecords}
			</span>
		),
	},
	{
		accessorKey: "failedRecords",
		header: "Failed",
		cell: ({ row }) => (
			<span
				className={
					row.original.failedRecords > 0
						? "tabular-nums text-rejected"
						: "tabular-nums text-muted"
				}
			>
				{row.original.failedRecords}
			</span>
		),
	},
	{
		id: "triggeredBy",
		accessorFn: (row) => row.triggeredBy?.fullName ?? "",
		header: "Triggered By",
		cell: ({ row }) => {
			const user = row.original.triggeredBy;

			if (!user) {
				return <span className="text-muted">--</span>;
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
		id: "derivedStatus",
		accessorFn: (row) =>
			getRecordStatus(row.totalRecords, row.successRecords, row.failedRecords),
		header: "Status",
		cell: ({ row }) => {
			const status = getRecordStatus(
				row.original.totalRecords,
				row.original.successRecords,
				row.original.failedRecords,
			);

			return <Badge status={normalizeStatus(status)} />;
		},
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
							iconPosition="left"
							iconSize={16}
							size="sm"
							appearance="standard"
							variant="outline"
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
							iconPosition="left"
							iconSize={16}
							size="sm"
							appearance="standard"
							variant="outline"
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

export const getGroupedFilesListingColumns =
	(): ColumnDef<FileModuleEventGroupRow>[] => [
		{
			id: "proposalNumber",
			accessorFn: (row) => row.epc?.proposalNumber ?? "",
			header: "EPC No",
			cell: ({ row }) => (
				<div className="min-w-0">
					<p className="truncate font-medium">
						{row.original.epc?.proposalNumber || "Unassigned event"}
					</p>

					<p className="text-xs text-muted">
						{row.original.operationCount}{" "}
						{row.original.operationCount === 1 ? "operation" : "operations"}
					</p>
				</div>
			),
		},
		{
			id: "operationTypes",
			accessorFn: (row) => row.operationTypes.join(", "),
			header: "Operations",
			cell: ({ row }) => (
				<div className="flex min-w-0 flex-wrap gap-1">
					{row.original.operationTypes.map((type) => (
						<span key={type} className="file-operation-chip">
							{formatOperationType(type)}
						</span>
					))}
				</div>
			),
		},
		{
			accessorKey: "totalRecords",
			header: "Total",
			cell: ({ row }) => (
				<span className="tabular-nums">{row.original.totalRecords}</span>
			),
		},
		{
			accessorKey: "successRecords",
			header: "Successful",
			cell: ({ row }) => (
				<span
					className={
						row.original.successRecords > 0
							? "tabular-nums text-approved"
							: "tabular-nums text-muted"
					}
				>
					{row.original.successRecords}
				</span>
			),
		},
		{
			accessorKey: "failedRecords",
			header: "Failed",
			cell: ({ row }) => (
				<span
					className={
						row.original.failedRecords > 0
							? "tabular-nums text-rejected"
							: "tabular-nums text-muted"
					}
				>
					{row.original.failedRecords}
				</span>
			),
		},
		{
			id: "triggeredBy",
			accessorFn: (row) =>
				row.triggeredBy.map((user) => user.fullName).join(", "),
			header: "Triggered By",
			cell: ({ row }) => {
				const users = row.original.triggeredBy;

				if (!users.length) {
					return <span className="text-muted">--</span>;
				}

				const firstUser = users[0];
				const additionalCount = users.length - 1;

				return (
					<div className="min-w-0">
						<p className="truncate font-medium">{firstUser.fullName}</p>

						{additionalCount > 0 ? (
							<p className="text-xs text-muted">+{additionalCount} more</p>
						) : firstUser.email ? (
							<p className="truncate text-xs text-muted">{firstUser.email}</p>
						) : null}
					</div>
				);
			},
		},
		{
			accessorKey: "latestCreatedAt",
			header: "Latest Activity",
			cell: ({ row }) => (
				<span className="whitespace-nowrap">
					{row.original.latestCreatedAt
						? formatDate(row.original.latestCreatedAt)
						: "--"}
				</span>
			),
		},
		{
			id: "derivedStatus",
			accessorFn: (row) =>
				getRecordStatus(
					row.totalRecords,
					row.successRecords,
					row.failedRecords,
				),
			header: "Status",
			cell: ({ row }) => {
				const status = getRecordStatus(
					row.original.totalRecords,
					row.original.successRecords,
					row.original.failedRecords,
				);

				return <Badge status={normalizeStatus(status)} />;
			},
		},
		{
			id: "files",
			accessorFn: (row) => row.successRecords + row.errorFileCount,
			header: "Files",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="file-group-counts">
					<span>{row.original.successRecords} success</span>

					<span>{row.original.errorFileCount} error</span>
				</div>
			),
		},
	];
