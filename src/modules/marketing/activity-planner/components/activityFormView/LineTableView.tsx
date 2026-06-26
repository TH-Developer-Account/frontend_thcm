import type { ColumnDef } from "@tanstack/react-table";
import { Paperclip } from "lucide-react";

import Button from "../../../../../components/common/Button";
import DataTable from "../../../../../components/ui/DataTable";

import { CRF_CATEGORIES } from "../../../constant";

import type { ColumnConfig, TableRow } from "../../types/lineItem.types";

import {
	ARTWORK_COLUMNS,
	DEFAULT_COLUMNS,
	OVERHEAD_COLUMNS,
} from "../../utils/columnPresets";

type LineTableViewProps = {
	title?: string;
	data?: TableRow[];
	showGrandTotal?: boolean;
	grandTotalLabel?: string;
};

const toDisplayNumber = (value: unknown): number => {
	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : 0;
};

const formatDisplayNumber = (value: unknown, decimalPlaces = 2): string => {
	return toDisplayNumber(value).toFixed(decimalPlaces);
};

const getCategoryTitle = (category?: string | null): string => {
	if (!category) return "--";

	if (category === "EVENT_OVERHEAD") {
		return "Event Cost Overheads";
	}

	return CRF_CATEGORIES.find((item) => item.value === category)?.title ?? "--";
};

const groupByCategory = (data: TableRow[]): Record<string, TableRow[]> => {
	return data.reduce<Record<string, TableRow[]>>((accumulator, row) => {
		const category = row.category || "UNCATEGORIZED";

		accumulator[category] ??= [];
		accumulator[category].push(row);

		return accumulator;
	}, {});
};

const getGrandTotal = (data: TableRow[]): number => {
	return data.reduce((sum, row) => sum + toDisplayNumber(row.total), 0);
};

const getColumnsForCategory = (category: string): ColumnConfig[] => {
	if (category === "ARTWORK") {
		return ARTWORK_COLUMNS;
	}

	if (category === "EVENT_OVERHEAD") {
		return OVERHEAD_COLUMNS;
	}

	return DEFAULT_COLUMNS;
};

const getColumnWidthClass = (column: ColumnConfig): string => {
	const widthClasses: Record<number, string> = {
		1: "data-table-column-xs",
		2: "data-table-column-sm",
		3: "data-table-column-md",
		4: "data-table-column-lg",
		5: "data-table-column-xl",
		6: "data-table-column-2xl",
	};

	return widthClasses[column.colSpan] ?? "data-table-column-md";
};

const renderQuotation = (row: TableRow) => {
	const quotationUrl = row.quotationUrl ?? undefined;

	const quotationLabel = row.quotationFileName
		? `View quotation: ${row.quotationFileName}`
		: "View quotation";

	if (quotationUrl) {
		return (
			<Button
				type="button"
				appearance="icon"
				variant="secondary"
				size="sm"
				Icon={Paperclip}
				aria-label={quotationLabel}
				isTooltip
				title={row.quotationFileName ?? "View quotation"}
				onClick={() => {
					window.open(quotationUrl, "_blank", "noopener,noreferrer");
				}}
			/>
		);
	}

	if (row.quotationFileName) {
		return (
			<span
				className="line-table-attachment-disabled"
				title={row.quotationFileName}
				aria-label={`Quotation attached: ${row.quotationFileName}`}
			>
				<Paperclip aria-hidden="true" />
			</span>
		);
	}

	return <span className="table-cell-secondary">--</span>;
};

