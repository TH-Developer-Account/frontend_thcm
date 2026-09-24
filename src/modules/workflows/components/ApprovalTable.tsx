import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import type { SimpleTableColumn } from "../../../components/ui/tables/SimpleViewTable";
import SimpleViewTable from "../../../components/ui/tables/SimpleViewTable";
import type { ApprovalTableRow } from "../types/types";

type ApprovalTableVariant = "app" | "pdf";

type ApprovalTableColumnId =
	| "stage"
	| "type"
	| "approver"
	| "email"
	| "isExternal"
	| "flow"
	| "minimum"
	| "total"
	| "status";

type ApprovalTableProps = {
	data?: ApprovalTableRow[];
	rows?: ApprovalTableRow[];
	variant?: ApprovalTableVariant;
	title?: string;
	subtitle?: string;
	className?: string;
	/** Columns to leave out, e.g. ["status"] for a draft preview. */
	hiddenColumns?: ApprovalTableColumnId[];
	emptyTitle?: string;
	emptyDescription?: string;
	/** Approvers shown per row while collapsed. Defaults to 1. */
	collapsedCount?: number;
	/** Rows start expanded unless this is false. */
	defaultExpanded?: boolean;
	/** Scroll container max-height. Defaults to SimpleViewTable's 420px. */
	maxHeight?: string;
};

type ApproverRow = NonNullable<ApprovalTableRow["approvers"]>[number];

type RowView = {
	visible: ApproverRow[];
	hiddenCount: number;
	isExpandable: boolean;
	isExpanded: boolean;
	toggle: () => void;
};

