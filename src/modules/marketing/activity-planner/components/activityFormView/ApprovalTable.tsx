import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { Badge } from "../../../../../components/common/Badge";
import Card from "../../../../../components/common/Card";
import DataTable from "../../../../../components/ui/DataTable";

import type { ApprovalTableRow } from "../../../../../utils/types";

type ApprovalTableVariant = "app" | "pdf";

type ApprovalTableProps = {
	data?: ApprovalTableRow[];
	rows?: ApprovalTableRow[];

	variant?: ApprovalTableVariant;

	title?: string;
	subtitle?: string;
	className?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const renderEmptyValue = () => (
	<span className="approval-table-empty-value">--</span>
);

const renderValueStack = (
	values: Array<{
		key: string;
		content: ReactNode;
	}>,
	fallback?: ReactNode,
) => {
	if (!values.length) {
		return fallback ?? renderEmptyValue();
	}

	return (
		<div className="approval-table-value-stack">
			{values.map((item) => (
				<div key={item.key} className="approval-table-stack-item">
					{item.content}
				</div>
			))}
		</div>
	);
};

const renderStatus = (status?: string | null) => {
	if (!status) {
		return renderEmptyValue();
	}

	return <Badge status={status} />;
};

const renderApproverNames = (row: ApprovalTableRow) => {
	const approvers = row.approvers ?? [];

	return renderValueStack(
		approvers.map((approver) => ({
			key: String(approver.id),
			content: approver.name || "--",
		})),
		row.name ? (
			<span className="approval-table-primary-value">{row.name}</span>
		) : (
			renderEmptyValue()
		),
	);
};

const renderApproverEmails = (row: ApprovalTableRow) => {
	const approvers = row.approvers ?? [];

	return renderValueStack(
		approvers.map((approver) => ({
			key: String(approver.id),

			content: approver.email ? (
				<a href={`mailto:${approver.email}`} className="approval-table-email">
					{approver.email}
				</a>
			) : (
				"--"
			),
		})),

		row.email ? (
			<a href={`mailto:${row.email}`} className="approval-table-email">
				{row.email}
			</a>
		) : (
			renderEmptyValue()
		),
	);
};

const renderMinimumApprovals = (row: ApprovalTableRow) => {
	const approvers = row.approvers ?? [];

	return renderValueStack(
		approvers.map((approver) => ({
			key: String(approver.id),
			content: approver.minApprovals ?? "--",
		})),

		<span className="approval-table-count">{row.minApprovals ?? "--"}</span>,
	);
};

const renderStatuses = (row: ApprovalTableRow) => {
	const approvers = row.approvers ?? [];

	if (!approvers.length) {
		return renderStatus(row.status);
	}

	return renderValueStack(
		approvers.map((approver) => ({
			key: String(approver.id),
			content: renderStatus(approver.status),
		})),
	);
};

const APPROVAL_COLUMNS: ColumnDef<ApprovalTableRow>[] = [
	{
		id: "stage",
		header: "Stage",
		enableSorting: false,

		meta: {
			align: "center",
			headerClassName: "approval-table-column-stage",
			cellClassName: "approval-table-column-stage",
		},

		cell: ({ row }) => (
			<span className="approval-table-stage-number">
				{row.original.stageOrder ?? "--"}
			</span>
		),
	},
	{
		id: "type",
		header: "Type",
		enableSorting: false,

		meta: {
			headerClassName: "approval-table-column-type",
			cellClassName: "approval-table-column-type",
		},

		cell: ({ row }) => (
			<span className="approval-table-primary-value">
				{row.original.stageName || "--"}
			</span>
		),
	},
	{
		id: "approver",
		header: "Approver",
		enableSorting: false,

		meta: {
			headerClassName: "approval-table-column-approver",
			cellClassName: "approval-table-column-approver",
		},

		cell: ({ row }) => renderApproverNames(row.original),
	},
	{
		id: "email",
		header: "Email",
		enableSorting: false,

		meta: {
			headerClassName: "approval-table-column-email",
			cellClassName: "approval-table-column-email",
		},

		cell: ({ row }) => renderApproverEmails(row.original),
	},
	{
		id: "flow",
		header: "Flow",
		enableSorting: false,

		meta: {
			align: "center",
			headerClassName: "approval-table-column-flow",
			cellClassName: "approval-table-column-flow",
		},

		cell: ({ row }) => (
			<span className="approval-table-secondary-value">
				{row.original.strategy || "--"}
			</span>
		),
	},
	{
		id: "minimum",
		header: "Min",
		enableSorting: false,

		meta: {
			align: "center",
			headerClassName: "approval-table-column-count",
			cellClassName: "approval-table-column-count",
		},

		cell: ({ row }) => renderMinimumApprovals(row.original),
	},
	{
		id: "total",
		header: "Total",
		enableSorting: false,

		meta: {
			align: "center",
			headerClassName: "approval-table-column-count",
			cellClassName: "approval-table-column-count",
		},

		cell: ({ row }) => (
			<span className="approval-table-count">
				{row.original.totalApprovers ?? "--"}
			</span>
		),
	},
	{
		id: "status",
		header: "Status",
		enableSorting: false,

		meta: {
			align: "center",
			headerClassName: "approval-table-column-status",
			cellClassName: "approval-table-column-status",
		},

		cell: ({ row }) => renderStatuses(row.original),
	},
];

const ApprovalPdfTable = ({ data }: { data: ApprovalTableRow[] }) => {
	if (!data.length) {
		return <p className="pdf-empty">No approval stages available.</p>;
	}

	return (
		<table className="pdf-table pdf-approval-table">
			<thead>
				<tr>
					<th>Stage</th>
					<th>Type</th>
					<th>Approver</th>
					<th>Email</th>
					<th>Flow</th>
					<th>Min</th>
					<th>Total</th>
					<th>Status</th>
				</tr>
			</thead>

			<tbody>
				{data.map((row, rowIndex) => {
					const approvers = row.approvers ?? [];

					const approverNames = approvers.length
						? approvers.map((approver) => approver.name || "--").join(", ")
						: row.name || "--";

					const approverEmails = approvers.length
						? approvers.map((approver) => approver.email || "--").join(", ")
						: row.email || "--";

					const minimumApprovals = approvers.length
						? approvers
								.map((approver) => approver.minApprovals ?? "--")
								.join(", ")
						: (row.minApprovals ?? "--");

					const statuses = approvers.length
						? approvers.map((approver) => approver.status || "--").join(", ")
						: row.status || "--";

					return (
						<tr key={String(row.id ?? `approval-pdf-${rowIndex}`)}>
							<td>{row.stageOrder ?? "--"}</td>

							<td>{row.stageName || "--"}</td>

							<td>{approverNames}</td>

							<td>{approverEmails}</td>

							<td>{row.strategy || "--"}</td>

							<td>{minimumApprovals}</td>

							<td>{row.totalApprovers ?? "--"}</td>

							<td>{statuses}</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

const ApprovalTable = ({
	data,
	rows,
	variant = "app",
	title,
	subtitle,
	className,
}: ApprovalTableProps) => {
	const tableData = data ?? rows ?? [];

	if (variant === "pdf") {
		return <ApprovalPdfTable data={tableData} />;
	}

	return (
		<Card
			title={title}
			subtitle={subtitle}
			padding="none"
			variant="outlined"
			className={joinClassNames("approval-flow-table", className)}
		>
			<DataTable<ApprovalTableRow>
				data={tableData}
				columns={APPROVAL_COLUMNS}
				getRowId={(row, index) => String(row.id ?? `approval-${index}`)}
				enableSorting={false}
				enablePagination={false}
				emptyTitle="No approval stages available"
				emptyDescription="Approval stages will appear after the workflow has been generated."
				minWidth="lg"
				ariaLabel={title ?? "Approval flow"}
			/>
		</Card>
	);
};

export default ApprovalTable;