const renderColumnValue = (row: TableRow, column: ColumnConfig) => {
	switch (column.key) {
		case "sno":
			return row.sno ?? "--";

		case "partNumber":
			return row.partNumber || "--";

		case "particular":
			return (
				<span className="line-table-primary-value">
					{row.particulars || "--"}
				</span>
			);

		case "description":
			return row.description || "--";

		case "rate":
			return (
				<span className="line-table-number">
					{formatDisplayNumber(row.rate)}
				</span>
			);

		case "quantity":
			return (
				<span className="line-table-number">{toDisplayNumber(row.qty)}</span>
			);

		case "total":
			return (
				<span className="line-table-total">
					{formatDisplayNumber(row.total)}
				</span>
			);

		case "width":
			return row.width ?? "--";

		case "height":
			return row.height ?? "--";

		case "unit":
			return row.unit ?? "--";

		case "quotation":
			return renderQuotation(row);

		default:
			return "--";
	}
};

const createTableColumns = (columns: ColumnConfig[]): ColumnDef<TableRow>[] => {
	return columns
		.filter((column) => column.key !== "actions")
		.map((column) => {
			const columnClass = getColumnWidthClass(column);

			return {
				id: String(column.key),

				header: column.label,

				enableSorting: false,

				meta: {
					align: column.align ?? "left",
					headerClassName: columnClass,
					cellClassName: columnClass,
				},

				cell: ({ row }) => renderColumnValue(row.original, column),
			};
		});
};

const LineTableView = ({
	title,
	data = [],
	showGrandTotal = false,
	grandTotalLabel = "Grand Total:",
}: LineTableViewProps) => {
	const groupedData = groupByCategory(data);
	const grandTotal = getGrandTotal(data);

	if (data.length === 0) {
		return (
			<section
				className="line-table-view"
				aria-label={title ?? "Line-item information"}
			>
				{title ? (
					<header className="line-table-view-header">
						<h3 className="line-table-view-title">{title}</h3>
					</header>
				) : null}

				<div className="line-table-group">
					<DataTable<TableRow>
						data={[]}
						columns={[
							{
								id: "details",
								header: "Details",
								enableSorting: false,
								cell: () => null,
							},
						]}
						enableSorting={false}
						enablePagination={false}
						emptyTitle="No line items available"
						emptyDescription="Line items will appear here after they are added."
						minWidth="sm"
						ariaLabel={title ?? "Line-item information"}
						tableClassName="line-table-data-table"
					/>
				</div>
			</section>
		);
	}

	return (
		<section
			className="line-table-view"
			aria-label={title ?? "Line-item information"}
		>
			{title ? (
				<header className="line-table-view-header">
					<h3 className="line-table-view-title">{title}</h3>
				</header>
			) : null}

			<div className="line-table-view-groups">
				{Object.entries(groupedData).map(([category, rows]) => {
					const categoryTitle = getCategoryTitle(category);

					const columns = createTableColumns(getColumnsForCategory(category));

					const itemCountLabel = `${rows.length} ${
						rows.length === 1 ? "item" : "items"
					}`;

					return (
						<section
							key={category}
							className="line-table-group"
							aria-labelledby={`line-table-${category}`}
						>
							<header className="line-table-group-header">
								<div className="line-table-group-heading">
									<span
										className="line-table-group-marker"
										aria-hidden="true"
									/>

									<h4
										id={`line-table-${category}`}
										className="line-table-group-title"
									>
										{categoryTitle}
									</h4>
								</div>

								<span className="line-table-group-count">{itemCountLabel}</span>
							</header>
							<DataTable<TableRow>
								data={rows}
								columns={columns}
								getRowId={(row, index) =>
									String(row.id ?? `${category}-${index}`)
								}
								enableSorting={false}
								enablePagination={false}
								minWidth="xl"
								tableClassName="line-table-data-table"
								ariaLabel={categoryTitle}
							/>
						</section>
					);
				})}
			</div>

			{showGrandTotal ? (
				<div className="line-table-grand-total">
					<span className="line-table-grand-total-label">
						{grandTotalLabel}
					</span>

					<strong className="line-table-grand-total-value">
						{grandTotal.toFixed(2)}
					</strong>
				</div>
			) : null}
		</section>
	);
};

export default LineTableView;