type TableColumn = SimpleTableColumn<ApprovalTableRow> & {
	key: ApprovalTableColumnId;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const renderEmptyValue = () => (
	<span className="approval-table-empty-value">--</span>
);

const renderValueStack = (
	values: Array<{ key: string; content: ReactNode }>,
	fallback?: ReactNode,
	overflow?: ReactNode,
) => {
	if (!values.length) return fallback ?? renderEmptyValue();

	const lastIndex = values.length - 1;

	return (
		<div className="approval-table-value-stack">
			{values.map((item, index) => (
				<div key={item.key} className="approval-table-stack-item">
					{overflow && index === lastIndex ? (
						<span className="approval-table-stack-inline">
							<span className="approval-table-stack-text">{item.content}</span>
							{overflow}
						</span>
					) : (
						item.content
					)}
				</div>
			))}
		</div>
	);
};

const renderStatus = (status?: string | null) =>
	status ? <Badge status={status} /> : renderEmptyValue();

const renderEmail = (email?: string | null) =>
	email && email !== "--" ? (
		<a href={`mailto:${email}`} className="approval-table-email">
			{email}
		</a>
	) : (
		renderEmptyValue()
	);

/* -------------------------------------------------------------------------- */
/* Columns                                                                    */
/* -------------------------------------------------------------------------- */

const buildColumns = (
	getRowView: (row: ApprovalTableRow) => RowView,
): TableColumn[] => [
	{
		key: "stage",
		header: "Stage",
		align: "center",
		render: (row) => {
			const { isExpandable, isExpanded, toggle } = getRowView(row);
			const stageNumber = row.stageOrder ?? "--";

			return (
				<div className="approval-table-stage-cell">
					{isExpandable ? (
						<Button
							type="button"
							appearance="icon"
							variant="outline"
							size="sm"
							text={String(stageNumber)}
							Icon={isExpanded ? Minus : Plus}
							aria-expanded={isExpanded}
							aria-label={`${isExpanded ? "Collapse" : "Expand"} ${row.stageName || "stage"} approvers`}
							onClick={toggle}
						/>
					) : (
						<span className="approval-table-stage-number">{stageNumber}</span>
					)}
				</div>
			);
		},
	},

	{
		key: "type",
		header: "Type",
		render: (row) => (
			<span className="approval-table-primary-value">
				{row.stageName || "--"}
			</span>
		),
	},
	{
		key: "approver",
		header: "Approver",
		widthUnits: 2,
		render: (row) => {
			const { visible, hiddenCount, isExpandable, isExpanded, toggle } =
				getRowView(row);

			return renderValueStack(
				visible.map((approver) => ({
					key: String(approver.id),
					content: approver.name || "--",
				})),
				row.name ? (
					<span className="approval-table-primary-value">{row.name}</span>
				) : (
					renderEmptyValue()
				),
				isExpandable ? (
					<button
						type="button"
						className="approval-table-more"
						aria-expanded={isExpanded}
						onClick={toggle}
					>
						{isExpanded ? "Show less" : `+${hiddenCount} more`}
					</button>
				) : null,
			);
		},
	},
	{
		key: "email",
		header: "Email",
		widthUnits: 2,
		render: (row) => {
			const { visible } = getRowView(row);

			return renderValueStack(
				visible.map((approver) => ({
					key: String(approver.id),
					content: renderEmail(approver.email),
				})),
				renderEmail(row.email),
				// hiddenCount > 0 ? renderEllipsis() : null,
			);
		},
	},
	{
		key: "isExternal",
		header: "External approver",
		align: "center",
		render: (row) => {
			const { visible } = getRowView(row);

			return renderValueStack(
				visible.map((approver) => ({
					key: String(approver.id),
					content: (
						<span className="approval-table-secondary-value">
							{approver.isExternal ? "Yes" : "No"}
						</span>
					),
				})),
				renderEmptyValue(),
				// hiddenCount > 0 ? renderEllipsis() : null,
			);
		},
	},
	{
		key: "flow",
		header: "Strategy",
		align: "center",
		render: (row) => (
			<span className="approval-table-secondary-value">
				{row.strategy || "--"}
			</span>
		),
	},
	{
		key: "minimum",
		header: "Minimum Approvals",
		align: "center",
		render: (row) => (
			<span className="approval-table-count">{row.minApprovals ?? "--"}</span>
		),
	},
	{
		key: "total",
		header: "Total Approvals",
		align: "center",
		render: (row) => (
			<span className="approval-table-count">{row.totalApprovers ?? "--"}</span>
		),
	},
	{
		key: "status",
		header: "Status",
		align: "center",
		render: (row) => {
			const { visible } = getRowView(row);

			return visible.length
				? renderValueStack(
						visible.map((approver) => ({
							key: String(approver.id),
							content: renderStatus(approver.status),
						})),
						undefined,
						// hiddenCount > 0 ? renderEllipsis() : null,
					)
				: renderStatus(row.status);
		},
	},
];

/* -------------------------------------------------------------------------- */
/* PDF variant (unchanged)                                                    */
/* -------------------------------------------------------------------------- */

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

					return (
						<tr key={String(row.id ?? `approval-pdf-${rowIndex}`)}>
							<td>{row.stageOrder ?? "--"}</td>
							<td>{row.stageName || "--"}</td>
							<td>
								{approvers.length
									? approvers
											.map((approver) => approver.name || "--")
											.join(", ")
									: row.name || "--"}
							</td>
							<td>
								{approvers.length
									? approvers
											.map((approver) => approver.email || "--")
											.join(", ")
									: row.email || "--"}
							</td>
							<td>{row.strategy || "--"}</td>
							<td>{row.minApprovals ?? "--"}</td>
							<td>{row.totalApprovers ?? "--"}</td>
							<td>
								{approvers.length
									? approvers
											.map((approver) => approver.status || "--")
											.join(", ")
									: row.status || "--"}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export const ApprovalTable = ({
	data,
	rows,
	variant = "app",
	title,
	subtitle,
	className,
	hiddenColumns,
	emptyTitle = "No approval stages available",
	emptyDescription = "Approval stages will appear after the workflow has been generated.",
	collapsedCount = 3,
	defaultExpanded = false,
	maxHeight,
}: ApprovalTableProps) => {
	const tableData = useMemo(() => data ?? rows ?? [], [data, rows]);

	/**
	 * Rows the user has flipped away from the default state.
	 * defaultExpanded = true  → set holds collapsed rows
	 * defaultExpanded = false → set holds expanded rows
	 * Rows that arrive later automatically start in the default state.
	 */
	const [toggledIds, setToggledIds] = useState<Set<string>>(() => new Set());

	const toggleRow = useCallback((rowId: string) => {
		setToggledIds((previous) => {
			const next = new Set(previous);
			if (next.has(rowId)) next.delete(rowId);
			else next.add(rowId);
			return next;
		});
	}, []);

	const columns = useMemo(() => {
		const getRowView = (row: ApprovalTableRow): RowView => {
			const approvers = row.approvers ?? [];
			const isExpandable = approvers.length > collapsedCount;
			const isExpanded =
				!isExpandable || defaultExpanded !== toggledIds.has(row.id);

			const visible = isExpanded
				? approvers
				: approvers.slice(0, collapsedCount);

			return {
				visible,
				hiddenCount: approvers.length - visible.length,
				isExpandable,
				isExpanded,
				toggle: () => toggleRow(row.id),
			};
		};

		return buildColumns(getRowView).filter(
			(column) => !hiddenColumns?.includes(column.key),
		);
	}, [toggledIds, collapsedCount, defaultExpanded, toggleRow, hiddenColumns]);

	if (variant === "pdf") return <ApprovalPdfTable data={tableData} />;

	const heading =
		title || subtitle ? (
			<div>
				{title ? <div>{title}</div> : null}
				{subtitle ? (
					<p className="text-xs font-normal text-slate-500">{subtitle}</p>
				) : null}
			</div>
		) : undefined;

	return (
		<SimpleViewTable<ApprovalTableRow>
			title={heading}
			data={tableData}
			columns={columns}
			getRowId={(row, index) => String(row.id ?? `approval-${index}`)}
			emptyTitle={emptyTitle}
			emptyDescription={emptyDescription}
			maxHeight={maxHeight}
			className={["approval-flow-table", className].filter(Boolean).join(" ")}
			ariaLabel={title ?? "Approval flow"}
		/>
	);
};
